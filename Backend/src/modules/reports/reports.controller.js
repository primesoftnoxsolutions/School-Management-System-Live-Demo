import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAdmissionReport,
  getAttendanceReport,
  getFeeCollectionReport,
  getFineReport,
  getOverviewReport,
  getPayrollReport,
  getPendingFeesReport,
  getRefundReport,
  getStudentReport,
} from "./reports.service.js";

export const overview = asyncHandler(async (_req, res) => {
  const data = await getOverviewReport();
  res.status(200).json({ success: true, data });
});

export const feeCollection = asyncHandler(async (req, res) => {
  const data = await getFeeCollectionReport(req.query);
  res.status(200).json({ success: true, data });
});

export const pendingFees = asyncHandler(async (_req, res) => {
  const data = await getPendingFeesReport();
  res.status(200).json({ success: true, data });
});

export const refunds = asyncHandler(async (req, res) => {
  const data = await getRefundReport(req.query);
  res.status(200).json({ success: true, data });
});

export const fines = asyncHandler(async (req, res) => {
  const data = await getFineReport(req.query);
  res.status(200).json({ success: true, data });
});

export const payroll = asyncHandler(async (req, res) => {
  const data = await getPayrollReport(req.query);
  res.status(200).json({ success: true, data });
});

export const students = asyncHandler(async (req, res) => {
  const data = await getStudentReport(req.query);
  res.status(200).json({ success: true, data });
});

export const admissions = asyncHandler(async (req, res) => {
  const data = await getAdmissionReport(req.query);
  res.status(200).json({ success: true, data });
});

export const attendance = asyncHandler(async (req, res) => {
  const data = await getAttendanceReport(req.query);
  res.status(200).json({ success: true, data });
});
