const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 8080;

const uri = 'mongodb+srv://tareas:tareas@tareas.kgkoghr.mongodb.net/?retryWrites=true&w=majority&appName=tareas';
const dbName = 'tareas';
const collectionName = 'tareas';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/get-vendedores-y-tareas', async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const documentos = await collection.find({}).toArray();

    const datos = {};
    const tiposTareas = new Set();

    documentos.forEach(doc => {
      const vendedor = doc.vendedor || 'Sin vendedor';
      const pdv = doc.pdv || 'Sin PDV';

      if (!datos[vendedor]) {
        datos[vendedor] = {};
      }
      if (!datos[vendedor][pdv]) {
        datos[vendedor][pdv] = [];
      }

      // Normalizar fecha a formato dd/mm/yyyy
      let fechaFormateada = 'Sin fecha';
      if (doc.fecha) {
        if (typeof doc.fecha === 'string') {
          // Si ya es string, suponemos formato correcto
          fechaFormateada = doc.fecha;
        } else if (doc.fecha instanceof Date) {
          // Si es Date, formateamos
          const d = doc.fecha.getDate().toString().padStart(2, '0');
          const m = (doc.fecha.getMonth() + 1).toString().padStart(2, '0');
          const y = doc.fecha.getFullYear();
          fechaFormateada = `${d}/${m}/${y}`;
        }
      }

      datos[vendedor][pdv].push({
        descripcion: doc.tarea || 'Sin tarea',
        tipo: doc.tipoTarea || 'Sin tipo',
        visitado: doc.visitado || 'No visitado',
        canjeo: doc.canjeo || 'No canjeó',
        puntos: doc.puntos || 0,
        desafio: doc.desafio || 'No completó',
        cantidadTareas: doc.cantidadTareas || 0,
        // Convertir a número 1 o 0 para facilitar filtro en frontend
        tareaCompletada: doc.tareaCompletada === 1 || doc.tareaCompletada === true ? 1 : 0,
        tareaValidada: doc.tareaValidada === 1 || doc.tareaValidada === true ? 1 : 0,
        fecha: fechaFormateada,
      });

      if (doc.tipoTarea) {
        tiposTareas.add(doc.tipoTarea);
      }
    });

    res.json({ vendedoresTareas: datos, tiposTareas: Array.from(tiposTareas) });

  } catch (error) {
    console.error('Error al acceder a MongoDB:', error);
    res.status(500).json({ error: 'Error al acceder a MongoDB', message: error.message });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});