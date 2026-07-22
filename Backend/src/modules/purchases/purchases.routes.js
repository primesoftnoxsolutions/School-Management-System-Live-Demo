import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getPurchaseById,
  getPurchaseSummary,
  getPurchases,
  postPurchase,
} from "./purchases.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/", ...access, getPurchases);
router.get("/summary", ...access, getPurchaseSummary);
router.post("/", ...access, postPurchase);
router.get("/:id", ...access, getPurchaseById);

export default router;
