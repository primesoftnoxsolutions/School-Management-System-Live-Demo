import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let memoryServer = null;

const connectWithUri = async (uri) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
};

/** Disk-backed local DB so data survives restarts when MongoDB service is unavailable. */
const startPersistentLocalDb = async () => {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = path.resolve(__dirname, "../../.data/mongodb");
  fs.mkdirSync(dbPath, { recursive: true });

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: "school_erp",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });

  const memoryUri = memoryServer.getUri("school_erp");
  await connectWithUri(memoryUri);
  console.log("MongoDB connected (persistent local database)");
  console.log(`Data directory: ${dbPath}`);
  console.log("Tip: Install/start MongoDB service for a full install: npm run mongo:start");
};

export const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error("Missing MONGODB_URI in environment");
  }

  try {
    await connectWithUri(env.mongodbUri);
    console.log("MongoDB connected");
    return;
  } catch (error) {
    const isLocalMongo =
      env.mongodbUri.includes("127.0.0.1") || env.mongodbUri.includes("localhost");
    const canUseLocalFallback = env.nodeEnv !== "production" && isLocalMongo;

    if (!canUseLocalFallback) {
      throw new Error(
        `MongoDB connection failed: ${error.message}. Start MongoDB service or update MONGODB_URI.`
      );
    }

    console.warn(
      `Local MongoDB is not reachable (${error.message}). Using persistent local database so your data is kept.`
    );
    await startPersistentLocalDb();
  }
};
