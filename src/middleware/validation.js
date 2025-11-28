const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para registro de usuario
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  handleValidationErrors
];

// Validaciones para login de usuario
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  handleValidationErrors
];

// Validaciones para crear artículo
const validateArticleCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('El título debe tener entre 5 y 500 caracteres'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('El contenido debe tener al menos 50 caracteres'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('El resumen no puede exceder 300 caracteres'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Debe seleccionar una categoría válida'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('source_url')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Los tags deben ser un array'),
  handleValidationErrors
];

// Validaciones para actualizar artículo
const validateArticleUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('El título debe tener entre 5 y 500 caracteres'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('El contenido debe tener al menos 50 caracteres'),
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('El resumen no puede exceder 300 caracteres'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Debe seleccionar una categoría válida'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('source_url')
    .optional()
    .isURL()
    .withMessage('Debe ser una URL válida'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Los tags deben ser un array'),
  handleValidationErrors
];

// Validaciones para parámetros de ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un número entero positivo'),
  handleValidationErrors
];

// Validaciones para consultas de artículos
const validateArticleQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('category')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La categoría debe ser un ID válido'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('La búsqueda debe tener al menos 2 caracteres'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateArticleCreation,
  validateArticleUpdate,
  validateId,
  validateArticleQuery
};

