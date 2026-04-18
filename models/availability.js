const { Availability } = require('../models');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Replace all availability slots for an instructor ─────────
// Accepts array: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, ...]
async function setAvailability(instructorId, slots) {
  validateSlots(slots);

  // Atomic: delete old → create new
  await Availability.deleteMany({ instructor: instructorId });
  const created = await Availability.insertMany(
    slots.map((s) => ({ ...s, instructor: instructorId }))
  );

  return created;
}

// ─── Get availability for an instructor ───────────────────────
async function getAvailability(instructorId) {
  const rows = await Availability.find({ instructor: instructorId }).sort({ dayOfWeek: 1 });

  return rows.map((r) => ({
    ...r.toObject(),
    dayName: DAY_NAMES[r.dayOfWeek],
  }));
}

// ─── Add a single slot ────────────────────────────────────────
async function addSlot(instructorId, { dayOfWeek, startTime, endTime }) {
  validateSlots([{ dayOfWeek, startTime, endTime }]);
  return Availability.create({ instructor: instructorId, dayOfWeek, startTime, endTime });
}

// ─── Remove a single slot by ID ───────────────────────────────
async function removeSlot(id) {
  return Availability.findByIdAndDelete(id);
}

// ─── Check if instructor is available at a given datetime ─────
async function isAvailable(instructorId, dateTime) {
  const day = new Date(dateTime).getDay();              // 0–6
  const time = new Date(dateTime).toTimeString().slice(0, 5); // "HH:MM"

  const slot = await Availability.findOne({
    instructor: instructorId,
    dayOfWeek: day,
    // المقارنة بالـ string تشتغل صح لأن الفورمات HH:MM ثابت
    startTime: { $lte: time },
    endTime: { $gt: time },
  });

  return !!slot;
}

// ─── Validation helper ────────────────────────────────────────
function validateSlots(slots) {
  for (const s of slots) {
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6)
      throw new Error(`Invalid dayOfWeek: ${s.dayOfWeek}`);
    if (!/^\d{2}:\d{2}$/.test(s.startTime))
      throw new Error('startTime must be HH:MM');
    if (!/^\d{2}:\d{2}$/.test(s.endTime))
      throw new Error('endTime must be HH:MM');
    if (s.startTime >= s.endTime)
      throw new Error('startTime must be before endTime');
  }
}

module.exports = { setAvailability, getAvailability, addSlot, removeSlot, isAvailable };
