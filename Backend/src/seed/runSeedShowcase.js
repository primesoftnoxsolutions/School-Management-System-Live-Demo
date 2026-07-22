import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { seedShowcaseData } from "./seedShowcaseData.js";
import { seedSuperAdmin } from "./seedSuperAdmin.js";

const run = async () => {
  await connectDB();
  await seedSuperAdmin();
  const result = await seedShowcaseData();

  console.log("Showcase demo data ready:");
  console.log(`  Teachers: ${result.teachers}`);
  console.log(`  Students: ${result.students}`);
  console.log(`  Assets:   ${result.assets}`);
  console.log(`  Fees:     ${result.fees}`);
  console.log("");
  console.log("Login accounts:");
  console.log("  Super Admin:  admin@yourschool.com / ChangeMe@123  (from .env SEED_ADMIN_*)");
  console.log("  Finance:      finance@insaf.demo / Finance@123");
  console.log("  Teacher:      imran.ali@insaf.demo / Teacher@123");
  console.log("  Student:      ahmed.khan@insaf.demo / Student@123");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Showcase seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
