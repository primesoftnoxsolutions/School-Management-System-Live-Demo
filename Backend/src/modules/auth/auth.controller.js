import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { loginUser, logoutUser, getMySignature, saveMySignature } from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const result = await loginUser({ email, password, role });
  req.session.userId = result.user.id.toString();
  req.session.role = result.user.role;

  res.status(200).json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.session);
  res.clearCookie("connect.sid");
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export const getSignature = asyncHandler(async (req, res) => {
  const data = await getMySignature(req.user._id);
  res.status(200).json({ success: true, data });
});

export const putSignature = asyncHandler(async (req, res) => {
  const data = await saveMySignature(req.user._id, req.body?.signatureDataUrl || "");
  res.status(200).json({ success: true, data });
});
