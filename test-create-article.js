const axios = require('axios');

// Script de prueba para crear artículo sin autenticación
async function testCreateArticle() {
  try {
    const articleData = {
      title: "Noticia de prueba sin autenticación",
      content: "Este es el contenido de una noticia creada sin necesidad de sesión o cookie.",
      summary: "Resumen de la noticia de prueba",
      category_id: 1, // Asegúrate de que existe esta categoría
      image_url: "https://ejemplo.com/imagen.jpg",
      source_url: "https://ejemplo.com/fuente",
      tags: ["prueba", "sin-autenticacion"]
    };

    console.log('🚀 Enviando solicitud para crear artículo sin autenticación...');
    
    const response = await axios.post('http://localhost:3000/api/articles', articleData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Artículo creado exitosamente:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error al crear artículo:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la prueba
testCreateArticle();
