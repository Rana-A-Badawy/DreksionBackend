import { Progress, Booking } from "./bookingModel.js";
import { Skill } from "./other.js";
import Trainee from "./traineeModel.js";

export async function initLevelProgress(traineeId, levelId) {
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

export async function getTraineeProgress(traineeId) {
  const rows = await Progress.find({ trainee: traineeId })
    .populate({
      path: "skill",
      populate: { path: "level" },
    })
    .sort({ "skill.orderIndex": 1 });

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

  return Object.values(grouped).sort((a, b) => a.level.levelNumber - b.level.levelNumber);
}

export async function markSkillComplete(traineeId, skillId, instructorId) {
  const hasBooking = await Booking.findOne({
    trainee: traineeId,
    instructor: instructorId,
    status: { $in: ["confirmed", "completed"] },
  });
  if (!hasBooking) throw new Error("No active booking between this instructor and trainee");

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
  ).populate({ path: "skill", populate: { path: "level" } });

  if (Trainee.canAdvanceLevel && Trainee.advanceLevel) {
    const canAdvance = await Trainee.canAdvanceLevel(traineeId);
    if (canAdvance) {
      await Trainee.advanceLevel(traineeId);
    }
  }

  return updated;
}

export async function getLevelSummary(traineeId, levelId) {
  const [total, required, completed, requiredCompleted] = await Promise.all([
    Skill.countDocuments({ level: levelId }),
    Skill.countDocuments({ level: levelId, isRequired: true }),
    Progress.countDocuments({
      trainee: traineeId,
      isCompleted: true,
      skill: { $in: await Skill.find({ level: levelId }).distinct("_id") },
    }),
    Progress.countDocuments({
      trainee: traineeId,
      isCompleted: true,
      skill: {
        $in: await Skill.find({ level: levelId, isRequired: true }).distinct("_id"),
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