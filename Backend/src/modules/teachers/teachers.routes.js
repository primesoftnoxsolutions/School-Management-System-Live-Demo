import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { teacherDocumentsUpload } from "../../middleware/uploadTeacherDocuments.js";
import {
  createTeacherAccount,
  deleteTeacherAccount,
  getAssignmentHistory,
  getTeacherOwnPanel,
  getTeachers,
  getTeachersForClass,
  monitorTeacherActivities,
  putTeacherAccount,
  putTeacherOwnSignature,
} from "./teachers.controller.js";

const router = Router();

router.post("/", protect, authorize("SUPER_ADMIN"), teacherDocumentsUpload.array("documents", 10), createTeacherAccount);
router.get("/by-class", protect, authorize("SUPER_ADMIN", "ACCOUNTANT"), getTeachersForClass);
router.get("/assignment-history", protect, authorize("SUPER_ADMIN", "ACCOUNTANT"), getAssignmentHistory);
router.get("/", protect, authorize("SUPER_ADMIN", "ACCOUNTANT"), getTeachers);
router.get("/my-panel", protect, authorize("TEACHER"), getTeacherOwnPanel);
router.put("/my-panel/signature", protect, authorize("TEACHER"), putTeacherOwnSignature);
router.put("/:id", protect, authorize("SUPER_ADMIN"), teacherDocumentsUpload.array("documents", 10), putTeacherAccount);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deleteTeacherAccount);
router.get("/activities", protect, authorize("SUPER_ADMIN", "ACCOUNTANT"), monitorTeacherActivities);

export default router;
