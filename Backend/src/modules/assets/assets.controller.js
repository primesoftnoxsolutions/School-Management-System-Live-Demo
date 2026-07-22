import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  adjustAssetStatus,
  getAssetReport,
  getAssetSummary,
  getClassroomAssets,
  listAssets,
  updateAssetInventory,
} from "./assets.service.js";

export const getAssets = asyncHandler(async (req, res) => {
  const data = await listAssets(req.query);
  res.status(200).json({ success: true, data });
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await getAssetSummary(req.query);
  res.status(200).json({ success: true, data });
});

export const getClassroom = asyncHandler(async (req, res) => {
  const data = await getClassroomAssets(req.query);
  res.status(200).json({ success: true, data });
});

export const putAsset = asyncHandler(async (req, res) => {
  const data = await updateAssetInventory(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postAdjustStatus = asyncHandler(async (req, res) => {
  const data = await adjustAssetStatus(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const getReport = asyncHandler(async (req, res) => {
  const data = await getAssetReport(req.query);
  res.status(200).json({ success: true, data });
});
