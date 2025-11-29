const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  // IMPORTANTE PARA SUPABASE SESSION POOLER
  max: 1,
  idleTimeoutMillis: 0,
});

pool.on('error', (err) => {
  console.error('Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL OK');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar PostgreSQL:', err.message);
    return false;
  }
};

module.exports = { pool, testConnection };
