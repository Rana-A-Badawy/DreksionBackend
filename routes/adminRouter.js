import express from "express";
const router = express.Router();

import { auth } from "../middlewares/auth.js";
import { verifications , approveVerification } from "../controllers/adminCotroller.js";

 router.use(auth("admin"));

router.get("/verifications", verifications);
router.put("/approve-verification", approveVerification);



export default router;