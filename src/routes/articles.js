const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleFavorite,
  toggleLike,
  getBookmarkedArticles
} = require('../controllers/articleController');
const { authenticateSession, optionalAuth, requireAdmin } = require('../middleware/auth');
const {
  validateArticleCreation,
  validateArticleUpdate,
  validateId,
  validateArticleQuery
} = require('../middleware/validation');

// Rutas públicas
router.get('/bookmarks', authenticateSession, validateArticleQuery, getBookmarkedArticles);
router.get('/', optionalAuth, validateArticleQuery, getArticles);
router.get('/:id', optionalAuth, validateId, getArticleById);


// Rutas protegidas
router.post('/', validateArticleCreation, createArticle);
router.put('/:id', authenticateSession, validateId, validateArticleUpdate, updateArticle);
router.delete('/:id', authenticateSession, validateId, deleteArticle);

// Rutas de interacción (requieren autenticación)
router.post('/:id/favorite', authenticateSession, validateId, toggleFavorite);
router.post('/:id/like', authenticateSession, validateId, toggleLike);

module.exports = router