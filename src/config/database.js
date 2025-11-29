const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// Función para obtener la cadena de conexión o el objeto de configuración
const getDbConfig = () => {
    // Si DATABASE_URL está definida (generalmente en producción como Render/Supabase)
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: isProd ? { rejectUnauthorized: false } : false,
        };
    }

    // Si usamos variables separadas (generalmente en desarrollo/Docker Compose)
    // Nota: Aquí se asume que si no hay DATABASE_URL, estamos en un entorno
    // donde las variables DB_HOST, DB_USER, etc., están configuradas (por ejemplo, local).
    if (process.env.DB_HOST && process.env.DB_USER) {
        console.log('Usando configuración separada de base de datos (DB_HOST, etc.)');
        return {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || 5432, 10),
            ssl: isProd ? { rejectUnauthorized: false } : false, // Sigue aplicando SSL en prod
        };
    }

    // En caso de que falten todas las variables críticas
    console.error("CRÍTICO: No se encontró DATABASE_URL ni configuración de DB separada.");
    // Dejamos que el cliente pg falle y genere el error 'ECONNREFUSED'
    return {};
};

const dbConfig = getDbConfig();
const pool = new Pool(dbConfig);

// Manejo de errores de conexión (resto del archivo original)
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL:', err);
  process.exit(-1);
});

// Probar conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    return false;
  }
};

const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Error en query:', err);
    throw err;
  }
};

module.exports = { pool, query, testConnection };
