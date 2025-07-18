document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

let vendedoresTareas = {};
let tiposTareas = new Set();

async function inicializarApp() {
  try {
    await cargarDatos();
    poblarSelectores();
    agregarEventListeners();
  } catch (error) {
    console.error("Error al cargar los datos:", error);
  }
}

async function cargarDatos() {
  const res = await fetch("https://tareascreaciondevalor.onrender.com/get-vendedores-y-tareas");
  if (!res.ok) throw new Error("Error en la respuesta del servidor");
  const data = await res.json();

  vendedoresTareas = data.vendedoresTareas || {};
  tiposTareas = new Set(data.tiposTareas || []);

  console.log("Datos cargados:", { vendedoresTareas, tiposTareas });
}

function poblarSelectores() {
  llenarSelect("vendedores", Object.keys(vendedoresTareas), "Selecciona un vendedor");
  llenarSelect("tiposTareas", Array.from(tiposTareas), "Selecciona un tipo de tarea");
}

function llenarSelect(id, opciones, textoDefault) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${textoDefault}</option>`;
  opciones.forEach(opt => {
    const optionElem = document.createElement("option");
    optionElem.value = opt;
    optionElem.textContent = opt;
    select.appendChild(optionElem);
  });
}

function agregarEventListeners() {
  ["vendedores", "tiposTareas"].forEach(id =>
    document.getElementById(id).addEventListener("change", mostrarPdvsFiltrados)
  );
  document.getElementById("buscadorPdv").addEventListener("input", filtrarPdvs);
}

function mostrarPdvsFiltrados() {
  const vendedor = document.getElementById("vendedores").value;
  const tipoTarea = document.getElementById("tiposTareas").value;
  const listadoPdv = document.getElementById("listadoPdv");
  const contenedorTotales = document.getElementById("contenedorTotales");
  

  listadoPdv.innerHTML = "";
  contenedorTotales.innerHTML = "";

  if (!vendedor || !vendedoresTareas[vendedor]) {
    listadoPdv.innerHTML = "<li>No hay PDVs disponibles</li>";
    return;
  }

  const fechaHoyISO = obtenerFechaHoyISO();

  // Ordenar PDVs según cantidad de tareas (descendente)
  const pdvs = Object.entries(vendedoresTareas[vendedor]).sort(
    (a, b) => b[1].length - a[1].length
  );

  let totalTareas = 0, totalCompletadas = 0, totalValidadas = 0;

  pdvs.forEach(([pdv, tareas]) => {
    // Filtrar por tipo si aplica
    const tareasFiltradas = tareas.filter(t => !tipoTarea || t.tipo === tipoTarea);

    totalTareas += tareasFiltradas.length;
    totalCompletadas += tareasFiltradas.filter(estaCompletada).length;
    totalValidadas += tareasFiltradas.filter(estaValidada).length;

    // Solo tareas del día actual
    const tareasHoy = tareasFiltradas.filter(t => formatearFecha(t.fecha) === fechaHoyISO);

    if (tareasHoy.length === 0) return;

    const completadasHoy = tareasHoy.filter(estaCompletada).length;
    const validadasHoy = tareasHoy.filter(estaValidada).length;

    listadoPdv.appendChild(crearItemPdv(pdv, tareas, tareasHoy, completadasHoy, validadasHoy));
  });

  mostrarResumen(contenedorTotales, totalTareas, totalCompletadas, totalValidadas);
}

function obtenerFechaHoyISO() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - 1); // Ajuste para restar un día
  return hoy.toISOString().slice(0, 10);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return null;
  const [dia, mes, anio] = fechaStr.split("/");
  if (!dia || !mes || !anio) return null;
  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function estaCompletada(tarea) {
  const val = tarea.tareaCompletada;
  return val === 1 || val === true || (typeof val === "string" && val.toLowerCase() === "sí");
}

function estaValidada(tarea) {
  const val = tarea.tareaValidada;
  return val === 1 || val === true || (typeof val === "string" && val.toLowerCase() === "sí");
}

function crearItemPdv(pdv, tareas, tareasHoy, completadas, validadas) {
  const li = document.createElement("li");
  li.classList.add("pdv-item");

  const visitado = typeof tareas[0]?.visitado === "string" && tareas[0].visitado.toUpperCase() === "VISITADO"
    ? "visitado" : "no-visitado";

  const canjeoClass = typeof tareas[0]?.canjeo === "string" && tareas[0].canjeo.toUpperCase() === "SI"
    ? "canjeo-si" : "canjeo-no";

  li.innerHTML = `
    <strong>${pdv}</strong> - <span class="puntos">Tareas: ${tareasHoy.length}</span><br>
    Visitado: <span class="${visitado}">${tareas[0]?.visitado || "No info"}</span> |
    Canjeó Puntos: <span class="${canjeoClass}">${tareas[0]?.canjeo || "No info"}</span> |
    Puntos: <span class="puntos">${tareas[0]?.puntos || 0}</span><br>
  `;

  const ulTareas = document.createElement("ul");
  ulTareas.style.display = "none";

  tareasHoy.forEach(t => {
    const liTarea = document.createElement("li");
    liTarea.textContent = t.descripcion || t.tarea || "Sin descripción";
    ulTareas.appendChild(liTarea);
  });

  li.appendChild(ulTareas);

  li.addEventListener("click", () => {
    ulTareas.style.display = ulTareas.style.display === "none" ? "block" : "none";
  });

  return li;
}

function mostrarResumen(contenedor, total, completadas, validadas) {
  const porcentajeComp = total ? ((completadas / total) * 100).toFixed(1) : 0;
  const porcentajeVal = total ? ((validadas / total) * 100).toFixed(1) : 0;

  contenedor.innerHTML = `
    <h3>Resumen de tareas (todas las fechas)</h3>
    <p><strong>Total de tareas:</strong> ${total}</p>
    <p><strong>Tareas completadas(APLICA SOLO PARA EJECUCION):</strong> ${completadas} (${porcentajeComp}%)</p>
    <p><strong>Tareas validadas:</strong> ${validadas} (${porcentajeVal}%)</p>
  `;
}

function filtrarPdvs() {
  const filtro = document.getElementById("buscadorPdv").value.toLowerCase();
  document.querySelectorAll("#listadoPdv li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(filtro) ? "" : "none";
  });
}

