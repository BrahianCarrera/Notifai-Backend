const { query } = require('../config/database');

// Obtener todos los artículos con filtros y paginación
const getArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = 'published_at',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE a.is_published = true';
    const queryParams = [];
    let paramCount = 0;

    // Filtro por categoría
    if (category) {
      paramCount++;
      whereClause += ` AND a.category_id = $${paramCount}`;
      queryParams.push(category);
    }

    // Búsqueda por texto
    if (search) {
      paramCount++;
      whereClause += ` AND (a.title ILIKE $${paramCount} OR a.content ILIKE $${paramCount} OR a.summary ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Validar orden
    const validSorts = ['published_at', 'created_at', 'views_count', 'likes_count', 'title'];
    const validOrders = ['asc', 'desc'];
    const sortField = validSorts.includes(sort) ? sort : 'published_at';
    const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

    // Consulta principal
    const articlesQuery = `
      SELECT 
        a.id,
        a.title,
        a.summary,
        a.image_url,
        a.published_at,
        a.views_count,
        a.likes_count,
        a.tags,
        u.name as author_name,
        c.name as category_name,
        c.color as category_color,
        CASE WHEN uf.user_id IS NOT NULL THEN true ELSE false END as is_favorite,
        CASE WHEN al.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN user_favorites uf ON a.id = uf.article_id AND uf.user_id = $${paramCount + 1}
      LEFT JOIN article_likes al ON a.id = al.article_id AND al.user_id = $${paramCount + 1}
      ${whereClause}
      ORDER BY a.${sortField} ${sortOrder}
      LIMIT $${paramCount + 2} OFFSET $${paramCount + 3}
    `;

    queryParams.push(req.user?.id || null, limit, offset);

    const articles = await query(articlesQuery, queryParams);

    // Contar total de artículos para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -3); // Remover limit, offset y user_id
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        articles: articles.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener artículo por ID
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.summary,
        a.image_url,
        a.source_url,
        a.published_at,
        a.views_count,
        a.likes_count,
        a.tags,
        u.name as author_name,
        u.id as author_id,
        c.name as category_name,
        c.color as category_color,
        c.id as category_id,
        CASE WHEN uf.user_id IS NOT NULL THEN true ELSE false END as is_favorite,
        CASE WHEN al.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN user_favorites uf ON a.id = uf.article_id AND uf.user_id = $2
      LEFT JOIN article_likes al ON a.id = al.article_id AND al.user_id = $2
      WHERE a.id = $1 AND a.is_published = true
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    const article = result.rows[0];

    // Incrementar contador de vistas
    await query(
      'UPDATE articles SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: { article }
    });
  } catch (error) {
    console.error('Error obteniendo artículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo artículo (solo administradores)
const createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      summary,
      category_id,
      image_url,
      source_url,
      tags
    } = req.body;

    const authorId = req.user.id;

    const result = await query(`
      INSERT INTO articles (
        title, content, summary, author_id, category_id, 
        image_url, source_url, tags, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
      RETURNING id, title, summary, image_url, published_at
    `, [title, content, summary, authorId, category_id, image_url, source_url, tags]);

    const article = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Artículo creado exitosamente',
      data: { article }
    });
  } catch (error) {
    console.error('Error creando artículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar artículo
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar que el artículo existe y el usuario tiene permisos
    const articleResult = await query(
      'SELECT author_id FROM articles WHERE id = $1',
      [id]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    const article = articleResult.rows[0];

    // Solo el autor o un admin pueden actualizar
    if (article.author_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este artículo'
      });
    }

    const {
      title,
      content,
      summary,
      category_id,
      image_url,
      source_url,
      tags
    } = req.body;

    const updateResult = await query(`
      UPDATE articles 
      SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        summary = COALESCE($3, summary),
        category_id = COALESCE($4, category_id),
        image_url = COALESCE($5, image_url),
        source_url = COALESCE($6, source_url),
        tags = COALESCE($7, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, title, summary, updated_at
    `, [title, content, summary, category_id, image_url, source_url, tags, id]);

    res.json({
      success: true,
      message: 'Artículo actualizado exitosamente',
      data: { article: updateResult.rows[0] }
    });
  } catch (error) {
    console.error('Error actualizando artículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar artículo
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar que el artículo existe y el usuario tiene permisos
    const articleResult = await query(
      'SELECT author_id FROM articles WHERE id = $1',
      [id]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    const article = articleResult.rows[0];

    // Solo el autor o un admin pueden eliminar
    if (article.author_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este artículo'
      });
    }

    await query('DELETE FROM articles WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Artículo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando artículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar/quitar artículo de favoritos
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el artículo existe
    const articleResult = await query(
      'SELECT id FROM articles WHERE id = $1 AND is_published = true',
      [id]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    // Verificar si ya está en favoritos
    const favoriteResult = await query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND article_id = $2',
      [userId, id]
    );

    if (favoriteResult.rows.length > 0) {
      // Remover de favoritos
      await query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND article_id = $2',
        [userId, id]
      );

      res.json({
        success: true,
        message: 'Artículo removido de favoritos',
        data: { is_favorite: false }
      });
    } else {
      // Agregar a favoritos
      await query(
        'INSERT INTO user_favorites (user_id, article_id) VALUES ($1, $2)',
        [userId, id]
      );

      res.json({
        success: true,
        message: 'Artículo agregado a favoritos',
        data: { is_favorite: true }
      });
    }
  } catch (error) {
    console.error('Error gestionando favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Dar like/dislike a un artículo
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el artículo existe
    const articleResult = await query(
      'SELECT id FROM articles WHERE id = $1 AND is_published = true',
      [id]
    );

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artículo no encontrado'
      });
    }

    // Verificar si ya tiene like
    const likeResult = await query(
      'SELECT id FROM article_likes WHERE user_id = $1 AND article_id = $2',
      [userId, id]
    );

    if (likeResult.rows.length > 0) {
      // Remover like
      await query(
        'DELETE FROM article_likes WHERE user_id = $1 AND article_id = $2',
        [userId, id]
      );

      // Decrementar contador
      await query(
        'UPDATE articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Like removido',
        data: { is_liked: false }
      });
    } else {
      // Agregar like
      await query(
        'INSERT INTO article_likes (user_id, article_id) VALUES ($1, $2)',
        [userId, id]
      );

      // Incrementar contador
      await query(
        'UPDATE articles SET likes_count = likes_count + 1 WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Like agregado',
        data: { is_liked: true }
      });
    }
  } catch (error) {
    console.error('Error gestionando likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  toggleFavorite,
  toggleLike
};

