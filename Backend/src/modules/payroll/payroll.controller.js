import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPayroll,
  deletePayroll,
  getPayrollDashboard,
  getPayrollReportData,
  getStaffOptions,
  listPayroll,
  markPayrollPaid,
  updatePayroll,
} from "./payroll.service.js";

export const getPayrolls = asyncHandler(async (req, res) => {
  const data = await listPayroll(req.query);
  res.status(200).json({ success: true, data });
});

export const getPayrollStaff = asyncHandler(async (_req, res) => {
  const data = await getStaffOptions();
  res.status(200).json({ success: true, data });
});

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await getPayrollDashboard();
  res.status(200).json({ success: true, data });
});

export const getReport = asyncHandler(async (req, res) => {
  const data = await getPayrollReportData(req.query);
  res.status(200).json({ success: true, data });
});

export const postPayroll = asyncHandler(async (req, res) => {
  const data = await createPayroll(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

export const putPayroll = asyncHandler(async (req, res) => {
  const data = await updatePayroll(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postMarkPaid = asyncHandler(async (req, res) => {
  const data = await markPayrollPaid(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const removePayroll = asyncHandler(async (req, res) => {
  const data = await deletePayroll(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});
