import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getDashboard,
  getPayrollStaff,
  getPayrolls,
  getReport,
  postMarkPaid,
  postPayroll,
  putPayroll,
  removePayroll,
} from "./payroll.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/", ...access, getPayrolls);
router.get("/staff", ...access, getPayrollStaff);
router.get("/dashboard", ...access, getDashboard);
router.get("/reports", ...access, getReport);
router.post("/", ...access, postPayroll);
router.put("/:id", ...access, putPayroll);
router.post("/:id/pay", ...access, postMarkPaid);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), removePayroll);

export default router;
