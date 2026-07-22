import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getFeeAssignments,
  getFeePayments,
  getFeeSlip,
  getPendingFees,
  postFeeAssignment,
  postFeePayment,
  putFeeAssignment,
  removeFeeAssignment,
  removeFeePayment,
} from "./fees.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];
const adminOnly = [protect, authorize("SUPER_ADMIN")];

router.get("/assignments", ...access, getFeeAssignments);
router.post("/assignments", ...access, postFeeAssignment);
router.put("/assignments/:id", ...adminOnly, putFeeAssignment);
router.delete("/assignments/:id", ...adminOnly, removeFeeAssignment);

router.get("/payments", ...access, getFeePayments);
router.post("/payments", ...access, postFeePayment);
router.get("/payments/:id/slip", ...access, getFeeSlip);
router.delete("/payments/:id", ...adminOnly, removeFeePayment);

router.get("/pending", ...access, getPendingFees);

export default router;
