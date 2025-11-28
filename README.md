# Notifai Backend API

Backend REST API para la aplicación móvil Notifai, una plataforma de noticias con funcionalidades de autenticación, gestión de artículos y categorías.

## 🚀 Características

- **Autenticación por Sesiones**: Sistema de login y registro seguro con sesiones
- **Gestión de Artículos**: CRUD completo para noticias
- **Categorías**: Organización de contenido por categorías
- **Favoritos y Likes**: Sistema de interacción con artículos
- **Búsqueda y Filtros**: Búsqueda avanzada de contenido
- **Paginación**: Manejo eficiente de grandes volúmenes de datos
- **Seguridad**: Rate limiting, validación de datos, sanitización
- **Base de Datos**: PostgreSQL con índices optimizados

## 📋 Requisitos Previos

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=notifai_db
   DB_USER=postgres
   DB_PASSWORD=tu_password
   SESSION_SECRET=tu_secreto_sesion_muy_seguro
   ```

4. **Configurar PostgreSQL**
   ```sql
   CREATE DATABASE notifai_db;
   CREATE USER postgres WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE notifai_db TO postgres;
   ```

5. **Ejecutar migraciones**
   ```bash
   npm run migrate
   ```

6. **Iniciar el servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 📚 Documentación de la API

### Base URL
```
http://localhost:3000/api
```

### Autenticación

#### POST /auth/register
Registrar nuevo usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123",
  "name": "Nombre Usuario"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "name": "Nombre Usuario",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /auth/login
Iniciar sesión.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

#### POST /auth/logout
Cerrar sesión del usuario autenticado.

#### GET /auth/profile
Obtener perfil del usuario autenticado.

**Nota:** Requiere sesión activa (cookie de sesión).

### Artículos

#### GET /articles
Obtener lista de artículos con filtros y paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Artículos por página (default: 10, max: 100)
- `category` (opcional): ID de categoría
- `search` (opcional): Término de búsqueda
- `sort` (opcional): Campo de ordenamiento (published_at, created_at, views_count, likes_count, title)
- `order` (opcional): Dirección del ordenamiento (asc, desc)

**Ejemplo:**
```
GET /articles?page=1&limit=10&category=1&search=tecnología&sort=published_at&order=desc
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Título del artículo",
        "summary": "Resumen del artículo",
        "image_url": "https://ejemplo.com/imagen.jpg",
        "published_at": "2024-01-01T00:00:00.000Z",
        "views_count": 150,
        "likes_count": 25,
        "tags": ["tag1", "tag2"],
        "author_name": "Autor",
        "category_name": "Tecnología",
        "category_color": "#007AFF",
        "is_favorite": false,
        "is_liked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET /articles/:id
Obtener artículo por ID.

#### POST /articles
Crear nuevo artículo (requiere sesión activa y rol admin).

**Nota:** Requiere sesión activa con rol de administrador.

**Body:**
```json
{
  "title": "Título del artículo",
  "content": "Contenido completo del artículo...",
  "summary": "Resumen del artículo",
  "category_id": 1,
  "image_url": "https://ejemplo.com/imagen.jpg",
  "source_url": "https://fuente.com",
  "tags": ["tag1", "tag2"]
}
```

#### PUT /articles/:id
Actualizar artículo (requiere sesión activa y ser autor o admin).

#### DELETE /articles/:id
Eliminar artículo (requiere sesión activa y ser autor o admin).

#### POST /articles/:id/favorite
Agregar/quitar artículo de favoritos (requiere sesión activa).

#### POST /articles/:id/like
Dar like/dislike a un artículo (requiere sesión activa).

### Categorías

#### GET /categories
Obtener todas las categorías.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Tecnología",
        "description": "Noticias sobre tecnología e innovación",
        "color": "#007AFF",
        "icon": "tech",
        "articles_count": 25
      }
    ]
  }
}
```

#### GET /categories/:id
Obtener categoría por ID.

#### POST /categories
Crear nueva categoría (requiere sesión activa y rol admin).

#### PUT /categories/:id
Actualizar categoría (requiere sesión activa y rol admin).

#### DELETE /categories/:id
Eliminar categoría (requiere sesión activa y rol admin).

## 🔒 Autenticación

La API utiliza sesiones HTTP para la autenticación. Las sesiones se manejan automáticamente mediante cookies:

- **Login**: Crea una sesión activa
- **Logout**: Destruye la sesión
- **Verificación**: Middleware verifica sesión activa en rutas protegidas

## 📊 Códigos de Estado HTTP

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos de entrada inválidos
- `401` - Unauthorized: No autenticado
- `403` - Forbidden: Sin permisos
- `404` - Not Found: Recurso no encontrado
- `409` - Conflict: Conflicto (ej: email duplicado)
- `413` - Payload Too Large: Archivo demasiado grande
- `429` - Too Many Requests: Límite de requests excedido
- `500` - Internal Server Error: Error interno del servidor

## 🛡️ Seguridad

- **Rate Limiting**: 100 requests por 15 minutos por IP
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de origen cruzado
- **Validación**: Validación y sanitización de datos de entrada
- **Sesiones**: Manejo seguro de sesiones HTTP
- **Bcrypt**: Encriptación de contraseñas

## 🗄️ Base de Datos

### Esquema Principal

- **users**: Usuarios del sistema
- **categories**: Categorías de artículos
- **articles**: Artículos de noticias
- **user_favorites**: Favoritos de usuarios
- **article_likes**: Likes de artículos

### Índices Optimizados

- Búsqueda full-text en títulos y contenido
- Índices en categorías y fechas de publicación
- Índices en relaciones de favoritos y likes

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar servidor en desarrollo con nodemon
npm run migrate    # Ejecutar migraciones de base de datos
npm test           # Ejecutar tests
```

## 🌍 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3000 |
| `NODE_ENV` | Entorno de ejecución | development |
| `DB_HOST` | Host de PostgreSQL | localhost |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_NAME` | Nombre de la base de datos | notifai_db |
| `DB_USER` | Usuario de PostgreSQL | postgres |
| `DB_PASSWORD` | Contraseña de PostgreSQL | - |
| `SESSION_SECRET` | Secreto para sesiones | - |

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo o crea un issue en el repositorio.
