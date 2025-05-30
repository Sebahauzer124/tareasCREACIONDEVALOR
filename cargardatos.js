const ExcelJS = require('exceljs');
const { MongoClient } = require('mongodb');
const path = require('path');

// Configuración de MongoDB
const uri = 'mongodb+srv://tareas:tareas@tareas.kgkoghr.mongodb.net/?retryWrites=true&w=majority&appName=tareas'; // Cambiar si usás MongoDB Atlas
const dbName = 'tareas';
const collectionName = 'tareas';

// Ruta al archivo Excel
const archivoExcel = path.join(__dirname, 'Libro1.xlsx');

async function cargarDatosDesdeExcel() {
    const client = new MongoClient(uri);


    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Limpiar colección antes de cargar nuevos datos (opcional)
        await collection.deleteMany({});

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(archivoExcel);
        const worksheet = workbook.getWorksheet(1);

        const documentos = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Saltar encabezado

            const vendedor = row.getCell(4).value;
            const tarea = row.getCell(13).value;
            const tipoTarea = row.getCell(12).value;
            const pdv = row.getCell(43).value?.result || 'Sin PDV';
            const visitado = row.getCell(45).value?.result || 'No visitado';
            const canjeo = row.getCell(46).value?.result || 'No canjeó';
            const puntos = row.getCell(47).value?.result || 0;
            const desafio = row.getCell(48).value?.result || 'No completó';

            if (!vendedor || !tarea || !tipoTarea) return;

            documentos.push({
                vendedor,
                tarea,
                tipoTarea,
                pdv,
                visitado,
                canjeo,
                puntos,
                desafio
            });
        });

        if (documentos.length > 0) {
            await collection.insertMany(documentos);
            console.log(`Se cargaron ${documentos.length} documentos en MongoDB.`);
        } else {
            console.log('No se encontraron datos para cargar.');
        }

    } catch (error) {
        console.error('Error al cargar datos:', error);
    } finally {
        await client.close();
    }
}

cargarDatosDesdeExcel();
