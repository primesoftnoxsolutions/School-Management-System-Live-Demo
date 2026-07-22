import { User } from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Creates the first Super Admin only when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set.
 * No hardcoded demo credentials.
 */
export const seedSuperAdmin = async () => {
  const email = String(env.seedAdminEmail || "")
    .toLowerCase()
    .trim();
  const password = String(env.seedAdminPassword || "");
  const fullName = env.seedAdminName || "Super Admin";

  if (!email || !password) {
    const adminCount = await User.countDocuments({ role: "SUPER_ADMIN", isDeleted: false });
    if (adminCount === 0) {
      console.warn(
        "No Super Admin found. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create the first admin."
      );
    }
    return;
  }

  let user = await User.findOne({ email, isDeleted: false }).select("+password");

  if (user) {
    if (user.role !== "SUPER_ADMIN") {
      user.role = "SUPER_ADMIN";
      user.updatedBy = "system";
      await user.save();
    }
    return;
  }

  const adminCount = await User.countDocuments({ role: "SUPER_ADMIN", isDeleted: false });
  if (adminCount > 0) {
    console.log("Super admin already exists — seed skipped.");
    return;
  }

  await User.create({
    fullName,
    email,
    password,
    role: "SUPER_ADMIN",
    createdBy: "system",
    updatedBy: "system",
  });

  console.log(`Seeded super admin: ${email}`);
};
