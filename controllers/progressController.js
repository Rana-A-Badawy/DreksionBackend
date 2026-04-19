import { Progress, Skill, Level, Trainee, Booking, Instructor } from "../models/index.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
import { AppError }        from "../utils/appError.js";
import { successResponse } from "../utils/successResponse.js";
import { BOOKING_STATUS }  from "../config/constants.js";

// ─────────────────────────────────────────────────────────────
// TRAINEE — view own progress
// ─────────────────────────────────────────────────────────────

// GET /api/v1/progress/me
export const getMyProgress = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findOne({ user: req.user._id });
  if (!trainee) return next(new AppError("Trainee profile not found", 404));

  // All progress rows for this trainee
  const rows = await Progress.find({ trainee: trainee._id })
    .populate({ path: "skill", populate: { path: "level" } })
    .populate("instructor", "user")
    .sort({ "skill.level.levelNumber": 1, "skill.orderIndex": 1 });

  // Group by level
  const grouped = {};
  for (const row of rows) {
    const lvl = row.skill?.level;
    if (!lvl) continue;
    const key = lvl.levelNumber;
    if (!grouped[key]) {
      grouped[key] = {
        level:          lvl,
        skills:         [],
        completedCount: 0,
        totalCount:     0,
        requiredCount:  0,
        requiredDone:   0,
      };
    }
    grouped[key].skills.push(row);
    grouped[key].totalCount++;
    if (row.skill.isRequired) grouped[key].requiredCount++;
    if (row.isCompleted) {
      grouped[key].completedCount++;
      if (row.skill.isRequired) grouped[key].requiredDone++;
    }
  }

  // Add progressPercent + levelComplete to each group
  const result = Object.values(grouped)
    .sort((a, b) => a.level.levelNumber - b.level.levelNumber)
    .map((g) => ({
      ...g,
      progressPercent: g.totalCount > 0 ? Math.round((g.completedCount / g.totalCount) * 100) : 0,
      levelComplete:   g.requiredDone === g.requiredCount,
    }));

  res.status(200).json(
    successResponse("Progress fetched", {
      currentLevel: trainee.currentLevel,
      levels: result,
    })
  );
});

// ─────────────────────────────────────────────────────────────

// GET /api/v1/progress/level/:levelId
export const getLevelSummary = asyncHandler(async (req, res, next) => {
  const trainee = await Trainee.findOne({ user: req.user._id });
  if (!trainee) return next(new AppError("Trainee profile not found", 404));

  const levelId = req.params.levelId;
  const level   = await Level.findById(levelId);
  if (!level) return next(new AppError("Level not found", 404));

  const allSkillIds = await Skill.find({ level: levelId }).distinct("_id");
  const reqSkillIds = await Skill.find({ level: levelId, isRequired: true }).distinct("_id");

  const [total, required, completed, requiredCompleted] = await Promise.all([
    allSkillIds.length,
    reqSkillIds.length,
    Progress.countDocuments({ trainee: trainee._id, skill: { $in: allSkillIds }, isCompleted: true }),
    Progress.countDocuments({ trainee: trainee._id, skill: { $in: reqSkillIds }, isCompleted: true }),
  ]);

  res.status(200).json(
    successResponse("Level summary fetched", {
      level,
      total,
      required,
      completed,
      requiredCompleted,
      levelComplete:   requiredCompleted === required,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  );
});

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR — mark skill complete
// ─────────────────────────────────────────────────────────────

// POST /api/v1/progress/skill/:skillId/complete
// body: { traineeId }
export const markSkillComplete = asyncHandler(async (req, res, next) => {
  const { traineeId } = req.body;
  const { skillId }   = req.params;

  if (!traineeId) return next(new AppError("traineeId is required", 400));

  // Get instructor profile
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  // Validate skill exists
  const skill = await Skill.findById(skillId).populate("level");
  if (!skill) return next(new AppError("Skill not found", 404));

  // Validate trainee exists
  const trainee = await Trainee.findById(traineeId);
  if (!trainee) return next(new AppError("Trainee not found", 404));

  // Validate instructor has active booking with this trainee
  const hasBooking = await Booking.findOne({
    instructor: instructor._id,
    trainee:    traineeId,
    status:     { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
  });
  if (!hasBooking)
    return next(new AppError("No active booking between you and this trainee", 403));

  // Mark skill as complete (upsert)
  const progress = await Progress.findOneAndUpdate(
    { trainee: traineeId, skill: skillId },
    {
      $set: {
        isCompleted:  true,
        instructor:   instructor._id,
        completedAt:  new Date(),
      },
    },
    { upsert: true, new: true }
  ).populate({ path: "skill", populate: { path: "level" } });

  // ── Auto-advance level if all required skills in current level are done ──
  const advanceResult = await checkAndAdvanceLevel(traineeId, trainee.currentLevel);

  res.status(200).json(
    successResponse("Skill marked as complete", {
      progress,
      levelAdvanced: advanceResult.advanced,
      newLevel:      advanceResult.newLevel || null,
    })
  );
});

// ─────────────────────────────────────────────────────────────

// POST /api/v1/progress/skill/:skillId/uncomplete  (undo)
// body: { traineeId }
export const markSkillUncomplete = asyncHandler(async (req, res, next) => {
  const { traineeId } = req.body;
  const { skillId }   = req.params;

  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const progress = await Progress.findOneAndUpdate(
    { trainee: traineeId, skill: skillId },
    { $set: { isCompleted: false, completedAt: null } },
    { new: true }
  );

  if (!progress) return next(new AppError("Progress record not found", 404));

  res.status(200).json(successResponse("Skill marked as incomplete", progress));
});

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR — view student progress
// ─────────────────────────────────────────────────────────────

// GET /api/v1/progress/student/:traineeId
export const getStudentProgress = asyncHandler(async (req, res, next) => {
  const instructor = await Instructor.findOne({ user: req.user._id });
  if (!instructor) return next(new AppError("Instructor profile not found", 404));

  const trainee = await Trainee.findById(req.params.traineeId).populate("user", "firstName lastName");
  if (!trainee) return next(new AppError("Trainee not found", 404));

  // Make sure this trainee is one of instructor's students
  const hasBooking = await Booking.findOne({
    instructor: instructor._id,
    trainee:    trainee._id,
    status:     { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
  });
  if (!hasBooking)
    return next(new AppError("This trainee is not your student", 403));

  const rows = await Progress.find({ trainee: trainee._id })
    .populate({ path: "skill", populate: { path: "level" } })
    .sort({ "skill.orderIndex": 1 });

  // Group by level
  const grouped = {};
  for (const row of rows) {
    const lvl = row.skill?.level;
    if (!lvl) continue;
    const key = lvl.levelNumber;
    if (!grouped[key]) {
      grouped[key] = { level: lvl, skills: [], completedCount: 0, totalCount: 0 };
    }
    grouped[key].skills.push(row);
    grouped[key].totalCount++;
    if (row.isCompleted) grouped[key].completedCount++;
  }

  res.status(200).json(
    successResponse("Student progress fetched", {
      trainee,
      currentLevel: trainee.currentLevel,
      levels: Object.values(grouped).sort((a, b) => a.level.levelNumber - b.level.levelNumber),
    })
  );
});

// ─────────────────────────────────────────────────────────────
// HELPER: Check if trainee can advance + advance if yes
// ─────────────────────────────────────────────────────────────
async function checkAndAdvanceLevel(traineeId, currentLevelId) {
  if (!currentLevelId) return { advanced: false };

  // Get required skills in current level
  const requiredSkills = await Skill.find({ level: currentLevelId, isRequired: true });
  if (requiredSkills.length === 0) return { advanced: false };

  // Count how many are done
  const doneCount = await Progress.countDocuments({
    trainee:     traineeId,
    skill:       { $in: requiredSkills.map((s) => s._id) },
    isCompleted: true,
  });

  // Not all done yet
  if (doneCount < requiredSkills.length) return { advanced: false };

  // All required done — find next level
  const currentLevel = await Level.findById(currentLevelId);
  const nextLevel    = await Level.findOne({
    levelNumber: currentLevel.levelNumber + 1,
    isActive:    true,
  });

  if (!nextLevel) {
    // Already at max level — mark as completed
    await Trainee.findByIdAndUpdate(traineeId, { currentLevel: currentLevelId });
    return { advanced: false, message: "Already at highest level" };
  }

  // Advance trainee to next level
  await Trainee.findByIdAndUpdate(traineeId, { currentLevel: nextLevel._id });

  // Init progress rows for next level (upsert so it's idempotent)
  const nextSkills = await Skill.find({ level: nextLevel._id });
  await Promise.all(
    nextSkills.map((skill) =>
      Progress.findOneAndUpdate(
        { trainee: traineeId, skill: skill._id },
        { $setOnInsert: { trainee: traineeId, skill: skill._id, isCompleted: false } },
        { upsert: true, new: true }
      )
    )
  );

  return { advanced: true, newLevel: nextLevel };
}