import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, getSignature, putSignature } from "./auth.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { env } from "../../config/env.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.get("/me/signature", protect, getSignature);
router.put("/me/signature", protect, putSignature);

export default router;
