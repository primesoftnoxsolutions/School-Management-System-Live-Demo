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

/** Strip quotes/whitespace and accidental `KEY=` prefixes from Railway paste. */
const cleanEnvValue = (value = "", keyNames = []) => {
  let next = String(value || "").trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }

  // Users often paste the whole .env line as the variable value, e.g. MONGODB_URI=mongodb://...
  for (const key of keyNames) {
    const prefix = `${key}=`;
    if (next.toUpperCase().startsWith(prefix.toUpperCase())) {
      next = next.slice(prefix.length).trim();
      break;
    }
  }

  return next;
};

const resolveMongodbUri = () => {
  const raw =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    "";
  return cleanEnvValue(raw, ["MONGODB_URI", "MONGO_URI", "MONGO_URL", "DATABASE_URL"]);
};

const sessionSecret =
  cleanEnvValue(process.env.SESSION_SECRET, ["SESSION_SECRET"]) ||
  (isProduction ? "" : "dev-session-secret-change-in-production");

const mongodbUri = resolveMongodbUri();

if (isProduction) {
  if (!sessionSecret || sessionSecret === "dev-session-secret-change-in-production") {
    throw new Error(
      "SESSION_SECRET must be set to a strong random value in production. Example: openssl rand -hex 32"
    );
  }
  if (!mongodbUri) {
    throw new Error(
      "MONGODB_URI is required in production. Set it in Railway Variables to a full Atlas URI starting with mongodb:// or mongodb+srv://"
    );
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(mongodbUri)) {
    const preview = mongodbUri.slice(0, 24).replace(/./g, (ch, i) => (i < 12 ? ch : "*"));
    throw new Error(
      `MONGODB_URI must start with "mongodb://" or "mongodb+srv://". Current value starts with "${preview}..." — remove quotes and paste the full connection string in Railway Variables.`
    );
  }
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongodbUri,
  sessionSecret: sessionSecret || crypto.randomBytes(32).toString("hex"),
  frontendUrl:
    cleanEnvValue(process.env.FRONTEND_URL, ["FRONTEND_URL"]) ||
    (isProduction ? "" : "http://localhost:5173"),
  /** Set COOKIE_SECURE=false if deploying over plain HTTP (not recommended). */
  cookieSecure: isProduction && process.env.COOKIE_SECURE !== "false",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || "",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "",
  seedAdminName: process.env.SEED_ADMIN_NAME || "Super Admin",
  seedFinanceEmail: process.env.SEED_FINANCE_EMAIL || "",
  seedFinancePassword: process.env.SEED_FINANCE_PASSWORD || "",
  seedFinanceName: process.env.SEED_FINANCE_NAME || "Finance Manager",
};
