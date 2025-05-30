const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 8080;

// URL de conexión a MongoDB
const uri = 'mongodb+srv://tareas:tareas@tareas.kgkoghr.mongodb.net/?retryWrites=true&w=majority&appName=tareas'; // Cambia esto si usas Mongo Atlas u otro host
const dbName = 'tareas'; // Tu base de datos
const collectionName = 'tareas'; // Tu colección

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
            const vendedor = doc.vendedor;
            const tarea = doc.tarea;
            const tipoTarea = doc.tipoTarea;
            const pdv = doc.pdv || 'Sin PDV';
            const visitado = doc.visitado || 'No visitado';
            const canjeo = doc.canjeo || 'No canjeó';
            const puntos = doc.puntos || 0;
            const desafio = doc.desafio || 'No completó';

            if (!vendedor || !tarea || !tipoTarea) return;

            if (!datos[vendedor]) {
                datos[vendedor] = {};
            }

            if (!datos[vendedor][pdv]) {
                datos[vendedor][pdv] = [];
            }

            datos[vendedor][pdv].push({
                descripcion: tarea,
                tipo: tipoTarea,
                visitado,
                canjeo,
                puntos,
                desafio
            });

            tiposTareas.add(tipoTarea);
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
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
