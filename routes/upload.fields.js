import express from 'express';
import { upload } from '../middleware/multerConfig.js';

const router = express.Router();

router.post('/register-instructor', upload.fields([
  { name: 'nationalIdFront', maxCount: 1 },
  { name: 'nationalIdBack', maxCount: 1 },
  { name: 'licenseImage', maxCount: 1 },
  { name: 'plateImage', maxCount: 1 }
]), (req, res) => {
  // الملفات الآن موجودة في req.files
  // المسارات التي سنخزنها في قاعدة البيانات:
  const frontImagePath = req.files['nationalIdFront'][0].path;
  const backImagePath = req.files['nationalIdBack'][0].path;
  
  // الآن يمكنك حفظ هذه المسارات في MongoDB
  res.send("تم رفع الصور بنجاح وسيتم مراجعتها");
});