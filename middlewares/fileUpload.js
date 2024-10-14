import multer from "multer";
import path from  "path";
import { uploadFileToFirebase } from "../services/firebaseService.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const filetypes = /jpeg|jpg|png|gif|pdf|docx|csv|xlsx|webp|avif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes y documentos.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Este nos permite subir una sola imagen especifica
export const uploadImages = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

// Este es para subir multiples archivos que lo requieran
export const uploadFiles = (fields) => upload.fields(fields);

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

export const handleMultipleFileUploads = (fieldsConfig) => async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  try {
    for (const field of fieldsConfig) {
      const files = req.files[field.name];

      if (files && files.length > 0) {
        if (field.name === 'anexos') {
          const anexos = [];

          for (const file of files) {
            const url = await uploadFileToFirebase(file, field.folderName);
            anexos.push({
              nombre: file.originalname,
              url: url,
              tipo: file.mimetype,
            });
          }

          req.body.anexos = anexos;
        } else {
          const uploadPromises = files.map(file => uploadFileToFirebase(file, field.folderName));
          const uploadedUrls = await Promise.all(uploadPromises);

          // Si solo hay un archivo, asignamos la URL directamente
          if (uploadedUrls.length === 1) {
            req.body[field.name] = uploadedUrls[0];
          } else {
            req.body[field.name] = uploadedUrls;
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};