import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { getTimeTable, putTimeTable } from "./timetables.controller.js";

const router = Router();
const allowedRoles = ["SUPER_ADMIN", "ACCOUNTANT", "TEACHER", "STUDENT"];

router.get("/", protect, authorize(...allowedRoles), getTimeTable);
router.put("/", protect, authorize("SUPER_ADMIN", "TEACHER"), putTimeTable);

export default router;
