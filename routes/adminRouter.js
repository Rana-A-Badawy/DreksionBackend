import express from "express";
const router = express.Router();

import { auth } from "../middlewares/auth.js";
import { verifications, approveVerification, setInstructorPricing } from "../controllers/adminCotroller.js";

router.use(auth("admin"));

router.get("/verifications", verifications);
router.put("/approve-verification", approveVerification);
router.put("/set-instructor-pricing", setInstructorPricing);

export default router;