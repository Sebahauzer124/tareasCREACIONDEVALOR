const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const archivoExcel = path.join(__dirname, 'Libro1.xlsx');

app.get('/get-vendedores-y-tareas', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(archivoExcel);
        const worksheet = workbook.getWorksheet(1);

        const datos = {};
        const tiposTareas = new Set();

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const vendedor = row.getCell(4).value;
            const tarea = row.getCell(13).value;
            const tipoTarea = row.getCell(12).value;
            const pdv = row.getCell(43).value?.result || 'Sin PDV';
            const visitado = row.getCell(45).value?.result || 'No visitado';
            const canjeo = row.getCell(46).value?.result || 'No canjeó';
            const puntos = row.getCell(47).value?.result || 0;
            const desafio = row.getCell(48).value?.result || 'No completó';

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
        console.error('Error al leer el archivo Excel:', error);
        res.status(500).json({ error: 'Error al leer el archivo Excel', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
