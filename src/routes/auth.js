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

// Endpoint de debug para verificar sesion
router.get('/debug-session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie,
    hasSession: !!req.session,
    hasUserId: !!req.session?.userId
  });
});

// Rutas públicas
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Ruta de logout sin autenticacion para poder limpiar sesion
router.post('/logout-force', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error cerrando sesion:', err);
    }
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Sesion cerrada'
    });
  });
});

// Rutas protegidas
router.post('/logout', authenticateSession, logout);
router.get('/profile', authenticateSession, getProfile);
router.put('/profile', authenticateSession, updateProfile);
router.put('/change-password', authenticateSession, changePassword);

module.exports = router;
