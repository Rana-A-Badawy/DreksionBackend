import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      enum: [
        "manage_users",
        "manage_instructors",
        "manage_bookings",
        "manage_levels",
        "manage_verifications",
        "view_reports",
      ],
      default: [
        "manage_users",
        "manage_instructors",
        "manage_bookings",
        "manage_levels",
        "manage_verifications",
        "view_reports",
      ],
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

adminSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "firstName lastName email phone profileImage" });
  next();
});

const levelSchema = new mongoose.Schema(
  {
    levelNumber: {
      type: Number,
      required: [true, "رقم المستوى مطلوب"],
      unique: true,
      min: 0,
    },
    title: {
      type: String,
      required: [true, "عنوان المستوى مطلوب"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

levelSchema.virtual("skills", {
  ref: "Skill",
  foreignField: "level",
  localField: "_id",
});

const skillSchema = new mongoose.Schema(
  {
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "المستوى مطلوب"],
    },
    name: {
      type: String,
      required: [true, "اسم المهارة مطلوب"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

skillSchema.index({ level: 1, orderIndex: 1 });

const verificationSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    type: {
      type: String,
      enum: ["national_id", "license", "full_profile"],
      required: [true, "نوع التحقق مطلوب"],
    },
    documents: {
      nationalIdFront: String,
      nationalIdBack: String,
      licenseImage: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

verificationSchema.index({ instructor: 1, status: 1 });

const Admin = mongoose.model("Admin", adminSchema);
const Level = mongoose.model("Level", levelSchema);
const Skill = mongoose.model("Skill", skillSchema);
const Verification = mongoose.model("Verification", verificationSchema);

export { Admin, Level, Skill, Verification };