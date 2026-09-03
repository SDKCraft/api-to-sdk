// نقطة الدخول الفعلية لتشغيل السيرفر (اللي Render بيستدعيها).
// منفصلة عن تعريف الـ Express app نفسه (app.ts) عشان الاختبارات (tests/) تقدر
// تستورد الـ app وتختبره عبر supertest من غير ما تفتح port حقيقي فعليًا في كل مرة.
import app from "./app";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SDKCraft API running on http://localhost:${PORT}`);
});