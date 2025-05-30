document.addEventListener("DOMContentLoaded", loadVendedoresYTareas);

let vendedoresTareas = {};
let tiposTareas = new Set();

function loadVendedoresYTareas() {
    fetch("https://tareascreaciondevalor.onrender.com/get-vendedores-y-tareas")
        .then(response => response.json())
        .then(data => {
            console.log("Datos recibidos del servidor:", data);
            vendedoresTareas = data.vendedoresTareas || {};
            tiposTareas = new Set(data.tiposTareas || []);
            cargarVendedores();
            cargarTiposDeTarea();
        })
        .catch(error => console.error("Error al cargar los vendedores y tareas:", error));
}

function cargarVendedores() {
    const selectVendedores = document.getElementById("vendedores");
    selectVendedores.innerHTML = "<option value=''>Selecciona un vendedor</option>";

    Object.keys(vendedoresTareas).forEach(vendedor => {
        const option = document.createElement("option");
        option.value = vendedor;
        option.textContent = vendedor;
        selectVendedores.appendChild(option);
    });

    selectVendedores.addEventListener('change', mostrarPdvPorVendedor);
}

function cargarTiposDeTarea() {
    const selectTipos = document.getElementById("tiposTareas");
    selectTipos.innerHTML = "<option value=''>Selecciona un tipo de tarea</option>";

    tiposTareas.forEach(tipo => {
        const option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        selectTipos.appendChild(option);
    });

    selectTipos.addEventListener('change', mostrarPdvPorVendedor);
}

function mostrarPdvPorVendedor() {
    const vendedorSeleccionado = document.getElementById("vendedores").value;
    const tipoTareaSeleccionado = document.getElementById("tiposTareas").value;
    const listadoPdv = document.getElementById("listadoPdv");
    listadoPdv.innerHTML = "";

    if (!vendedorSeleccionado || !vendedoresTareas[vendedorSeleccionado]) {
        listadoPdv.innerHTML = "<li>No hay PDVs disponibles</li>";
        return;
    }

    let pdvs = Object.entries(vendedoresTareas[vendedorSeleccionado]);

    pdvs.sort((a, b) => b[1].length - a[1].length);

    pdvs.forEach(([pdv, tareas]) => {
        let tareasFiltradas = tareas;
        if (tipoTareaSeleccionado) {
            tareasFiltradas = tareas.filter(tarea => tarea.tipo === tipoTareaSeleccionado);
        }

        if (tareasFiltradas.length > 0) {
            const listItem = document.createElement("li");
            listItem.classList.add("pdv-item"); // Agregamos la clase para el filtrado

            const visitadoClass = tareas[0].visitado === "VISITADO" ? "visitado" : "no-visitado";
            const canjeoClass = tareas[0].canjeo === "SI" ? "canjeo-si" : "canjeo-no";
            const desafioClass = tareas[0].desafio === "COMPLETO" ? "desafio-si" : "desafio-no";

            listItem.innerHTML = ` 
                <strong>${pdv}</strong> - <span class="puntos">Tareas: ${tareasFiltradas.length}</span>
                <br> Visitado: <span class="${visitadoClass}">${tareas[0].visitado}</span>
                | Canjeó Puntos: <span class="${canjeoClass}">${tareas[0].canjeo}</span>
                | Puntos: <span class="puntos">${tareas[0].puntos}</span>
                | Desafío: <span class="${desafioClass}">${tareas[0].desafio}</span>`;

            const contenedorTareas = document.createElement("ul");
            contenedorTareas.style.display = "none";

            tareasFiltradas.forEach(tarea => {
                const tareaItem = document.createElement("li");
                tareaItem.textContent = tarea.descripcion;
                contenedorTareas.appendChild(tareaItem);
            });

            listItem.appendChild(contenedorTareas);
            listItem.addEventListener("click", () => {
                contenedorTareas.style.display = contenedorTareas.style.display === "none" ? "block" : "none";
            });

            listadoPdv.appendChild(listItem);
        }
    });
}

// Función para filtrar PDVs en tiempo real
function filtrarPdvs() {
    const input = document.getElementById("buscadorPdv").value.toLowerCase();
    const listaPdvs = document.querySelectorAll("#listadoPdv .pdv-item");

    listaPdvs.forEach(item => {
        const nombrePdv = item.textContent.toLowerCase();
        item.style.display = nombrePdv.includes(input) ? "block" : "none";
    });
}
