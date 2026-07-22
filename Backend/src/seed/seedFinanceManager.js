import { User } from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Creates a Finance Manager only when SEED_FINANCE_EMAIL and SEED_FINANCE_PASSWORD are set.
 * No hardcoded demo credentials.
 */
export const seedFinanceManager = async () => {
  const email = String(env.seedFinanceEmail || "")
    .toLowerCase()
    .trim();
  const password = String(env.seedFinancePassword || "");
  const fullName = env.seedFinanceName || "Finance Manager";

  if (!email || !password) {
    return;
  }

  let user = await User.findOne({ email, isDeleted: false }).select("+password");

  if (user) {
    if (user.role !== "ACCOUNTANT") {
      user.role = "ACCOUNTANT";
      user.updatedBy = "system";
      await user.save();
    }
    return;
  }

  const accountantCount = await User.countDocuments({ role: "ACCOUNTANT", isDeleted: false });
  if (accountantCount > 0) {
    console.log("Finance manager already exists — seed skipped.");
    return;
  }

  await User.create({
    fullName,
    email,
    password,
    role: "ACCOUNTANT",
    createdBy: "system",
    updatedBy: "system",
  });

  console.log(`Seeded finance manager: ${email}`);
};
