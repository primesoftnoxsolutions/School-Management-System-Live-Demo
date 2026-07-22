/** Frontend-only demo accounts for Vercel / offline previews (no backend). */

export const DEMO_USERS = [
  {
    email: "admin@yourschool.com",
    password: "ChangeMe@123",
    role: "SUPER_ADMIN",
    user: {
      id: "demo-super-admin",
      fullName: "Super Admin",
      email: "admin@yourschool.com",
      role: "SUPER_ADMIN",
    },
  },
  {
    email: "finance@insaf.demo",
    password: "Finance@123",
    role: "ACCOUNTANT",
    user: {
      id: "demo-finance-manager",
      fullName: "Finance Manager",
      email: "finance@insaf.demo",
      role: "ACCOUNTANT",
    },
  },
  {
    email: "imran.ali@insaf.demo",
    password: "Teacher@123",
    role: "TEACHER",
    user: {
      id: "demo-teacher",
      fullName: "Imran Ali",
      email: "imran.ali@insaf.demo",
      role: "TEACHER",
    },
  },
  {
    email: "ahmed.khan@insaf.demo",
    password: "Student@123",
    role: "STUDENT",
    user: {
      id: "demo-student",
      _id: "demo-student",
      firstName: "Ahmed",
      lastName: "Khan",
      fullName: "Ahmed Khan",
      email: "ahmed.khan@insaf.demo",
      role: "STUDENT",
      admissionNo: "IGHS-2024-001",
      rollNumber: "01",
      fatherName: "Khan",
      guardianName: "Khan",
      studentPhotoUrl: null,
      className: "10",
      section: "A",
    },
  },
];

const DEMO_SESSION_KEY = "demoAuthUser";

export const USE_DEMO_AUTH = import.meta.env.VITE_USE_DEMO_AUTH !== "false";

export function getDemoCredentialsForRole(role) {
  const match = DEMO_USERS.find((entry) => entry.role === role);
  if (!match) return { email: "", password: "" };
  return { email: match.email, password: match.password };
}

export function authenticateDemo({ email, password, role }) {
  const login = String(email || "").trim().toLowerCase();
  const pass = String(password || "");
  const requestedRole = String(role || "").trim().toUpperCase();

  const match = DEMO_USERS.find(
    (entry) =>
      entry.role === requestedRole &&
      entry.email.toLowerCase() === login &&
      entry.password === pass
  );

  if (!match) {
    const error = new Error("Wrong login details");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  return { ...match.user };
}

export function storeDemoUser(user) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  sessionStorage.setItem("hadSession", "1");
}

export function getStoredDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredDemoUser() {
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem("hadSession");
}
