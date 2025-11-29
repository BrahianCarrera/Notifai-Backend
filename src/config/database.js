const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV === 'production') {
  console.log("🔗 Usando conexión REMOTA (Render)");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 0,
  });

} else {
  console.log("🛠 Usando conexión LOCAL (desarrollo)");

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'notifai_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔎 Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Error en query:', err);
    throw err;
  }
};

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('👌 Conexión a PostgreSQL exitosa');
    client.release();
    return true;
  } catch (err) {
    console.error('⚠️ Error al conectar con PostgreSQL:', err.message);
    return false;
  }
};

module.exports = { pool, query, testConnection };
