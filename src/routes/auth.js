const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { authenticateSession } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../middleware/validation');

// Rutas públicas
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Rutas protegidas
router.post('/logout', authenticateSession, logout);
router.get('/profile', authenticateSession, getProfile);
router.put('/profile', authenticateSession, updateProfile);
router.put('/change-password', authenticateSession, changePassword);

module.exports = router;
