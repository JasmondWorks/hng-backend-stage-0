import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/app-error.util";
import { PrismaClient } from "@prisma/client";

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtAccessTokenSecret: string,
    private readonly jwtRefreshTokenSecret: string,
    private readonly jwtAccessTokenExpire: string,
    private readonly jwtRefreshTokenExpire: string,
    private readonly githubOauthBaseUrl: string,
    private readonly githubClientId: string,
    private readonly githubClientSecret: string,
    private readonly githubRedirectUri: string,
  ) {}

  buildGithubAuthUrl() {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const state = crypto.randomBytes(16).toString("base64url");

    const params = new URLSearchParams({
      client_id: this.githubClientId,
      redirect_uri: this.githubRedirectUri,
      // read:user  — basic profile (login, avatar, name)
      // user:email — private email addresses (required when email is not public)
      scope: "read:user user:email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    });

    const url = `${this.githubOauthBaseUrl}/authorize?${params.toString()}`;

    return { url, codeVerifier, state };
  }

  // Web flow: code_verifier was generated server-side and stored in a signed cookie
  async handleGithubCallback(code: string, codeVerifier: string) {
    const githubToken = await this.exchangeCodeForToken(
      code,
      codeVerifier,
      this.githubRedirectUri,
    );
    const githubUser = await this.fetchGithubProfile(githubToken);
    const email = await this.resolveEmail(githubToken, githubUser);
    const user = await this.upsertUser(githubUser, email);
    return this.issueTokens(user.id);
  }

  // CLI flow: the CLI generates its own code_verifier and a localhost redirect_uri,
  // captures the GitHub callback locally, then POSTs here with all three values.
  // We cannot use this.githubRedirectUri for the token exchange because GitHub
  // requires the redirect_uri to match what was used in the authorization URL.
  async handleCliCallback(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    const githubToken = await this.exchangeCodeForToken(
      code,
      codeVerifier,
      redirectUri,
    );
    const githubUser = await this.fetchGithubProfile(githubToken);
    const email = await this.resolveEmail(githubToken, githubUser);
    const user = await this.upsertUser(githubUser, email);
    return this.issueTokens(user.id);
  }

  private async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) {
    const response = await fetch(`${this.githubOauthBaseUrl}/access_token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.githubClientId,
        client_secret: this.githubClientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const data = (await response.json()) as {
      access_token: string;
      error?: string;
    };

    if (data.error) {
      throw new AppError("GitHub token exchange failed", 401);
    }

    return data.access_token;
  }

  private async fetchGithubProfile(githubToken: string) {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    if (!response.ok) {
      throw new AppError("Failed to fetch GitHub profile", 401);
    }

    return response.json();
  }

  // GitHub only returns email on /user when the user has made it public.
  // With the user:email scope we can call /user/emails to get private addresses.
  // As a last resort, every GitHub account has a unique noreply address.
  private async resolveEmail(
    githubToken: string,
    githubUser: any,
  ): Promise<string> {
    if (githubUser.email) return githubUser.email as string;

    try {
      const res = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${githubToken}` },
      });

      if (res.ok) {
        const emails = (await res.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;

        const primary = emails.find((e) => e.primary && e.verified);
        if (primary) return primary.email;

        const first = emails[0];
        if (first) return first.email;
      }
    } catch {
      // fall through to noreply
    }

    return `${githubUser.id}+${githubUser.login}@users.noreply.github.com`;
  }

  private async upsertUser(githubUser: any, email: string) {
    return this.prisma.user.upsert({
      where: { github_id: String(githubUser.id) },
      update: {
        username: githubUser.login,
        email,
        avatar_url: githubUser.avatar_url,
        last_login_at: new Date(),
      },
      create: {
        github_id: String(githubUser.id),
        username: githubUser.login,
        email,
        avatar_url: githubUser.avatar_url,
        last_login_at: new Date(),
      },
    });
  }

  async issueTokens(userId: string) {
    const accessToken = jwt.sign({ sub: userId }, this.jwtAccessTokenSecret, {
      expiresIn: this.jwtAccessTokenExpire as any,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const refreshTokenExpiryInMinutes = Number(this.jwtRefreshTokenExpire);
    const refreshTokenExpiryDate = new Date(
      Date.now() + refreshTokenExpiryInMinutes * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        user_id: userId,
        expires_at: refreshTokenExpiryDate,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  async refreshTokens(rawRefreshToken: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (!storedToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (storedToken.expires_at < new Date()) {
      await this.prisma.refreshToken.delete({ where: { token: hashedToken } });
      throw new AppError("Refresh token expired", 401);
    }

    await this.prisma.refreshToken.delete({ where: { token: hashedToken } });

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.user_id },
    });

    if (!user || !user.is_active) {
      throw new AppError("Account is inactive", 403);
    }

    return this.issueTokens(user.id);
  }

  async logout(rawRefreshToken: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (!storedToken) return;

    await this.prisma.refreshToken.delete({ where: { token: hashedToken } });
  }
}
