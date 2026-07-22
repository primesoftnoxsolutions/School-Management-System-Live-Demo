import { User } from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Ensures Super Admin exists from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 * Updates password when the seed email already exists (so Railway redeploys keep login working).
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
    let changed = false;
    if (user.role !== "SUPER_ADMIN") {
      user.role = "SUPER_ADMIN";
      changed = true;
    }
    if (!user.isActive) {
      user.isActive = true;
      changed = true;
    }
    // Always sync seed password so demo / Railway logins stay predictable.
    user.password = password;
    user.updatedBy = "system";
    changed = true;
    if (changed) {
      await user.save();
      console.log(`Updated seed super admin: ${email}`);
    }
    return;
  }

  const adminCount = await User.countDocuments({ role: "SUPER_ADMIN", isDeleted: false });
  if (adminCount > 0) {
    // Another admin exists under a different email — still create this seed account for demos.
    console.log("Another super admin exists; creating seed admin account anyway.");
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
