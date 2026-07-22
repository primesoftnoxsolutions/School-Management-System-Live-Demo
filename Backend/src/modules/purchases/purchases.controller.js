import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPurchase,
  getPurchase,
  listPurchases,
  summarizePurchases,
} from "./purchases.service.js";

export const getPurchases = asyncHandler(async (req, res) => {
  const data = await listPurchases(req.query);
  res.status(200).json({ success: true, data });
});

export const getPurchaseSummary = asyncHandler(async (req, res) => {
  const data = await summarizePurchases(req.query);
  res.status(200).json({ success: true, data });
});

export const postPurchase = asyncHandler(async (req, res) => {
  const data = await createPurchase(req.body, req.user._id.toString());
  res.status(201).json({ success: true, data });
});

export const getPurchaseById = asyncHandler(async (req, res) => {
  const data = await getPurchase(req.params.id);
  res.status(200).json({ success: true, data });
});
