import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Level, Skill } from "../models/index.js";

const seedData = [
  {
    levelNumber: 0,
    title: "مبتدئ",
    description: "التعريف بالسيارة والجلسة الصحيحة",
    skills: [
      { name: "التعرف على أجزاء السيارة", isRequired: true,  orderIndex: 0 },
      { name: "ضبط الكرسي والمرايا",      isRequired: true,  orderIndex: 1 },
      { name: "ربط حزام الأمان",          isRequired: true,  orderIndex: 2 },
      { name: "تشغيل السيارة وإيقافها",   isRequired: true,  orderIndex: 3 },
      { name: "معرفة الأدوات والعدادات",  isRequired: false, orderIndex: 4 },
    ],
  },
  {
    levelNumber: 1,
    title: "أساسيات الحركة",
    description: "التحريك والتوقف والتحكم الأساسي",
    skills: [
      { name: "تحريك السيارة للأمام",     isRequired: true,  orderIndex: 0 },
      { name: "الفرامل والتوقف بسلاسة",   isRequired: true,  orderIndex: 1 },
      { name: "التروس (مانيوال) أو Drive", isRequired: true,  orderIndex: 2 },
      { name: "الرؤية الأمامية والخلفية", isRequired: true,  orderIndex: 3 },
      { name: "السير في خط مستقيم",       isRequired: true,  orderIndex: 4 },
      { name: "التراجع للخلف",            isRequired: false, orderIndex: 5 },
    ],
  },
  {
    levelNumber: 2,
    title: "التنقل في الشارع",
    description: "الانعطاف والأولوية والتعامل مع الشارع",
    skills: [
      { name: "الانعطاف يميناً ويساراً", isRequired: true,  orderIndex: 0 },
      { name: "قواعد الأولوية",          isRequired: true,  orderIndex: 1 },
      { name: "الإشارات الضوئية",        isRequired: true,  orderIndex: 2 },
      { name: "التقاطعات",               isRequired: true,  orderIndex: 3 },
      { name: "تغيير المسار",            isRequired: true,  orderIndex: 4 },
      { name: "السرعة المناسبة",         isRequired: false, orderIndex: 5 },
    ],
  },
  {
    levelNumber: 3,
    title: "قيادة متقدمة",
    description: "الطريق السريع والباركينج والقيادة الليلية",
    skills: [
      { name: "الدخول والخروج من الطريق السريع", isRequired: true,  orderIndex: 0 },
      { name: "الباركينج الأمامي",                isRequired: true,  orderIndex: 1 },
      { name: "الباركينج الجانبي",               isRequired: true,  orderIndex: 2 },
      { name: "القيادة الليلية",                 isRequired: true,  orderIndex: 3 },
      { name: "الانتظار الصحيح",                 isRequired: false, orderIndex: 4 },
      { name: "التعامل مع المطر",                isRequired: false, orderIndex: 5 },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");

    // Clear existing
    await Skill.deleteMany({});
    await Level.deleteMany({});
    console.log("Cleared old levels & skills");

    for (const levelData of seedData) {
      const { skills, ...levelFields } = levelData;

      const level = await Level.create({ ...levelFields, isActive: true, order: levelFields.levelNumber });

      const skillDocs = skills.map((s) => ({ ...s, level: level._id }));
      await Skill.insertMany(skillDocs);

      console.log(`Level ${level.levelNumber} — "${level.title}" + ${skills.length} skills`);
    }

    console.log("\n Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seed();