const { query } = require('../config/database');

// Middleware para verificar sesión de usuario
const authenticateSession = async (req, res, next) => {
  try {
    // Verificar si hay una sesión activa
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Sesión requerida. Por favor inicia sesión.'
      });
    }

    // Verificar que el usuario existe y está activo
    const result = await query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      // Limpiar sesión si el usuario no existe
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      // Limpiar sesión si el usuario está inactivo
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware opcional para verificar sesión (no falla si no hay sesión)
const optionalAuth = async (req, res, next) => {
  try {
    // Verificar si hay una sesión activa
    if (!req.session || !req.session.userId) {
      req.user = null;
      return next();
    }

    const result = await query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active) {
      req.user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        role: result.rows[0].role
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware para verificar roles de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }

  next();
};

module.exports = {
  authenticateSession,
  optionalAuth,
  requireAdmin
};
