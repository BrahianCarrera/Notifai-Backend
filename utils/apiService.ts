// Usamos una variable booleana simple para simular __DEV__ en entornos web/canvas.
const IS_DEVELOPMENT = true; 

// --- 1. CONFIGURACIÓN Y FUNCIONES BASE DE LA API ---

export const API_CONFIG = {
  // Configuración de la API: Cambiar según el entorno
  BASE_URL: IS_DEVELOPMENT ? 'http://localhost:3000/api' : 'https://tu-dominio.com/api',
  
  // Timeouts (no usado directamente en fetch, pero mantenido por consistencia)
  TIMEOUT: 10000, // 10 segundos
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Realiza una solicitud fetch a la API con manejo de configuración base.
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    } as HeadersInit, // Aseguramos que el tipo sea compatible
    credentials: 'include', // Asumimos CORS con credenciales, si aplica
  };

  return fetch(url, config);
};

/**
 * Función helper para manejar respuestas de la API, parsear JSON y manejar errores.
 */
export const handleApiResponse = async (response: Response): Promise<any> => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    // Si la respuesta no es un JSON válido, lanzamos un error genérico.
    if (!response.ok) {
        throw new Error(`Error ${response.status}: Respuesta del servidor no JSON.`);
    }
    // Si es OK, pero no es JSON (ej. 204 No Content), devolvemos un objeto vacío.
    return {}; 
  }
  
  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}`);
  }
  
  return data;
};

// --- 2. FUNCIONES AUXILIARES Y DE NEGOCIO ---

// Endpoints específicos (para mayor claridad)
const ARTICLES_ENDPOINT = "/articles";
const CATEGORIES_ENDPOINT = "/categories";
const BOOKMARKS_ENDPOINT = "/articles/bookmarks";

/**
 * Función que simula la obtención del token de autenticación del usuario.
 */
const getAuthToken = (): string => {
  // En una app real, esto vendría de un Context o local storage.
  return "MOCK_USER_AUTH_TOKEN_12345"; 
};

// Función auxiliar para formatear vistas
export const formatViews = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return String(count);
};


// --- 3. FUNCIONES DE ALTO NIVEL CON LÓGICA CENTRALIZADA ---

/**
 * Obtiene los artículos del backend con paginación, filtros y búsqueda.
 */
export const fetchArticles = async ({ 
  page = 1, 
  limit = 10, 
  sort = 'published_at', 
  order = 'desc', 
  category, 
  search,
  signal 
}: {
  page?: number,
  limit?: number,
  sort?: string,
  order?: 'asc' | 'desc',
  category?: number | string | null,
  search?: string,
  signal?: AbortSignal
}): Promise<any> => {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("sort", sort);
  params.set("order", order);

  if (search) params.set("search", search.trim());
  if (category && category !== 0) params.set("category", String(category));

  const endpoint = `${ARTICLES_ENDPOINT}?${params.toString()}`;

  try {
    const response = await apiRequest(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      signal: signal,
    });

    const data = await handleApiResponse(response);
    return data.data; // Asumimos que la respuesta envuelve los datos en un campo 'data'
  } catch (error) {
    if ((error as Error).name === 'AbortError') return null; 
    console.error("Fetch Articles Error:", error);
    throw error;
  }
};

/**
 * Obtiene los artículos favoritos del usuario.
 */
export const fetchBookmarks = async ({ page, sort, order, limit = 10 }: {
    page: number,
    sort: string,
    order: 'asc' | 'desc',
    limit?: number
}): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Usuario no autenticado.");

  const endpoint = `${BOOKMARKS_ENDPOINT}?page=${page}&limit=${limit}&sort=${sort}&order=${order}`;

  try {
    const response = await apiRequest(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await handleApiResponse(response);
    return data.data; // Asumimos que la respuesta envuelve los datos en un campo 'data'
  } catch (error) {
    console.error("Fetch Bookmarks Error:", error);
    throw error;
  }
};

/**
 * Obtiene la lista de categorías.
 */
export const fetchCategories = async (): Promise<any[]> => {
    try {
        const response = await apiRequest(CATEGORIES_ENDPOINT);
        const data = await handleApiResponse(response);
        return data.data.categories || [];
    } catch (error) {
        console.error("Fetch Categories Error:", error);
        throw error;
    }
};

/**
 * Lógica para alternar favorito (Toggle Favorite).
 */
export const apiToggleFavorite = async (articleId: string | number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("No token");

  const endpoint = `${ARTICLES_ENDPOINT}/${articleId}/favorite`;

  try {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error("API Toggle Favorite Error:", error);
    throw error;
  }
};


export const apiToggleLike = async (articleId: string | number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("No token");
  
  const endpoint = `${ARTICLES_ENDPOINT}/${articleId}/like`;

  try {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error("API Toggle Like Error:", error);
    throw error;
  }
};