import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import { getCertificate, getCertificates, postCertificate } from "./schoolLeaving.controller.js";

const router = Router();
const access = [protect, authorize("SUPER_ADMIN", "ACCOUNTANT")];
const adminOnly = [protect, authorize("SUPER_ADMIN")];

router.get("/", ...access, getCertificates);
router.post("/", ...adminOnly, postCertificate);
router.get("/:id", ...access, getCertificate);

export default router;
