import multer from "multer";
import path from  "path";
import { uploadFileToFirebase } from "../services/firebaseService.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const filetypes = /jpeg|jpg|png|gif|pdf|docx|csv|xlsx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadImages = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

export const handleFileUpload = (folderName, fieldName) => async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const uploadPromises = req.files.map(file => uploadFileToFirebase(file, folderName));
    const uploadedUrls = await Promise.all(uploadPromises);

    // Si solo hay un archivo, asignamos la URL directamente
    if (uploadedUrls.length === 1) {
      req.body[fieldName] = uploadedUrls[0];
    } else {
      req.body[fieldName] = uploadedUrls;
    }

    next();
  } catch (error) {
    next(error);
  }
};