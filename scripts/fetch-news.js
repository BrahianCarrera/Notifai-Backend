require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === Configuración ===
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000/api/articles";
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`;
const SESSION_COOKIE = process.env.SESSION_COOKIE;

// === Obtener noticias ===
async function fetchNews() {
  try {
    const { data } = await axios.get(NEWS_API_URL);
    if (!data.articles || data.articles.length === 0) {
      console.log("⚠️ No se encontraron noticias nuevas.");
      return [];
    }
    return data.articles.slice(0, 5);
  } catch (error) {
    console.error("❌ Error obteniendo noticias:", error.message);
    return [];
  }
}

// === Traducir, resumir y categorizar con Gemini ===
async function processArticleText(article) {
  try {
    const text = article.content || article.description || "";
    if (!text || text.length < 40) {
      console.warn(`⚠️ Noticia demasiado corta: "${article.title}"`);
      return { summary: null, translated: text, titleTranslated: article.title, category: "General", tags: ["noticia"] };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Traduce y analiza la siguiente noticia.

      Devuelve un JSON **válido** con las claves:
      {
        "titulo_traducido": "título traducido al español",
        "texto_traducido": "contenido traducido al español",
        "resumen": "resumen breve (3-4 oraciones)",
        "category": "Indica la categoría, elige solo una de las siguientes: Tecnología, Deportes, Política, Economía, Salud, Entretenimiento, Internacional, Ciencia, Medio ambiente o Cultura",
        "etiquetas": ["lista", "de", "tags", "relevantes"]
      }

      Título: "${article.title}"
      Texto: """${text}"""
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extraer JSON de la respuesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer JSON del modelo.");

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`🧩 Categoría detectada por Gemini: "${parsed.category}"`);

    return {
      titleTranslated: parsed.titulo_traducido,
      translated: parsed.texto_traducido,
      summary: parsed.resumen,
      category: parsed.category || "General",
      tags: parsed.etiquetas || ["noticia", "IA"]
    };
  } catch (error) {
    console.error("❌ Error procesando artículo:", error.message);
    return {
      titleTranslated: article.title,
      translated: article.content || "",
      summary: null,
      category: "General",
      tags: ["noticia"]
    };
  }
}

// === Mapa de categorías ===
const CATEGORY_MAP = {
  // === Categorías existentes ===
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



// === Guardar artículo en el backend ===
// === Guardar artículo en el backend ===
async function saveArticle(article, processed) {
  // Normalizar nombre de categoría
  const categoryName = (processed.category || "General").toLowerCase().trim();
  const categoryId = CATEGORY_MAP[categoryName] || null;

  // Si no se encuentra la categoría, registrar advertencia
  if (!categoryId) {
    console.warn(`⚠️ Categoría desconocida: "${processed.category}" → asignando "General"`);
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
        "Content-Type": "application/json",
        Cookie: `connect.sid=${SESSION_COOKIE}`
      }
    });
    console.log(`✅ Noticia guardada: ${payload.title} (Categoría ${categoryId || 1})`);
  } catch (err) {
    if (err.response) {
      console.error("❌ Error al guardar:", err.response.data);
    } else {
      console.error("❌ Error de conexión:", err.message);
    }
  }
}

// === Proceso principal ===
async function processNews() {
  console.log("🕒 Iniciando proceso de actualización de noticias...\n");
  const articles = await fetchNews();
  if (articles.length === 0) return;

  for (const article of articles) {
    const processed = await processArticleText(article);
    console.log(`🧩 Categoría procesada: "${processed.category}"`);
    await saveArticle(article, processed);
  }

  console.log("\n✅ Proceso completado.\n");
}

// === Cron automático cada 3 días ===
//cron.schedule("0 0 */3 * *", processNews);

// === Ejecución manual ===
if (require.main === module) {
  processNews();
}
