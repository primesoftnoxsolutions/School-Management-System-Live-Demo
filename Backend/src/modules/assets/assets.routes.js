import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getAssets,
  getClassroom,
  getReport,
  getSummary,
  postAdjustStatus,
  putAsset,
} from "./assets.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/", ...access, getAssets);
router.get("/summary", ...access, getSummary);
router.get("/classroom", ...access, getClassroom);
router.get("/reports", ...access, getReport);
router.put("/:id", ...access, putAsset);
router.post("/:id/adjust-status", ...access, postAdjustStatus);

export default router;
