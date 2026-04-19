import express from "express";
const router = express.Router();
import { auth } from "../middlewares/auth.js";
import { verifications, approveVerification, setInstructorPricing } from "../controllers/adminController.js";
import { ROLES } from "../config/constants.js";
import {
  getAllLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  getLevelSkills,
  addSkill,
  updateSkill,
  deleteSkill,
} from "../controllers/adminController.js";
 
router.use(auth(ROLES.ADMIN));
 
// ── Levels ────────────────────────────────────────────────────
router.get  ("/",          getAllLevels);   // GET  /api/v1/admin/levels
router.post ("/",          createLevel);   // POST /api/v1/admin/levels
router.put  ("/:id",       updateLevel);   // PUT  /api/v1/admin/levels/:id
router.delete("/:id",      deleteLevel);   // DELETE /api/v1/admin/levels/:id
// ── Skills ────────────────────────────────────────────────────
router.get  ("/:levelId/skills", getLevelSkills); // GET  /api/v1/admin/levels/:levelId/skills
router.post ("/:levelId/skills", addSkill);       // POST /api/v1/admin/levels/:levelId/skills
router.put  ("/skills/:id",      updateSkill);    // PUT  /api/v1/admin/levels/skills/:id
router.delete("/skills/:id",     deleteSkill);    // DELETE /api/v1/admin/levels/skills/:id
 
router.get("/verifications", verifications);
router.put("/approve-verification", approveVerification);
router.put("/set-instructor-pricing", setInstructorPricing);

export default router;