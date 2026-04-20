# 🚗 Dreksion — منصة تعليم القيادة

<div align="center">

![Dreksion](https://img.shields.io/badge/Dreksion-Driving%20School%20Platform-1A3C6E?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

**منصة تربط بين المتدربين ومدربي القيادة**

</div>

---

## 📋 نظرة عامة

Dreksion هي منصة متكاملة لتعليم القيادة تتيح للمتدربين البحث عن مدربين معتمدين، حجز حصص تدريبية، ومتابعة تقدمهم في مستويات القيادة المختلفة.

---

## ✨ المميزات الرئيسية

- 🔐 **نظام مصادقة كامل** — تسجيل، تأكيد OTP، نسيان كلمة المرور
- 👥 **3 أدوار** — متدرب، مدرب، أدمن
- 📅 **نظام حجز** — بحث عن مدربين، حجز حصص، قبول ورفض
- 📊 **تتبع التقدم** — مستويات ومهارات قابلة للتخصيص
- ⭐ **نظام تقييم** — تقييم المدربين بعد كل حصة
- 💬 **شات** — محادثات بين المتدرب والمدرب
- 🚗 **إدارة السيارات** — المدرب يضيف سياراته بالتفاصيل
- ✅ **نظام توثيق** — الأدمن يراجع ويعتمد المدربين
- 💰 **نظام أرباح** — حساب تلقائي مع نسبة المنصة

---

## 🛠️ التقنيات المستخدمة

### Backend
| التقنية | الاستخدام |
|---------|----------|
| Node.js + Express | الـ Server |
| MongoDB + Mongoose | قاعدة البيانات |
| JWT | المصادقة |
| Bcrypt | تشفير كلمات المرور |
| Multer | رفع الملفات |

### Frontend
| التقنية | الاستخدام |
|---------|----------|
| React 18 + TypeScript | واجهة المستخدم |
| Vite | Build Tool |
| TanStack Query | إدارة البيانات |
| React Router v6 | التنقل بين الصفحات |
| Tailwind CSS + shadcn/ui | التصميم |
| Axios | طلبات HTTP |
| React Hook Form | إدارة الفورم |
| Sonner | الإشعارات |

---

## 🗂️ هيكل المشروع

```
dreksion/
├── backend/
│   ├── config/
│   │   ├── db.js                 # الاتصال بـ MongoDB
│   │   ├── constants.js          # ثوابت السيستم
│   │   └── seed.js               # بيانات أولية للـ DB
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── instructorController.js
│   │   ├── sessionController.js
│   │   ├── levelAdmin.controller.js
│   │   └── progress.controller.js
│   ├── middlewares/
│   │   ├── auth.js               # JWT + Role check
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── notFound.js           # 404 handler
│   │   └── uploadMiddleware.js   # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Instructor.js
│   │   ├── Vehicle.js
│   │   ├── Trainee.js
│   │   ├── bookingModel.js       # Availability + Booking + Progress
│   │   ├── Chat.js               # Review + Conversation + Message
│   │   ├── Other.js              # Admin + Level + Skill + Verification
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── instructorRoutes.js
│   │   ├── userRoutes.js
│   │   ├── adminRouter.js
│   │   ├── sessionRoutes.js
│   │   └── progressRoutes.js
│   ├── utils/
│   │   ├── appError.js
│   │   ├── asyncHandler.js
│   │   ├── generateToken.js
│   │   ├── pagination.js
│   │   └── successResponse.js
│   ├── uploads/
│   │   ├── images/
│   │   └── documents/
│   ├── .env
│   └── index.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layouts/           # Navbar
        │   ├── pages/             # Home, Instructors
        │   ├── providers/         # Theme provider
        │   └── routes/            # App routes + Protected routes
        ├── features/
        │   ├── auth/              # Login, Register, OTP, Reset
        │   ├── instructor-dashboard/  # كل صفحات الداشبورد
        │   ├── instructors/       # قائمة المدربين + البروفايل
        │   ├── bookings/          # خدمات الحجز
        │   └── progress/          # خدمات التقدم
        └── shared/
            ├── components/        # UI components + ProtectedRoute
            ├── lib/               # axios instance
            └── types/             # TypeScript types
```

---

## 🚀 تشغيل المشروع

### المتطلبات
- Node.js 18+
- MongoDB (محلي أو Atlas)
- npm أو yarn

### Backend

```bash
# 1. ادخل على فولدر الباكند
cd backend

# 2. ثبّت الـ packages
npm install

# 3. اعمل ملف .env
cp .env.example .env
# افتح الملف وحط قيمك الصح

# 4. شغّل الـ seed عشان تضيف المستويات
npm run seed

# 5. شغّل السيرفر
npm run dev
```

### Frontend

```bash
# 1. ادخل على فولدر الفرونت
cd frontend

# 2. ثبّت الـ packages
npm install

# 3. اعمل ملف .env
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env

# 4. شغّل المشروع
npm run dev
```

---

## ⚙️ Environment Variables

### Backend `.env`
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dreksion
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 📡 API Endpoints

### Auth `/api/v1/auth`
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/register` | تسجيل حساب جديد |
| POST | `/login` | تسجيل الدخول |
| POST | `/verify-otp` | تأكيد البريد |
| POST | `/resend-otp` | إعادة إرسال OTP |
| POST | `/forgot-password` | نسيت كلمة المرور |
| POST | `/reset-password` | إعادة تعيين كلمة المرور |

### Instructors `/api/v1/instructors`
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/` | قائمة المدربين | Public |
| GET | `/:id` | بروفايل مدرب | Public |
| GET | `/me` | بروفايلي | 🔐 Instructor |
| PUT | `/me` | تعديل البروفايل | 🔐 Instructor |
| POST | `/me/verify` | رفع مستندات التوثيق | 🔐 Instructor |
| GET | `/me/stats` | إحصائيات الداشبورد | 🔐 Instructor |
| GET | `/me/earnings` | الأرباح | 🔐 Instructor |
| GET | `/me/students` | طلابي | 🔐 Instructor |

### Sessions `/api/v1/sessions`
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/me` | جلساتي | 🔐 |
| PATCH | `/:id/start` | بدء جلسة | 🔐 Instructor |
| PATCH | `/:id/complete` | إنهاء جلسة | 🔐 Instructor |
| PATCH | `/:id/cancel` | إلغاء جلسة | 🔐 |

### Progress `/api/v1/progress`
| Method | Endpoint | الوصف | Auth |
|--------|----------|-------|------|
| GET | `/me` | تقدمي الكامل | 🔐 Trainee |
| POST | `/skill/:id/complete` | تعليم مهارة كمكتملة | 🔐 Instructor |

### Admin `/api/v1/admin`
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/verifications` | طلبات التوثيق |
| PUT | `/approve-verification` | قبول/رفض |
| GET | `/levels` | إدارة المستويات |
| POST | `/levels/:id/skills` | إضافة مهارة |

---

## 👤 أنواع المستخدمين

### 🎓 متدرب
- يبحث عن مدربين ويفلتر النتائج
- يحجز حصص تدريبية
- يتابع تقدمه في المستويات
- يراجع المدربين

### 🧑‍🏫 مدرب
- يدير جدوله وتوفره
- يقبل/يرفض الحجوزات
- يتابع تقدم طلابه ويعلّم المهارات
- يرى أرباحه وإحصائياته

### 🛡️ أدمن
- يراجع ويعتمد المدربين
- يدير المستويات والمهارات
- يشرف على المنصة

---

## 🔒 نظام الصلاحيات

```
Public      → يشوف قائمة المدربين وبروفايلاتهم
Trainee     → يحجز، يتابع تقدمه، يراجع
Instructor  → يدير حجوزاته، يتابع طلابه، يرى أرباحه
Admin       → صلاحيات كاملة على كل السيستم
```

---

## 📁 نموذج الـ Database

```
Users ──────── Instructors / Trainees / Admins
Instructors ── Vehicles (1:N)
Instructors ── Availability (1:N)
Trainees ───── Bookings ──── Instructors
Bookings ────── Reviews
Trainees ───── Progress ──── Skills ──── Levels
Users ─────── Conversations ─── Messages
Instructors ── Verifications ─── Admins
```

---

## 🤝 المساهمة في المشروع

1. عمل Fork للمشروع
2. إنشاء branch جديد `git checkout -b feature/amazing-feature`
3. Commit التغييرات `git commit -m 'feat: add amazing feature'`
4. Push على الـ branch `git push origin feature/amazing-feature`
5. فتح Pull Request

---

## 📄 الرخصة

هذا المشروع محمي بموجب رخصة MIT.

---

<div align="center">
  صُنع بـ ❤️ لتسهيل تعليم القيادة في مصر
</div>