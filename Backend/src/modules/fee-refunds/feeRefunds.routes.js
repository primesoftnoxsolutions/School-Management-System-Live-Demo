import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { getRefunds, postRefund, putRefundStatus, removeRefund } from "./feeRefunds.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/", ...access, getRefunds);
router.post("/", ...access, postRefund);
router.put("/:id/status", ...access, putRefundStatus);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), removeRefund);

export default router;
