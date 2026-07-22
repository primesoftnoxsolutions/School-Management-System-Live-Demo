import { AssetInventory } from "../models/AssetInventory.js";
import { FeePayment } from "../models/FeePayment.js";
import { Student } from "../models/Student.js";
import { TeacherClass } from "../models/TeacherClass.js";
import { TeacherProfile } from "../models/TeacherProfile.js";
import { User } from "../models/User.js";

/**
 * Showcase / Vercel demo dataset.
 * Idempotent: safe to re-run. Uses @insaf.demo accounts (not purged on startup).
 */

const FINANCE = {
  fullName: "Finance Manager",
  email: "finance@insaf.demo",
  password: "Finance@123",
};

const TEACHERS = [
  {
    fullName: "Imran Ali",
    email: "imran.ali@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Class Teacher",
      qualification: "M.A Education",
      expertise: "English / Class Incharge",
      phoneNumber: "0300-1112233",
      branch: "Boys",
      salary: 45000,
      classInchargeClasses: ["Grade 3"],
    },
    classes: [{ className: "Grade 3", section: "A", subject: "Class Teacher", branch: "Boys" }],
  },
  {
    fullName: "Usman Raza",
    email: "usman.raza@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Subject Teacher",
      qualification: "M.Sc Mathematics",
      expertise: "Mathematics",
      phoneNumber: "0301-2223344",
      branch: "Boys",
      salary: 48000,
    },
    classes: [
      { className: "Grade 6", section: "B", subject: "Mathematics", branch: "Boys" },
      { className: "Grade 5", section: "A", subject: "Mathematics", branch: "Boys" },
    ],
  },
  {
    fullName: "Ayesha Khan",
    email: "ayesha.khan@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Class Teacher",
      qualification: "B.Ed",
      expertise: "Primary",
      phoneNumber: "0302-3334455",
      branch: "Girls",
      salary: 42000,
      classInchargeClasses: ["Grade 2"],
    },
    classes: [{ className: "Grade 2", section: "A", subject: "Class Teacher", branch: "Girls" }],
  },
  {
    fullName: "Sana Bibi",
    email: "sana.bibi@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Subject Teacher",
      qualification: "M.Sc Biology",
      expertise: "Science",
      phoneNumber: "0303-4445566",
      branch: "Girls",
      salary: 46000,
    },
    classes: [{ className: "Grade 4", section: "B", subject: "Science", branch: "Girls" }],
  },
  {
    fullName: "Hira Fatima",
    email: "hira.fatima@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Class Teacher",
      qualification: "Montessori Diploma",
      expertise: "Early Years",
      phoneNumber: "0304-5556677",
      branch: "Girls",
      salary: 40000,
      classInchargeClasses: ["Play Group"],
    },
    classes: [{ className: "Play Group", section: "A", subject: "Class Teacher", branch: "Girls" }],
  },
  {
    fullName: "Kashif Raza",
    email: "kashif.raza@insaf.demo",
    password: "Teacher@123",
    profile: {
      designation: "Subject Teacher",
      qualification: "M.A Urdu",
      expertise: "Urdu",
      phoneNumber: "0305-6667788",
      branch: "Boys",
      salary: 43000,
    },
    classes: [{ className: "Grade 1", section: "A", subject: "Urdu", branch: "Boys" }],
  },
];

const STUDENTS = [
  {
    admissionNo: "IGS-2026-001",
    rollNumber: "01",
    firstName: "Ahmed",
    lastName: "Khan",
    fatherName: "Muhammad Khan",
    gender: "MALE",
    dateOfBirth: "2015-03-12",
    guardianName: "Muhammad Khan",
    guardianPhone: "0300-1010101",
    className: "Grade 3",
    section: "A",
    address: "Lahore",
    monthlyFee: 1600,
    admissionFee: 2000,
    loginId: "ahmed.khan@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-002",
    rollNumber: "02",
    firstName: "Bilal",
    lastName: "Ahmed",
    fatherName: "Saeed Ahmed",
    gender: "MALE",
    dateOfBirth: "2015-07-21",
    guardianName: "Saeed Ahmed",
    guardianPhone: "0301-2020202",
    className: "Grade 3",
    section: "A",
    address: "Lahore",
    monthlyFee: 1600,
    admissionFee: 2000,
    loginId: "bilal.ahmed@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-003",
    rollNumber: "05",
    firstName: "Hassan",
    lastName: "Raza",
    fatherName: "Ali Raza",
    gender: "MALE",
    dateOfBirth: "2012-01-09",
    guardianName: "Ali Raza",
    guardianPhone: "0302-3030303",
    className: "Grade 6",
    section: "B",
    address: "Lahore",
    monthlyFee: 1800,
    admissionFee: 2500,
    loginId: "hassan.raza@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-004",
    rollNumber: "03",
    firstName: "Omar",
    lastName: "Farooq",
    fatherName: "Farooq Ahmad",
    gender: "MALE",
    dateOfBirth: "2013-11-02",
    guardianName: "Farooq Ahmad",
    guardianPhone: "0303-4040404",
    className: "Grade 5",
    section: "A",
    address: "Lahore",
    monthlyFee: 1700,
    admissionFee: 2200,
    loginId: "omar.farooq@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-005",
    rollNumber: "01",
    firstName: "Fatima",
    lastName: "Ali",
    fatherName: "Imran Ali",
    gender: "FEMALE",
    dateOfBirth: "2016-05-18",
    guardianName: "Imran Ali",
    guardianPhone: "0304-5050505",
    className: "Grade 2",
    section: "A",
    address: "Lahore",
    monthlyFee: 1400,
    admissionFee: 1700,
    loginId: "fatima.ali@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-006",
    rollNumber: "04",
    firstName: "Ayesha",
    lastName: "Noor",
    fatherName: "Noor Muhammad",
    gender: "FEMALE",
    dateOfBirth: "2014-09-25",
    guardianName: "Noor Muhammad",
    guardianPhone: "0305-6060606",
    className: "Grade 4",
    section: "B",
    address: "Lahore",
    monthlyFee: 1600,
    admissionFee: 2000,
    loginId: "ayesha.noor@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-007",
    rollNumber: "02",
    firstName: "Zainab",
    lastName: "Bibi",
    fatherName: "Tariq Mehmood",
    gender: "FEMALE",
    dateOfBirth: "2018-02-14",
    guardianName: "Tariq Mehmood",
    guardianPhone: "0306-7070707",
    className: "Play Group",
    section: "A",
    address: "Lahore",
    monthlyFee: 1300,
    admissionFee: 1700,
    loginId: "zainab.bibi@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-008",
    rollNumber: "07",
    firstName: "Sara",
    lastName: "Malik",
    fatherName: "Asif Malik",
    gender: "FEMALE",
    dateOfBirth: "2016-12-01",
    guardianName: "Asif Malik",
    guardianPhone: "0307-8080808",
    className: "Grade 2",
    section: "A",
    address: "Lahore",
    monthlyFee: 1400,
    admissionFee: 1700,
    loginId: "sara.malik@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-009",
    rollNumber: "08",
    firstName: "Hamza",
    lastName: "Sheikh",
    fatherName: "Nadeem Sheikh",
    gender: "MALE",
    dateOfBirth: "2017-04-30",
    guardianName: "Nadeem Sheikh",
    guardianPhone: "0308-9090909",
    className: "Grade 1",
    section: "A",
    address: "Lahore",
    monthlyFee: 1400,
    admissionFee: 1700,
    loginId: "hamza.sheikh@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-010",
    rollNumber: "06",
    firstName: "Mina",
    lastName: "Shah",
    fatherName: "Javed Shah",
    gender: "FEMALE",
    dateOfBirth: "2014-08-08",
    guardianName: "Javed Shah",
    guardianPhone: "0309-1212121",
    className: "Grade 4",
    section: "B",
    address: "Lahore",
    monthlyFee: 1600,
    admissionFee: 2000,
    loginId: "mina.shah@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-011",
    rollNumber: "09",
    firstName: "Yusuf",
    lastName: "Iqbal",
    fatherName: "Iqbal Hussain",
    gender: "MALE",
    dateOfBirth: "2011-06-16",
    guardianName: "Iqbal Hussain",
    guardianPhone: "0310-1313131",
    className: "Grade 6",
    section: "B",
    address: "Lahore",
    monthlyFee: 1800,
    admissionFee: 2500,
    loginId: "yusuf.iqbal@insaf.demo",
    loginPassword: "Student@123",
  },
  {
    admissionNo: "IGS-2026-012",
    rollNumber: "10",
    firstName: "Maryam",
    lastName: "Siddiqui",
    fatherName: "Adnan Siddiqui",
    gender: "FEMALE",
    dateOfBirth: "2015-10-20",
    guardianName: "Adnan Siddiqui",
    guardianPhone: "0311-1414141",
    className: "Grade 3",
    section: "A",
    address: "Lahore",
    monthlyFee: 1600,
    admissionFee: 2000,
    loginId: "maryam.siddiqui@insaf.demo",
    loginPassword: "Student@123",
  },
];

const ASSETS = [
  {
    branch: "Boys",
    className: "Grade 3",
    section: "A",
    category: "DESKS",
    itemName: "Student Desks",
    working: 28,
    broken: 2,
    underMaintenance: 1,
    missing: 0,
    replaced: 0,
    totalPurchased: 31,
  },
  {
    branch: "Boys",
    className: "Grade 6",
    section: "B",
    category: "PROJECTORS",
    itemName: "Classroom Projector",
    working: 1,
    broken: 0,
    underMaintenance: 0,
    missing: 0,
    replaced: 0,
    totalPurchased: 1,
  },
  {
    branch: "Girls",
    className: "Grade 2",
    section: "A",
    category: "CHAIRS",
    itemName: "Student Chairs",
    working: 30,
    broken: 1,
    underMaintenance: 0,
    missing: 0,
    replaced: 0,
    totalPurchased: 31,
  },
  {
    branch: "Girls",
    className: "Play Group",
    section: "A",
    category: "OTHER",
    itemName: "Activity Kits",
    working: 12,
    broken: 0,
    underMaintenance: 1,
    missing: 0,
    replaced: 0,
    totalPurchased: 13,
  },
];

const upsertUser = async ({ fullName, email, password, role }) => {
  const normalized = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalized }).select("+password");
  if (user) {
    user.fullName = fullName;
    user.role = role;
    user.isActive = true;
    user.isDeleted = false;
    user.password = password;
    user.updatedBy = "showcase-seed";
    await user.save();
    return user;
  }
  return User.create({
    fullName,
    email: normalized,
    password,
    role,
    isActive: true,
    createdBy: "showcase-seed",
    updatedBy: "showcase-seed",
  });
};

export const seedShowcaseData = async () => {
  const finance = await upsertUser({ ...FINANCE, role: "ACCOUNTANT" });

  const teacherIds = [];
  for (const teacher of TEACHERS) {
    const user = await upsertUser({
      fullName: teacher.fullName,
      email: teacher.email,
      password: teacher.password,
      role: "TEACHER",
    });
    teacherIds.push(user._id);

    await TeacherProfile.findOneAndUpdate(
      { teacherId: user._id },
      {
        $set: {
          ...teacher.profile,
          loginPassword: teacher.password,
          allowPasswordReset: true,
          isDeleted: false,
          updatedBy: "showcase-seed",
        },
        $setOnInsert: {
          teacherId: user._id,
          createdBy: "showcase-seed",
        },
      },
      { upsert: true, new: true }
    );

    for (const assignment of teacher.classes) {
      await TeacherClass.findOneAndUpdate(
        {
          teacherId: user._id,
          className: assignment.className,
          section: assignment.section,
          subject: assignment.subject,
        },
        {
          $set: {
            branch: assignment.branch,
            isDeleted: false,
            updatedBy: "showcase-seed",
          },
          $setOnInsert: {
            teacherId: user._id,
            className: assignment.className,
            section: assignment.section,
            subject: assignment.subject,
            createdBy: "showcase-seed",
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  const students = [];
  for (const row of STUDENTS) {
    const student = await Student.findOneAndUpdate(
      { admissionNo: row.admissionNo },
      {
        $set: {
          ...row,
          dateOfBirth: new Date(row.dateOfBirth),
          admissionDate: new Date("2026-01-15"),
          status: "ACTIVE",
          enrollmentStatus: "ENROLLED",
          portalAccessEnabled: true,
          admissionFeePaid: true,
          isDeleted: false,
          updatedBy: "showcase-seed",
        },
        $setOnInsert: {
          createdBy: "showcase-seed",
        },
      },
      { upsert: true, new: true }
    );
    students.push(student);
  }

  for (const asset of ASSETS) {
    await AssetInventory.findOneAndUpdate(
      {
        branch: asset.branch,
        className: asset.className,
        section: asset.section,
        category: asset.category,
        isDeleted: false,
      },
      {
        $set: {
          ...asset,
          lastPurchaseDate: new Date("2026-02-01"),
          updatedBy: "showcase-seed",
        },
        $setOnInsert: {
          createdBy: "showcase-seed",
        },
      },
      { upsert: true, new: true }
    );
  }

  // A few fee receipts so Finance screens look populated
  const feeSeeds = [
    { student: students[0], amount: 1600, receiptNo: "RCP-DEMO-001", month: "2026-06" },
    { student: students[1], amount: 1600, receiptNo: "RCP-DEMO-002", month: "2026-06" },
    { student: students[4], amount: 1400, receiptNo: "RCP-DEMO-003", month: "2026-06" },
    { student: students[5], amount: 1600, receiptNo: "RCP-DEMO-004", month: "2026-05" },
  ];

  for (const fee of feeSeeds) {
    if (!fee.student?._id) continue;
    await FeePayment.findOneAndUpdate(
      { receiptNo: fee.receiptNo },
      {
        $set: {
          studentId: fee.student._id,
          feeType: "TUITION",
          amount: fee.amount,
          discount: 0,
          fineAmount: 0,
          netAmount: fee.amount,
          paymentMethod: "CASH",
          month: fee.month,
          academicYear: "2025-2026",
          paidAt: new Date(`${fee.month}-10`),
          receivedBy: finance._id,
          isDeleted: false,
          updatedBy: "showcase-seed",
        },
        $setOnInsert: {
          createdBy: "showcase-seed",
        },
      },
      { upsert: true, new: true }
    );
  }

  return {
    financeEmail: FINANCE.email,
    teachers: TEACHERS.length,
    students: STUDENTS.length,
    assets: ASSETS.length,
    fees: feeSeeds.length,
  };
};
