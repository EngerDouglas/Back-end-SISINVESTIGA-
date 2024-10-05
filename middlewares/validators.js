import { body } from 'express-validator';

export const validateCreateUser = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  body('especializacion').notEmpty().withMessage('La especialización es requerida'),
  body('responsabilidades').isArray().withMessage('Las responsabilidades deben ser un array'),
  body('responsabilidades.*').notEmpty().withMessage('Cada responsabilidad debe ser un string no vacío'),
];

export const validateUpdateUser = [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('apellido').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Debe ser un email válido'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  body('especializacion').optional().notEmpty().withMessage('La especialización no puede estar vacía'),
  body('responsabilidades').optional().isArray().withMessage('Las responsabilidades deben ser un array'),
  body('responsabilidades.*').optional().notEmpty().withMessage('Cada responsabilidad debe ser un string no vacío'),
];