import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const sessionSecret =
  process.env.SESSION_SECRET ||
  (isProduction ? "" : "dev-session-secret-change-in-production");

if (isProduction) {
  if (!sessionSecret || sessionSecret === "dev-session-secret-change-in-production") {
    throw new Error(
      "SESSION_SECRET must be set to a strong random value in production. Example: openssl rand -hex 32"
    );
  }
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error("MONGODB_URI (or MONGO_URI) is required in production");
  }
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  sessionSecret: sessionSecret || crypto.randomBytes(32).toString("hex"),
  frontendUrl: process.env.FRONTEND_URL || (isProduction ? "" : "http://localhost:5173"),
  /** Set COOKIE_SECURE=false if deploying over plain HTTP (not recommended). */
  cookieSecure: isProduction && process.env.COOKIE_SECURE !== "false",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || "",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "",
  seedAdminName: process.env.SEED_ADMIN_NAME || "Super Admin",
  seedFinanceEmail: process.env.SEED_FINANCE_EMAIL || "",
  seedFinancePassword: process.env.SEED_FINANCE_PASSWORD || "",
  seedFinanceName: process.env.SEED_FINANCE_NAME || "Finance Manager",
};
