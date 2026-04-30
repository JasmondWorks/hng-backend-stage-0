export const envConfig = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  debug: process.env.APP_DEBUG === "true",
  genderizeApiUrl: process.env.GENDERIZE_API_URL || "https://api.genderize.io",
  agifyApiUrl: process.env.AGIFY_API_URL || "https://api.agify.io",
  nationalizeApiUrl:
    process.env.NATIONALIZE_API_URL || "https://api.nationalize.io",
  // mongoUrl: process.env.MONGO_URL!,

  databaseUrl: process.env.DATABASE_URL!,

  githubClientId: process.env.GITHUB_CLIENT_ID!,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
  githubRedirectUri: process.env.GITHUB_REDIRECT_URI!,
  githubOauthBaseUrl: process.env.GITHUB_OAUTH_BASE_URL!,

  jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET!,
  jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET!,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE!,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE!,
};

const requiredEnvVars = [
  "databaseUrl",
  "genderizeApiUrl",
  "agifyApiUrl",
  "nationalizeApiUrl",
  "port",
  "env",
  "githubClientId",
  "githubClientSecret",
  "githubRedirectUri",
  "githubOauthBaseUrl",
  "jwtAccessTokenSecret",
  "jwtRefreshTokenSecret",
  "accessTokenExpiresIn",
  "refreshTokenExpiresIn",
];

requiredEnvVars.forEach((envVar) => {
  if (!envConfig[envVar as keyof typeof envConfig]) {
    console.error(`[CRITICAL] Environment variable ${envVar} is not defined!`);
  }
});
