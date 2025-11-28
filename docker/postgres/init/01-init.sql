-- Script de inicialización de la base de datos
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear usuario adicional si es necesario (opcional)
-- CREATE USER notifai_user WITH PASSWORD 'notifai_user_password';
-- GRANT ALL PRIVILEGES ON DATABASE notifai_db TO notifai_user;

-- Configurar parámetros de la base de datos
ALTER DATABASE notifai_db SET timezone TO 'UTC';
ALTER DATABASE notifai_db SET default_text_search_config TO 'spanish';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos notifai_db inicializada correctamente';
END $$;
