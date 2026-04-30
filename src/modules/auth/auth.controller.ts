import { type Request, type Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/api-response.util";
import { AppError } from "../../utils/app-error.util";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Web flow — server generates code_verifier, stores it in a signed cookie,
  // then redirects the browser to GitHub.
  async githubAuth(_: Request, res: Response) {
    const { url, codeVerifier, state } = this.authService.buildGithubAuthUrl();

    res.cookie("pkce_verifier", codeVerifier, {
      httpOnly: true,
      signed: true,
      maxAge: 5 * 60 * 1000,
    });

    res.cookie("oauth_state", state, {
      httpOnly: true,
      signed: true,
      maxAge: 5 * 60 * 1000,
    });

    return res.redirect(url);
  }

  // Web flow callback — GitHub redirects here after user authorises.
  async githubCallback(req: Request, res: Response) {
    const { code, state } = req.query;
    if (
      !code ||
      !state ||
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      throw new AppError("Invalid or expired OAuth state", 400);
    }

    const storedState = req.signedCookies["oauth_state"];
    const codeVerifier = req.signedCookies["pkce_verifier"];

    if (!storedState || storedState !== state || !codeVerifier) {
      throw new AppError("Invalid or expired OAuth state", 400);
    }

    res.clearCookie("pkce_verifier");
    res.clearCookie("oauth_state");

    const tokens = await this.authService.handleGithubCallback(
      code,
      codeVerifier,
    );

    return res.json({ status: "success", ...tokens });
  }

  // CLI flow — the CLI generates code_verifier + state locally, opens the
  // GitHub OAuth URL in the browser, starts a local server to capture the
  // redirect, then POSTs the code + code_verifier here.
  // The redirect_uri must be the localhost URL the CLI used in the auth request.
  async githubCliToken(req: Request, res: Response) {
    const { code, code_verifier, redirect_uri } = req.body as {
      code?: string;
      code_verifier?: string;
      redirect_uri?: string;
    };

    if (!code || !code_verifier || !redirect_uri) {
      throw new AppError(
        "code, code_verifier, and redirect_uri are required",
        400,
      );
    }

    const tokens = await this.authService.handleCliCallback(
      code,
      code_verifier,
      redirect_uri,
    );

    sendSuccess(res, tokens, { statusCode: 200 });
  }

  async refresh(req: Request, res: Response) {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw new AppError("Refresh token is required", 400);
    }

    const tokens = await this.authService.refreshTokens(refresh_token);
    sendSuccess(res, tokens, { statusCode: 200 });
  }

  async logout(req: Request, res: Response) {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw new AppError("Refresh token is required", 400);
    }

    await this.authService.logout(refresh_token);
    sendSuccess(res, { message: "Logged out successfully" }, { statusCode: 200 });
  }
}
