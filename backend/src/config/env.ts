import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: requireEnv("NODE_ENV", "development"),
  port: Number(requireEnv("PORT", "4000")),
  databaseUrl: requireEnv("DATABASE_URL"),
  corsOrigin: requireEnv("CORS_ORIGIN", "http://localhost:5173"),
  jwtSecret: requireEnv("JWT_SECRET", "dev-secret"),
  erpWebhookSecret: requireEnv("ERP_WEBHOOK_SECRET", "dev-secret"),
  erpBaseUrl: process.env.ERP_BASE_URL ?? "",
};
