const { query } = require('../config/database');

// Obtener todas las categorías
const getCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.color,
        c.icon,
        COUNT(a.id) as articles_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.is_published = true
      GROUP BY c.id, c.name, c.description, c.color, c.icon
      ORDER BY c.name
    `);

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener categoría por ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.color,
        c.icon,
        COUNT(a.id) as articles_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.is_published = true
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.color, c.icon
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva categoría (solo administradores)
const createCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    // Verificar si la categoría ya existe
    const existingCategory = await query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const result = await query(`
      INSERT INTO categories (name, description, color, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, color, icon, created_at
    `, [name, description, color, icon]);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar categoría (solo administradores)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    // Verificar si la categoría existe
    const categoryResult = await query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (name) {
      const existingCategory = await query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
    }

    const result = await query(`
      UPDATE categories 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        icon = COALESCE($4, icon)
      WHERE id = $5
      RETURNING id, name, description, color, icon
    `, [name, description, color, icon, id]);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { category: result.rows[0] }
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar categoría (solo administradores)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la categoría existe
    const categoryResult = await query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si hay artículos asociados
    const articlesResult = await query(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = $1',
      [id]
    );

    const articlesCount = parseInt(articlesResult.rows[0].count);

    if (articlesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${articlesCount} artículos asociados`
      });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

