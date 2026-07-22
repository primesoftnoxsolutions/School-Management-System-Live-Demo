import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAssignment,
  deleteAssignment,
  deletePayment,
  getPaymentSlip,
  getPendingFeesSummary,
  listAssignments,
  listPayments,
  receivePayment,
  updateAssignment,
} from "./fees.service.js";

export const getFeeAssignments = asyncHandler(async (req, res) => {
  const data = await listAssignments(req.query);
  res.status(200).json({ success: true, data });
});

export const postFeeAssignment = asyncHandler(async (req, res) => {
  const data = await createAssignment(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

export const putFeeAssignment = asyncHandler(async (req, res) => {
  const data = await updateAssignment(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const removeFeeAssignment = asyncHandler(async (req, res) => {
  const data = await deleteAssignment(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const getFeePayments = asyncHandler(async (req, res) => {
  const data = await listPayments(req.query);
  res.status(200).json({ success: true, data });
});

export const postFeePayment = asyncHandler(async (req, res) => {
  const data = await receivePayment(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

export const getFeeSlip = asyncHandler(async (req, res) => {
  const data = await getPaymentSlip(req.params.id);
  res.status(200).json({ success: true, data });
});

export const removeFeePayment = asyncHandler(async (req, res) => {
  const data = await deletePayment(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const getPendingFees = asyncHandler(async (req, res) => {
  const data = await getPendingFeesSummary(req.query);
  res.status(200).json({ success: true, data });
});
