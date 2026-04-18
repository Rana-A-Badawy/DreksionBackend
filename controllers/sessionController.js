import { Booking } from "../models/bookingModel.js";
import { Instructor } from "../models/InstructorModel.js";

export const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Booking.findById(sessionId).populate("instructor");

    if (!session) return res.status(404).json({ message: "الجلسة غير موجودة" });

    session.endTime = new Date();
    const durationInMilliseconds = session.endTime - session.startTime;
    const durationInMinutes = Math.floor(durationInMilliseconds / (1000 * 60));

    const hourlyRate = session.instructor.hourlyRate;
    const totalAmount = (durationInMinutes / 60) * hourlyRate;

    const platformFeePercent = 0.15;
    const commission = totalAmount * platformFeePercent;
    const netEarnings = totalAmount - commission;

    session.durationMinutes = durationInMinutes;
    session.totalPrice = totalAmount.toFixed(2);
    session.platformCommission = commission.toFixed(2);
    session.instructorEarnings = netEarnings.toFixed(2);
    session.status = "completed";

    await session.save();

    await Instructor.findByIdAndUpdate(session.instructor._id, {
      $inc: { wallet: netEarnings.toFixed(2) },
    });

    res.status(200).json({
      message: "تم إنهاء الجلسة بنجاح وتحويل المبلغ للمدرب",
      summary: { totalAmount, commission, netEarnings, durationInMinutes },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};