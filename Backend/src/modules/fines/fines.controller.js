import { asyncHandler } from "../../utils/asyncHandler.js";
import { createFine, deleteFine, listFines, payFine, updateFine, waiveFine } from "./fines.service.js";

export const getFines = asyncHandler(async (req, res) => {
  const data = await listFines(req.query);
  res.status(200).json({ success: true, data });
});

export const postFine = asyncHandler(async (req, res) => {
  const data = await createFine(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

export const putFine = asyncHandler(async (req, res) => {
  const data = await updateFine(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postPayFine = asyncHandler(async (req, res) => {
  const data = await payFine(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postWaiveFine = asyncHandler(async (req, res) => {
  const data = await waiveFine(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const removeFine = asyncHandler(async (req, res) => {
  const data = await deleteFine(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});
