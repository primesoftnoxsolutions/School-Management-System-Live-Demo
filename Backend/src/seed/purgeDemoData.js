import { Student } from "../models/Student.js";
import { TeacherClass } from "../models/TeacherClass.js";
import { TeacherProfile } from "../models/TeacherProfile.js";
import { User } from "../models/User.js";

/** Known demo / scaffold accounts that must not remain in a live database. */
const DEMO_USER_EMAILS = [
  "admin@schoolerp.local",
  "finance@schoolerp.local",
  "accountant@schoolerp.local",
  "teacher@schoolerp.local",
];

const DEMO_STUDENT_LOGIN_IDS = ["student@schoolerp.local"];
const DEMO_STUDENT_ADMISSION_NOS = ["DEV-STUDENT-001"];

/**
 * Soft-deletes scaffold demo users/students created by earlier development seeds.
 */
export const purgeDemoData = async () => {
  const demoUsers = await User.find({
    email: { $in: DEMO_USER_EMAILS },
    isDeleted: false,
  }).select("_id email");

  if (demoUsers.length) {
    const teacherIds = demoUsers.map((u) => u._id);

    await User.updateMany(
      { _id: { $in: teacherIds } },
      { $set: { isDeleted: true, isActive: false, updatedBy: "system" } }
    );

    await TeacherProfile.updateMany(
      { teacherId: { $in: teacherIds } },
      { $set: { isDeleted: true, updatedBy: "system" } }
    );

    await TeacherClass.updateMany(
      { teacherId: { $in: teacherIds } },
      { $set: { isDeleted: true, updatedBy: "system" } }
    );

    console.log(`Removed demo users: ${demoUsers.map((u) => u.email).join(", ")}`);
  }

  const studentResult = await Student.updateMany(
    {
      isDeleted: false,
      $or: [
        { loginId: { $in: DEMO_STUDENT_LOGIN_IDS } },
        { admissionNo: { $in: DEMO_STUDENT_ADMISSION_NOS } },
        { rollNumber: "DEV-01" },
      ],
    },
    { $set: { isDeleted: true, status: "INACTIVE", updatedBy: "system" } }
  );

  if (studentResult.modifiedCount > 0) {
    console.log(`Removed ${studentResult.modifiedCount} demo student record(s)`);
  }
};
