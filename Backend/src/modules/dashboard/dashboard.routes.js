import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { superAdminDashboard, teacherDashboard, getPendingFees } from "./dashboard.controller.js";

const router = Router();

router.get("/super-admin", protect, authorize("SUPER_ADMIN"), superAdminDashboard);
router.get("/teacher", protect, authorize("TEACHER"), teacherDashboard);
router.get("/pending-fees", protect, authorize("SUPER_ADMIN", "ACCOUNTANT"), getPendingFees);

export default router;
