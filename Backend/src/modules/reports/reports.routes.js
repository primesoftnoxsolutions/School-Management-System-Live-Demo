import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  admissions,
  attendance,
  feeCollection,
  fines,
  overview,
  payroll,
  pendingFees,
  refunds,
  students,
} from "./reports.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/overview", ...access, overview);
router.get("/fee-collection", ...access, feeCollection);
router.get("/pending-fees", ...access, pendingFees);
router.get("/refunds", ...access, refunds);
router.get("/fines", ...access, fines);
router.get("/payroll", ...access, payroll);
router.get("/students", ...access, students);
router.get("/admissions", ...access, admissions);
router.get("/attendance", ...access, attendance);

export default router;
