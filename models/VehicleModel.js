const mongoose = require("mongoose");
const vehicleSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: [true, "المدرب مطلوب"],
    },
    brand: {
      type: String,
      required: [true, "الماركة مطلوبة"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "الموديل مطلوب"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "سنة الصنع مطلوبة"],
      min: [1990, "السنة يجب أن تكون 1990 أو أحدث"],
      max: [new Date().getFullYear() + 1, "السنة غير صحيحة"],
    },
    plateNumber: {
      type: String,
      required: [true, "رقم اللوحة مطلوب"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    transmission: {
      type: String,
      enum: {
        values: ["manual", "automatic"],
        message: "نوع الناقل يجب أن يكون manual أو automatic",
      },
      required: [true, "نوع الناقل مطلوب"],
    },
    color: {
      type: String,
      required: [true, "اللون مطلوب"],
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    seatsCount: {
      type: Number,
      default: 5,
      min: 2,
      max: 8,
    },
    hasDoublePedals: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: [300, "الملاحظات يجب ألا تتجاوز 300 حرف"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
vehicleSchema.virtual("fullName").get(function () {
  return `${this.brand} ${this.model} ${this.year}`;
});
vehicleSchema.index({ plateNumber: 1 }, { unique: true });
vehicleSchema.index({ instructor: 1 });
const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
