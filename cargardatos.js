const ExcelJS = require('exceljs');
const { MongoClient } = require('mongodb');
const path = require('path');

// Configuración de MongoDB
const uri = 'mongodb+srv://tareas:tareas@tareas.kgkoghr.mongodb.net/?retryWrites=true&w=majority&appName=tareas';
const dbName = 'tareas';
const collectionName = 'tareas';

// Ruta al archivo Excel
const archivoExcel = path.join(__dirname, 'Libro1.xlsx');

// Función para formatear fechas desde Excel
function formatearFechaExcel(valorCelda) {
    let valor = valorCelda;

    if (valor && typeof valor === 'object' && 'result' in valor) {
        valor = valor.result;
    }

    // Si ya es una fecha
    if (valor instanceof Date) {
        const dia = String(valor.getDate()).padStart(2, '0');
        const mes = String(valor.getMonth() + 1).padStart(2, '0');
        const anio = valor.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    // Si es número serial de Excel
    if (typeof valor === 'number') {
        const fechaExcel = new Date((valor - 25569) * 86400 * 1000);
        return formatearFechaExcel(fechaExcel);
    }

    return 'Sin fecha';
}

async function cargarDatosDesdeExcel() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.deleteMany({}); // Limpiar la colección

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(archivoExcel);
        const worksheet = workbook.getWorksheet(1);

        const documentos = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Saltar encabezado

            const vendedor = row.getCell(4).value;
            const tarea = row.getCell(13).value;
            const tipoTarea = row.getCell(12).value;
            const pdv = row.getCell(43).value?.result || row.getCell(43).value || 'Sin PDV';
            const visitado = row.getCell(45).value?.result || row.getCell(45).value || 'No visitado';
            const canjeo = row.getCell(46).value?.result || row.getCell(46).value || 'No canjeó';
            const puntos = row.getCell(47).value?.result || row.getCell(47).value || 0;
            const desafio = row.getCell(48).value?.result || row.getCell(48).value || 'No completó';

            const cantidadTareas = row.getCell(20).value || 0;
            const tareaCompletada = row.getCell(21).value ||0;
            const tareaValidada = row.getCell(22).value || 0;

            const rawFecha = row.getCell(49).value;
            const fecha = formatearFechaExcel(rawFecha);

            if (!vendedor || !tarea || !tipoTarea) return;

            documentos.push({
                vendedor,
                tarea,
                tipoTarea,
                pdv,
                visitado,
                canjeo,
                puntos,
                desafio,
                cantidadTareas,
                tareaCompletada,
                tareaValidada,
                fecha
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
