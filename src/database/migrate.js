const { query } = require('../config/database');

const createTables = async () => {
  try {
    console.log('🔄 Iniciando migración de base de datos...');

    // Tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de categorías de noticias
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#007AFF',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de artículos de noticias
    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        source_url VARCHAR(500),
        tags TEXT[],
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de favoritos de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, article_id)
      )
    `);

    // Tabla de likes de artículos
    await query(`
      CREATE TABLE IF NOT EXISTS article_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, article_id)
      )
    `);

    // Índices para mejorar el rendimiento
    await query(`
      CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_articles_title ON articles USING gin(to_tsvector('spanish', title));
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_articles_content ON articles USING gin(to_tsvector('spanish', content));
    `);

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
};

const seedInitialData = async () => {
  try {
    console.log('🌱 Insertando datos iniciales...');

    // Insertar categorías por defecto
    const categories = [
      { name: 'Tecnología', description: 'Noticias sobre tecnología e innovación', color: '#007AFF', icon: 'tech' },
      { name: 'Deportes', description: 'Noticias deportivas y eventos', color: '#FF3B30', icon: 'sports' },
      { name: 'Política', description: 'Noticias políticas y gubernamentales', color: '#FF9500', icon: 'politics' },
      { name: 'Economía', description: 'Noticias económicas y financieras', color: '#34C759', icon: 'economy' },
      { name: 'Salud', description: 'Noticias sobre salud y bienestar', color: '#5856D6', icon: 'health' },
      { name: 'Entretenimiento', description: 'Noticias de entretenimiento y cultura', color: '#FF2D92', icon: 'entertainment' }
    ];

    for (const category of categories) {
      await query(`
        INSERT INTO categories (name, description, color, icon) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (name) DO NOTHING
      `, [category.name, category.description, category.color, category.icon]);
    }

    console.log('✅ Datos iniciales insertados');
  } catch (error) {
    console.error('❌ Error insertando datos iniciales:', error);
    throw error;
  }
};

const runMigration = async () => {
  try {
    await createTables();
    await seedInitialData();
    console.log('🎉 Migración y seeding completados');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error en la migración:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration();
}

module.exports = { createTables, seedInitialData };

