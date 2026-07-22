import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAdmissionService,
  getNextHistoryAdmissionNo,
  listAdmissionsService,
} from "./admissions.service.js";

export const createAdmission = asyncHandler(async (req, res) => {
  const actorId = req.user._id.toString();
  const result = await createAdmissionService(req.body, actorId);

  res.status(201).json({
    success: true,
    data: {
      student: result.student,
      admission: result.admission,
    },
  });
});

export const listAdmissions = asyncHandler(async (req, res) => {
  const result = await listAdmissionsService(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getNextAdmissionNumber = asyncHandler(async (_req, res) => {
  const admissionNo = await getNextHistoryAdmissionNo();
  res.status(200).json({ success: true, data: { admissionNo } });
});
