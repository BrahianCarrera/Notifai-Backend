#!/bin/bash

# Script para inicializar la aplicación después de que los contenedores estén listos
echo "🚀 Iniciando configuración de Notifai..."

# Esperar a que PostgreSQL esté completamente listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL no está listo - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está listo"

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones de base de datos..."
cd /app
node src/database/migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Migraciones ejecutadas exitosamente"
else
    echo "❌ Error ejecutando migraciones"
    exit 1
fi

echo "🎉 Configuración completada. La aplicación está lista!"
