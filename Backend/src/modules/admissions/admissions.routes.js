import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { createAdmission, getNextAdmissionNumber, listAdmissions } from "./admissions.controller.js";

const router = Router();

router.get("/", protect, authorize("SUPER_ADMIN", "TEACHER"), listAdmissions);
router.get("/next-number", protect, authorize("SUPER_ADMIN"), getNextAdmissionNumber);
router.post("/", protect, authorize("SUPER_ADMIN"), createAdmission);

export default router;
