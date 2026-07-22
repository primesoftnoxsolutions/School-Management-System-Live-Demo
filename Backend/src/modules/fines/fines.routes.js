import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getFines,
  postFine,
  postPayFine,
  postWaiveFine,
  putFine,
  removeFine,
} from "./fines.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];

router.get("/", ...access, getFines);
router.post("/", ...access, postFine);
router.put("/:id", ...access, putFine);
router.post("/:id/pay", ...access, postPayFine);
router.post("/:id/waive", ...access, postWaiveFine);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), removeFine);

export default router;
