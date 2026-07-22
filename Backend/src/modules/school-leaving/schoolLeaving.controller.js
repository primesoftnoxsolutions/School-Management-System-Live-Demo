import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createLeavingCertificate,
  getLeavingCertificate,
  listLeavingCertificates,
} from "./schoolLeaving.service.js";

export const getCertificates = asyncHandler(async (req, res) => {
  const data = await listLeavingCertificates(req.query);
  res.status(200).json({ success: true, data });
});

export const postCertificate = asyncHandler(async (req, res) => {
  const data = await createLeavingCertificate(req.body, req.user._id.toString());
  res.status(201).json({ success: true, data });
});

export const getCertificate = asyncHandler(async (req, res) => {
  const data = await getLeavingCertificate(req.params.id);
  res.status(200).json({ success: true, data });
});
