require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Funcion para descargar el contenido completo del articulo
async function fetchFullArticleContent(url) {
  try {
    console.log(`Intentando descargar contenido completo de: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.data) {
      // Remover etiquetas HTML basicas y scripts
      let text = response.data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Limitar a un tamaño razonable (primeros 8000 caracteres)
      if (text.length > 8000) {
        text = text.substring(0, 8000);
      }

      console.log(`Contenido descargado: ${text.length} caracteres`);
      return text;
    }

    return null;
  } catch (error) {
    console.warn(`No se pudo descargar el contenido completo: ${error.message}`);
    return null;
  }
}

// Configuracion
const BACKEND_URL = "https://notifai-backend.onrender.com/api/articles";
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`;

// Obtener noticias
async function fetchNews() {
  try {
    const { data } = await axios.get(NEWS_API_URL);
    if (!data.articles || data.articles.length === 0) {
      console.log("No se encontraron noticias nuevas.");
      return [];
    }
    return data.articles.slice(0, 5);
  } catch (error) {
    console.error("Error obteniendo noticias:", error.message);
    return [];
  }
}

// Traducir, resumir y categorizar con Gemini
async function processArticleText(article) {
  try {
    // Intentar descargar el contenido completo desde la URL fuente
    let fullContent = null;
    if (article.url) {
      fullContent = await fetchFullArticleContent(article.url);
    }

    // Si no se pudo descargar, usar el contenido de NewsAPI
    const text = fullContent || article.content || article.description || "";

    if (!text || text.length < 40) {
      console.warn(`Noticia demasiado corta: "${article.title}"`);
      return {
        summary: null,
        translated: text,
        titleTranslated: article.title,
        category: "General",
        tags: ["noticia"]
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Traduce y analiza la siguiente noticia al español.

      Devuelve un JSON valido con las siguientes claves:
      {
        "titulo_traducido": "titulo traducido al español",
        "contenido_completo_traducido": "contenido COMPLETO del articulo traducido al español. Debe ser el texto completo, no un resumen",
        "resumen": "resumen MUY BREVE de maximo 250 caracteres (2-3 oraciones cortas)",
        "category": "Indica la categoria, elige solo una de las siguientes: Tecnologia, Deportes, Politica, Economia, Salud, Entretenimiento, Internacional, Ciencia, Medio ambiente o Cultura",
        "etiquetas": ["lista", "de", "tags", "relevantes"]
      }

      IMPORTANTE:
      - El campo "contenido_completo_traducido" debe contener la traduccion COMPLETA del texto (sin limite de caracteres)
      - El campo "resumen" debe ser MUY BREVE, maximo 250 caracteres, solo lo mas importante

      Titulo: "${article.title}"
      Texto completo: """${text}"""
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extraer JSON de la respuesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer JSON del modelo.");

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`Categoria detectada por Gemini: "${parsed.category}"`);

    return {
      titleTranslated: parsed.titulo_traducido,
      translated: parsed.contenido_completo_traducido || parsed.texto_traducido,
      summary: parsed.resumen,
      category: parsed.category || "General",
      tags: parsed.etiquetas || ["noticia", "IA"]
    };
  } catch (error) {
    console.error("Error procesando articulo:", error.message);
    return {
      titleTranslated: article.title,
      translated: article.content || "",
      summary: null,
      category: "General",
      tags: ["noticia"]
    };
  }
}

// Mapa de categorias
const CATEGORY_MAP = {
  "tecnología": 1,
  "tecnologia": 1,
  "deportes": 2,
  "política": 3,
  "politica": 3,
  "economía": 4,
  "economia": 4,
  "salud": 5,
  "entretenimiento": 6,
  "internacional": 7,
  "ciencia": 8,
  "medio ambiente": 9,
  "medioambiente": 9,
  "ecología": 9,
  "ecologia": 9,
  "cultura": 10,
  "arte": 10
};



// Guardar articulo en el backend
async function saveArticle(article, processed) {
  // Normalizar nombre de categoría
  const categoryName = (processed.category || "General").toLowerCase().trim();
  const categoryId = CATEGORY_MAP[categoryName] || null;

  // Si no se encuentra la categoría, registrar advertencia
  if (!categoryId) {
    console.warn(`Categoria desconocida: "${processed.category}" - asignando "General"`);
  }

  const payload = {
    title: processed.titleTranslated || article.title || "Sin título",
    summary: processed.summary || "Resumen no disponible.",
    content: processed.translated || article.content || article.description || "Contenido no disponible.",
    category_id: categoryId || 1, // Fallback: Tecnología (1)
    image_url: article.urlToImage,
    source_url: article.url,
    tags: processed.tags || ["noticia", "IA"]
  };

  try {
    await axios.post(BACKEND_URL, payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log(`Noticia guardada: ${payload.title} (Categoria ${categoryId || 1})`);
  } catch (err) {
    if (err.response) {
      console.error("Error al guardar:", err.response.data);
    } else {
      console.error("Error de conexion:", err.message);
    }
  }
}

// Proceso principal
async function processNews() {
  console.log("Iniciando proceso de actualizacion de noticias...\n");
  const articles = await fetchNews();
  if (articles.length === 0) return;

  for (const article of articles) {
    const processed = await processArticleText(article);
    console.log(`Categoria procesada: "${processed.category}"`);
    await saveArticle(article, processed);
  }

  console.log("\nProceso completado.\n");
}

// Cron automatico cada 3 dias
//cron.schedule("0 0 */3 * *", processNews);

// Ejecucion manual
if (require.main === module) {
  processNews();
}

module.exports = { processNews };
