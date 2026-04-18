import Progress from '../models/progress.model.js';
import Skill from '../models/skill.model.js';
import Booking from '../models/booking.model.js';
import traineeModel from './trainee.model';

async function initLevelProgress(traineeId, levelId) {
  const skills = await Skill.find({ level: levelId });

  const ops = skills.map((skill) =>
    Progress.findOneAndUpdate(
      { trainee: traineeId, skill: skill._id },
      { $setOnInsert: { trainee: traineeId, skill: skill._id, isCompleted: false } },
      { upsert: true, new: true }
    )
  );

  return Promise.all(ops);
}

// ─── Get full progress for a trainee ─────────────────────────
async function getTraineeProgress(traineeId) {
  const rows = await Progress.find({ trainee: traineeId })
    .populate({
      path: 'skill',
      populate: { path: 'level' },
    })
    .sort({ 'skill.orderIndex': 1 });

  // Group by level
  const grouped = {};
  for (const row of rows) {
    const lvl = row.skill.level;
    const key = lvl.levelNumber;

    if (!grouped[key]) {
      grouped[key] = { level: lvl, skills: [], completedCount: 0, totalCount: 0 };
    }

    grouped[key].skills.push(row);
    grouped[key].totalCount++;
    if (row.isCompleted) grouped[key].completedCount++;
  }

  // Sort by levelNumber
  return Object.values(grouped).sort((a, b) => a.level.levelNumber - b.level.levelNumber);
}

// ─── Mark a skill as completed (instructor only) ──────────────
async function markSkillComplete(traineeId, skillId, instructorId) {
  // Validate instructor has an active booking with this trainee
  const hasBooking = await Booking.findOne({
    trainee: traineeId,
    instructor: instructorId,
    status: { $in: ['confirmed', 'completed'] },
  });
  if (!hasBooking) throw new Error('No active booking between this instructor and trainee');

  const updated = await Progress.findOneAndUpdate(
    { trainee: traineeId, skill: skillId },
    {
      $set: {
        isCompleted: true,
        instructor: instructorId,
        completedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  )
    .populate({ path: 'skill', populate: { path: 'level' } });

  // Auto-advance level if all required skills are done
  const canAdvance = await traineeModel.canAdvanceLevel(traineeId);
  if (canAdvance) {
    await traineeModel.advanceLevel(traineeId);
  }

  return updated;
}

// ─── Summary for a specific level ────────────────────────────
async function getLevelSummary(traineeId, levelId) {
  const [total, required, completed, requiredCompleted] = await Promise.all([
    Skill.countDocuments({ level: levelId }),
    Skill.countDocuments({ level: levelId, isRequired: true }),
    Progress.countDocuments({
      trainee: traineeId,
      isCompleted: true,
      skill: { $in: await Skill.find({ level: levelId }).distinct('_id') },
    }),
    Progress.countDocuments({
      trainee: traineeId,
      isCompleted: true,
      skill: {
        $in: await Skill.find({ level: levelId, isRequired: true }).distinct('_id'),
      },
    }),
  ]);

  return {
    total,
    required,
    completed,
    requiredCompleted,
    levelComplete: requiredCompleted === required,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
export default {
  initLevelProgress,
  getTraineeProgress,
  markSkillComplete,
  getLevelSummary,
};