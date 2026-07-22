import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./modules/auth/auth.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import admissionsRoutes from "./modules/admissions/admissions.routes.js";
import teachersRoutes from "./modules/teachers/teachers.routes.js";
import teacherPanelRoutes from "./modules/teacher-panel/teacherPanel.routes.js";
import studentsRoutes from "./modules/students/students.routes.js";
import feesRoutes from "./modules/fees/fees.routes.js";
import feeRefundsRoutes from "./modules/fee-refunds/feeRefunds.routes.js";
import finesRoutes from "./modules/fines/fines.routes.js";
import payrollRoutes from "./modules/payroll/payroll.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import teacherAttendanceRoutes from "./modules/teacher-attendance/teacherAttendance.routes.js";
import schoolLeavingRoutes from "./modules/school-leaving/schoolLeaving.routes.js";
import timetablesRoutes from "./modules/timetables/timetables.routes.js";
import academicDocumentsRoutes from "./modules/academic-documents/academicDocuments.routes.js";
import purchasesRoutes from "./modules/purchases/purchases.routes.js";
import assetsRoutes from "./modules/assets/assets.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { sessionMiddleware } from "./middleware/sessionMiddleware.js";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

if (env.isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const corsOrigin = env.isProduction
  ? env.frontendUrl
    ? [
        env.frontendUrl.replace(/\/$/, ""),
        "https://school-management-system-live-demo.vercel.app",
      ].filter((value, index, list) => list.indexOf(value) === index)
    : true
  : "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / curl have no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigin === true) {
        callback(null, true);
        return;
      }
      const allowed = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(sessionMiddleware);
app.use("/api/v1/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ success: true, message: "School ERP API healthy" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admissions", admissionsRoutes);
app.use("/api/v1/teachers", teachersRoutes);
app.use("/api/v1/teacher-panel", teacherPanelRoutes);
app.use("/api/v1/students", studentsRoutes);
app.use("/api/v1/fees", feesRoutes);
app.use("/api/v1/fee-refunds", feeRefundsRoutes);
app.use("/api/v1/fines", finesRoutes);
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/v1/school-leaving", schoolLeavingRoutes);
app.use("/api/v1/timetables", timetablesRoutes);
app.use("/api/v1/academic-documents", academicDocumentsRoutes);
app.use("/api/v1/purchases", purchasesRoutes);
app.use("/api/v1/assets", assetsRoutes);

const clientDist = path.resolve(__dirname, "../../Frontend/dist");
const indexHtml = path.join(clientDist, "index.html");
const serveClient = fs.existsSync(indexHtml);

if (serveClient) {
  app.use(express.static(clientDist, { index: false, maxAge: env.isProduction ? "1d" : 0 }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
