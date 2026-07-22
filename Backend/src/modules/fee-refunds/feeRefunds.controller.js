import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createRefund,
  deleteRefund,
  listRefunds,
  updateRefundStatus,
} from "./feeRefunds.service.js";

export const getRefunds = asyncHandler(async (req, res) => {
  const data = await listRefunds(req.query);
  res.status(200).json({ success: true, data });
});

export const postRefund = asyncHandler(async (req, res) => {
  const data = await createRefund(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

export const putRefundStatus = asyncHandler(async (req, res) => {
  const data = await updateRefundStatus(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const removeRefund = asyncHandler(async (req, res) => {
  const data = await deleteRefund(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});
