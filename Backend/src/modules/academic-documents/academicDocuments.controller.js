import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getClassReleasedResultCardsForStudent,
  getReleasedDocumentForStudent,
  listReleasedDocuments,
  listTeacherDocuments,
  releaseDateSheet,
  releaseResultCard,
  releaseResultCardsBatch,
  releaseRollSlips,
  updateReleasedDocument,
} from "./academicDocuments.service.js";

export const postReleaseRollSlips = asyncHandler(async (req, res) => {
  const data = await releaseRollSlips(req.user._id.toString(), req.body);
  res.status(201).json({ success: true, data });
});

export const postReleaseDateSheet = asyncHandler(async (req, res) => {
  const data = await releaseDateSheet(req.user._id.toString(), req.body);
  res.status(201).json({ success: true, data });
});

export const postReleaseResultCard = asyncHandler(async (req, res) => {
  const data = await releaseResultCard(req.user._id.toString(), req.body);
  res.status(201).json({ success: true, data });
});

export const postReleaseResultCardsBatch = asyncHandler(async (req, res) => {
  const data = await releaseResultCardsBatch(req.user._id.toString(), req.body);
  res.status(201).json({ success: true, data });
});

export const getTeacherDocuments = asyncHandler(async (req, res) => {
  const data = await listTeacherDocuments(req.user._id.toString(), req.query);
  res.status(200).json({ success: true, data });
});

export const getReleasedDocuments = asyncHandler(async (req, res) => {
  const data = await listReleasedDocuments(req.query, {
    role: req.user?.role,
    userId: req.user?._id,
  });
  res.status(200).json({ success: true, data });
});

export const getMyReleasedDocument = asyncHandler(async (req, res) => {
  const documentType = String(req.query.documentType || "").trim().toUpperCase();
  const data = await getReleasedDocumentForStudent({
    documentType,
    studentId: req.user._id,
    term: req.query.term || "",
  });
  res.status(200).json({ success: true, data });
});

export const getMyClassReleasedResultCards = asyncHandler(async (req, res) => {
  const data = await getClassReleasedResultCardsForStudent(req.user._id);
  res.status(200).json({ success: true, data });
});

export const putReleasedDocument = asyncHandler(async (req, res) => {
  const data = await updateReleasedDocument(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});
