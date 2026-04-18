import { Availability } from "../models/bookingModel.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function setAvailability(instructorId, slots) {
  validateSlots(slots);

  await Availability.deleteMany({ instructor: instructorId });
  const created = await Availability.insertMany(
    slots.map((s) => ({ ...s, instructor: instructorId }))
  );

  return created;
}

export async function getAvailability(instructorId) {
  const rows = await Availability.find({ instructor: instructorId }).sort({ dayOfWeek: 1 });

  return rows.map((r) => ({
    ...r.toObject(),
    dayName: DAY_NAMES[r.dayOfWeek],
  }));
}

export async function addSlot(instructorId, { dayOfWeek, startTime, endTime }) {
  validateSlots([{ dayOfWeek, startTime, endTime }]);
  return Availability.create({ instructor: instructorId, dayOfWeek, startTime, endTime });
}

export async function removeSlot(id) {
  return Availability.findByIdAndDelete(id);
}

export async function isAvailable(instructorId, dateTime) {
  const day = new Date(dateTime).getDay();
  const time = new Date(dateTime).toTimeString().slice(0, 5);

  const slot = await Availability.findOne({
    instructor: instructorId,
    dayOfWeek: day,
    startTime: { $lte: time },
    endTime: { $gt: time },
  });

  return !!slot;
}

function validateSlots(slots) {
  for (const s of slots) {
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6)
      throw new Error(`Invalid dayOfWeek: ${s.dayOfWeek}`);
    if (!/^\d{2}:\d{2}$/.test(s.startTime))
      throw new Error("startTime must be HH:MM");
    if (!/^\d{2}:\d{2}$/.test(s.endTime))
      throw new Error("endTime must be HH:MM");
    if (s.startTime >= s.endTime)
      throw new Error("startTime must be before endTime");
  }
}