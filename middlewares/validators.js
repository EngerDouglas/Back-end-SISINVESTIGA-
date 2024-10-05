import { body } from 'express-validator';


//-------------------- Validaciones para los Usuarios ------------------- //

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

//-------------------- END ------------------- //

//-------------------- Validaciones para los Roles ------------------- //

export const validateCreateRole = [
  body('roleName')
    .notEmpty().withMessage('El nombre del rol es requerido')
    .isString().withMessage('El nombre del rol debe ser una cadena de texto')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre del rol debe tener entre 2 y 50 caracteres'),
];

export const validateUpdateRole = [
  body('roleName')
    .optional()
    .notEmpty().withMessage('El nombre del rol no puede estar vacío')
    .isString().withMessage('El nombre del rol debe ser una cadena de texto')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre del rol debe tener entre 2 y 50 caracteres'),
];

//-------------------- END ------------------- //

//-------------------- Validaciones para los Proyectos ------------------- //

export const validateCreateProject = [
  body('nombre').notEmpty().withMessage('El nombre del proyecto es requerido'),
  body('descripcion').notEmpty().withMessage('La descripción del proyecto es requerida'),
  body('presupuesto').isNumeric().withMessage('El presupuesto debe ser un número'),
  body('cronograma.fechaInicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida'),
  body('cronograma.fechaFin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida'),
  body('investigadores').optional().isArray().withMessage('Los investigadores deben ser una lista'),
  body('hitos').isArray().withMessage('Los hitos deben ser una lista'),
  body('hitos.*.nombre').notEmpty().withMessage('El nombre del hito es requerido'),
  body('hitos.*.fecha').isISO8601().toDate().withMessage('La fecha del hito debe ser una fecha válida'),
];

export const validateUpdateProject = [
  body('nombre').optional().notEmpty().withMessage('El nombre del proyecto no puede estar vacío'),
  body('descripcion').optional().notEmpty().withMessage('La descripción del proyecto no puede estar vacía'),
  body('presupuesto').optional().isNumeric().withMessage('El presupuesto debe ser un número'),
  body('cronograma.fechaInicio').optional().isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida'),
  body('cronograma.fechaFin').optional().isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida'),
  body('investigadores').optional().isArray().withMessage('Los investigadores deben ser una lista'),
  body('hitos').optional().isArray().withMessage('Los hitos deben ser una lista'),
  body('hitos.*.nombre').optional().notEmpty().withMessage('El nombre del hito es requerido'),
  body('hitos.*.fecha').optional().isISO8601().toDate().withMessage('La fecha del hito debe ser una fecha válida'),
];

//-------------------- END ------------------- //