import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  console.error("Missing MONGODB_URI / MONGO_URI in backend/.env");
  process.exit(1);
}

await mongoose.connect(uri);
const result = await mongoose.connection.db.collection("teacherdailyattendances").deleteMany({});
console.log(`Deleted ${result.deletedCount} teacher attendance record(s).`);
await mongoose.disconnect();
