import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getMyClassReleasedResultCards,
  getMyReleasedDocument,
  getReleasedDocuments,
  getTeacherDocuments,
  postReleaseDateSheet,
  postReleaseResultCard,
  postReleaseResultCardsBatch,
  postReleaseRollSlips,
  putReleasedDocument,
} from "./academicDocuments.controller.js";

const router = Router();
const teacherOnly = [protect, authorize("TEACHER")];
const adminAccess = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];
const studentAccess = [protect, authorize("STUDENT")];
const readAccess = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT", "STUDENT")];

router.post("/release/roll-slips", ...teacherOnly, postReleaseRollSlips);
router.post("/release/date-sheets", ...teacherOnly, postReleaseDateSheet);
router.post("/release/result-cards", ...teacherOnly, postReleaseResultCard);
router.post("/release/result-cards/batch", ...teacherOnly, postReleaseResultCardsBatch);
router.get("/teacher", ...teacherOnly, getTeacherDocuments);
router.get("/released", ...readAccess, getReleasedDocuments);
router.get("/my", ...studentAccess, getMyReleasedDocument);
router.get("/my/class-result-cards", ...studentAccess, getMyClassReleasedResultCards);
router.put("/:id", ...adminAccess, putReleasedDocument);

export default router;
