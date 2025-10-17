const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// Rutas públicas
router.get('/', getCategories);
router.get('/:id', validateId, getCategoryById);

// Rutas protegidas (solo administradores)
router.post('/', authenticateSession, requireAdmin, createCategory);
router.put('/:id', authenticateSession, requireAdmin, validateId, updateCategory);
router.delete('/:id', authenticateSession, requireAdmin, validateId, deleteCategory);

module.exports = router;
