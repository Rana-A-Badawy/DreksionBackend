import { Router } from "express";
import {auth} from "../middlewares/auth.js";
import { ROLES } from "../config/constants.js";
import {
  startSession,
  completeSession,
  cancelSession,
  getSession,
  getMySessions,
} from "../controllers/sessionController.js";

const router = Router();

// ── Instructor + Trainee ──────────────────────────────────────
router.get("/me",            auth(ROLES.INSTRUCTOR, ROLES.TRAINEE), getMySessions);
router.get("/:sessionId",    auth(ROLES.INSTRUCTOR, ROLES.TRAINEE), getSession);
router.patch("/:sessionId/cancel", auth(ROLES.INSTRUCTOR, ROLES.TRAINEE), cancelSession);

// ── Instructor only ───────────────────────────────────────────
router.patch("/:sessionId/start",    auth(ROLES.INSTRUCTOR), startSession);
router.patch("/:sessionId/complete", auth(ROLES.INSTRUCTOR), completeSession);

export default router;