function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[env] Required environment variable ${name} is not set. Refusing to start in production.`);
    }
    console.warn(`[env] WARNING: ${name} is not set. Using insecure dev default — do NOT use in production.`);
    return devFallback;
  }
  return value;
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: requireSecret("JWT_SECRET", "dev-secret-change-in-production"),
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
