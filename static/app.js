const API = "/paradas";
const $ = id => document.getElementById(id);

const TITULOS = {
  inicio: "",
  dashboard: "DASHBOARD",
  mapa: "MAPA DE PARADAS",
  paradas: "GESTIÓN DE PARADAS",
  form: "FORMULARIO DE PARADA",
  detalle: "DETALLE DE PARADA"
};

let actual = "inicio";
let pila = [];                  // historial del botón Regresar
let paradas = [];
let paradaActual = null;

// ---------- Utilidades ----------
function esc(t) {
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}
let tmp;
function toast(texto, tipo = "exito") {
  const t = $("toast");
  t.textContent = texto;
  t.className = `toast ${tipo}`;
  clearTimeout(tmp);
  tmp = setTimeout(() => t.classList.add("hidden"), 2600);
}
const msgError = (d, def) => (d && typeof d.detail === "string" ? d.detail : def);

// ---------- Mapas (Leaflet) ----------
const OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAPAS = {};
function obtenerMapa(id) {
  if (!MAPAS[id]) {
    const m = L.map(id).setView([19.0414, -98.2063], 12);
    L.tileLayer(OSM, { maxZoom: 19, attribution: ATTR }).addTo(m);
    MAPAS[id] = { m, capa: L.layerGroup().addTo(m), marcas: {} };
  }
  return MAPAS[id];
}
function pintarMarcadores(id, lista) {
  const o = obtenerMapa(id);
  o.capa.clearLayers();
  o.marcas = {};
  lista.forEach(p => {
    const mk = L.circleMarker([p.latitud, p.longitud], {
      radius: 10, weight: 2, color: "#fff", fillOpacity: .95,
      fillColor: p.activa ? "#0b2a5b" : "#e0566b"
    }).addTo(o.capa);
    mk.bindTooltip(p.nombre);
    mk.bindPopup(`<b>${esc(p.nombre)}</b><br>${esc(p.colonia)}<br>${esc(p.rutas.join(", ") || "Sin rutas")}`);
    mk.on("dblclick", () => abrirDetalle(p.id));
    o.marcas[p.id] = mk;
  });
}

// ---------- Navegación entre vistas ----------
function dibujar() {
  const enInicio = actual === "inicio";
  $("v-inicio").classList.toggle("hidden", !enInicio);
  $("shell").classList.toggle("hidden", enInicio);
  if (enInicio) return;

  document.querySelectorAll(".vista").forEach(v => v.classList.add("hidden"));
  $(`v-${actual}`).classList.remove("hidden");
  $("titulo").textContent = TITULOS[actual];

  const nav = actual === "form" ? "crear" : actual === "detalle" ? "paradas" : actual;
  document.querySelectorAll(".menu button").forEach(b =>
    b.classList.toggle("activo", b.dataset.nav === nav));
  document.querySelector(".contenido").scrollTop = 0;

  setTimeout(() => {
    Object.values(MAPAS).forEach(o => o.m.invalidateSize());
  }, 120);
}
function ir(v) { pila.push(actual); actual = v; dibujar(); }
function irRaiz(v) { pila = [v === "dashboard" ? "inicio" : "dashboard"]; actual = v; dibujar(); }
function regresar() {
  actual = pila.length ? pila.pop() : "inicio";
  dibujar();
  if (actual !== "inicio" && actual !== "form" && actual !== "detalle") cargarParadas(false);
}

// ---------- Datos (GET /paradas) ----------
async function cargarParadas(avisar = true) {
  try {
    const r = await fetch(API);
    if (!r.ok) throw new Error("No se pudo obtener la lista");
    paradas = (await r.json()).paradas;
    pintarTodo();
    if (avisar) toast("Paradas cargadas correctamente");
  } catch (e) { toast(e.message, "error"); }
}

function texto(p) { return `${p.nombre} ${p.colonia} ${p.rutas.join(" ")}`.toLowerCase(); }
function filtradas(estado = "") {
  const q = $("buscador").value.trim().toLowerCase();
  return paradas.filter(p =>
    texto(p).includes(q) && (estado === "" || String(p.activa) === estado));
}
const etiqueta = p => `<span class="etq ${p.activa ? "on" : "off"}">${p.activa ? "Activa" : "Inactiva"}</span>`;
const rutasTxt = p => (p.rutas.length ? esc(p.rutas.join(", ")) : "Sin rutas");

function pintarTodo() {
  pintarKpis();
  pintarTablas();
  pintarBarras();
  pintarMapas();
}

function pintarKpis() {
  const act = paradas.filter(p => p.activa).length;
  $("k-total").textContent = paradas.length;
  $("k-activas").textContent = act;
  $("k-inactivas").textContent = paradas.length - act;
  $("k-rutas").textContent = new Set(paradas.flatMap(p => p.rutas)).size;
}

function pintarTablas() {
  const vacio = n => `<tr><td colspan="${n}" class="vacio">No hay paradas para mostrar.</td></tr>`;

  const rec = [...filtradas()]
    .sort((a, b) => (b.creado_en || "").localeCompare(a.creado_en || ""))
    .slice(0, 6);
  $("tb-recientes").innerHTML = rec.length ? rec.map(p => `
    <tr><td>${esc(p.id)}</td><td>${esc(p.nombre)}</td><td>${esc(p.colonia)}</td>
    <td>${rutasTxt(p)}</td><td>${etiqueta(p)}</td></tr>`).join("") : vacio(5);

  const f = filtradas($("f-estado").value);
  $("tb-paradas").innerHTML = f.length ? f.map(p => `
    <tr><td>${esc(p.id)}</td><td>${esc(p.nombre)}</td><td>${esc(p.colonia)}</td>
    <td>${rutasTxt(p)}</td><td>${etiqueta(p)}</td>
    <td><div class="acc">
      <button class="mini ver" data-accion="ver" data-id="${esc(p.id)}" type="button">Ver</button>
      <button class="mini edit" data-accion="editar" data-id="${esc(p.id)}" type="button">Editar</button>
      <button class="mini del" data-accion="eliminar" data-id="${esc(p.id)}" type="button">Eliminar</button>
    </div></td></tr>`).join("") : vacio(6);
}

function conteoRutas() {
  const c = {};
  paradas.forEach(p => p.rutas.forEach(r => c[r] = (c[r] || 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
}
function barrasHTML() {
  const datos = conteoRutas();
  if (!datos.length) return '<p class="vacio">Sin datos de rutas.</p>';
  const max = datos[0][1];
  return datos.map(([r, n]) => `
    <div class="barra"><span>${esc(r)}</span><div><i style="width:${n * 100 / max}%"></i></div><b>${n}</b></div>`).join("");
}
function pintarBarras() { $("barras-dash").innerHTML = barrasHTML(); }

function pintarMapas() {
  pintarMarcadores("mapa-general", paradas);
  pintarMapaGrande();
}
function pintarMapaGrande() {
  const f = filtradas($("m-estado").value);
  pintarMarcadores("mapa-grande", f);
  $("lista-mapa").innerHTML = f.length ? f.map(p => `
    <li class="item" data-id="${esc(p.id)}"><span><strong>${esc(p.nombre)}</strong>
    <small>${esc(p.colonia)}</small></span><span style="margin-left:auto">${etiqueta(p)}</span></li>`).join("")
    : '<li class="vacio">Sin resultados.</li>';
}

// ---------- Detalle (GET /paradas/{id}) ----------
async function abrirDetalle(id) {
  try {
    const r = await fetch(`${API}/${id}`);
    const p = await r.json();
    if (!r.ok) throw new Error(msgError(p, "No se encontró la parada"));
    paradaActual = p;
    $("d-nombre").textContent = p.nombre;
    $("d-id").textContent = p.id;
    $("d-colonia").textContent = p.colonia;
    $("d-municipio").textContent = p.municipio;
    $("d-coords").textContent = `${p.latitud}, ${p.longitud}`;
    $("d-rutas").textContent = p.rutas.length ? p.rutas.join(", ") : "Sin rutas";
    $("d-estado").textContent = p.activa ? "Activa" : "Inactiva";
    $("d-estado").className = p.activa ? "est-on" : "est-off";
    ir("detalle");
    const o = obtenerMapa("mapa-detalle");
    o.capa.clearLayers();
    L.marker([p.latitud, p.longitud]).addTo(o.capa)
      .bindPopup(`<b>${esc(p.nombre)}</b><br>${esc(p.colonia)}`).openPopup();
    o.m.setView([p.latitud, p.longitud], 16);
    setTimeout(() => o.m.invalidateSize(), 150);
    toast("Datos de parada obtenidos");
  } catch (e) { toast(e.message, "error"); }
}

// ---------- Formulario (POST / PUT) ----------
function abrirFormulario(p = null) {
  $("form-parada").reset();
  $("parada-id").value = p ? p.id : "";
  if (p) {
    $("nombre").value = p.nombre;
    $("colonia").value = p.colonia;
    $("latitud").value = p.latitud;
    $("longitud").value = p.longitud;
    $("rutas").value = p.rutas.join(", ");
    $("activa").value = String(p.activa);
  }
  $("form-txt").textContent = p ? "Actualizar parada" : "Crear parada";
  $("form-sub").textContent = p ? "PUT /paradas/{parada_id}" : "POST /paradas";
  $("btn-guardar").textContent = p ? "Actualizar" : "Crear parada";
  ir("form");
}

$("form-parada").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("parada-id").value;
  const datos = {
    nombre: $("nombre").value.trim(),
    colonia: $("colonia").value.trim(),
    municipio: "Puebla",
    latitud: parseFloat($("latitud").value),
    longitud: parseFloat($("longitud").value),
    rutas: $("rutas").value.split(",").map(r => r.trim()).filter(Boolean),
    activa: $("activa").value === "true"
  };
  try {
    const r = await fetch(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const resp = await r.json();
    if (!r.ok) throw new Error(msgError(resp, "Revisa los datos del formulario"));
    irRaiz("paradas");
    await cargarParadas(false);
    toast(id ? "Parada actualizada correctamente" : "Parada creada con éxito");
  } catch (err) { toast(err.message, "error"); }
});

// ---------- Eliminar (DELETE /paradas/{id}) ----------
async function eliminarParada() {
  $("modal").classList.add("hidden");
  try {
    const r = await fetch(`${API}/${paradaActual.id}`, { method: "DELETE" });
    const resp = await r.json();
    if (!r.ok) throw new Error(msgError(resp, "No se pudo eliminar"));
    irRaiz("paradas");
    await cargarParadas(false);
    toast("Parada eliminada");
  } catch (err) { toast(err.message, "error"); }
}

// ---------- Redis (PING) ----------
async function probarRedis() {
  try {
    const d = await (await fetch("/estado")).json();
    const ok = d.redis_conectado === true;
    $("punto").className = ok ? "ok" : "mal";
    $("txt-redis").textContent = ok ? "Redis Cloud conectado" : "Sin conexión";
  } catch {
    $("punto").className = "mal";
    $("txt-redis").textContent = "Sin conexión";
  }
}

// ---------- Eventos ----------
$("btn-comenzar").addEventListener("click", () => {
  pila = ["inicio"]; actual = "dashboard"; dibujar();
  probarRedis(); cargarParadas(false);
});
$("btn-atras").addEventListener("click", regresar);
$("btn-nueva").addEventListener("click", () => abrirFormulario());
$("btn-cancelar").addEventListener("click", regresar);
$("btn-editar").addEventListener("click", () => abrirFormulario(paradaActual));
$("btn-eliminar").addEventListener("click", () => $("modal").classList.remove("hidden"));
$("btn-cancelar-del").addEventListener("click", () => $("modal").classList.add("hidden"));
$("btn-confirmar-del").addEventListener("click", eliminarParada);
$("f-estado").addEventListener("change", pintarTablas);
$("m-estado").addEventListener("change", pintarMapaGrande);

$("buscador").addEventListener("input", () => {
  if (actual !== "paradas" && actual !== "mapa") irRaiz("paradas");
  pintarTablas();
  pintarMapaGrande();
});

document.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => {
  const v = b.dataset.nav;
  if (v === "inicio") { pila = []; actual = "inicio"; dibujar(); }
  else if (v === "crear") { pila = ["dashboard"]; actual = "dashboard"; abrirFormulario(); }
  else { irRaiz(v); cargarParadas(false); }
}));

// Acciones de la tabla (Ver, Editar, Eliminar)
$("tb-paradas").addEventListener("click", e => {
  const b = e.target.closest("button[data-accion]");
  if (!b) return;
  const p = paradas.find(x => x.id === b.dataset.id);
  if (!p) return;
  paradaActual = p;
  if (b.dataset.accion === "ver") abrirDetalle(p.id);
  if (b.dataset.accion === "editar") abrirFormulario(p);
  if (b.dataset.accion === "eliminar") $("modal").classList.remove("hidden");
});

// Filas del dashboard y lista del mapa
$("tb-recientes").addEventListener("click", e => {
  const fila = e.target.closest("tr");
  const id = fila && fila.firstElementChild.textContent;
  if (id && paradas.some(p => p.id === id)) abrirDetalle(id);
});
$("lista-mapa").addEventListener("click", e => {
  const item = e.target.closest(".item");
  if (!item) return;
  const o = MAPAS["mapa-grande"];
  const p = paradas.find(x => x.id === item.dataset.id);
  if (!p) return;
  o.m.setView([p.latitud, p.longitud], 16);
  o.marcas[p.id].openPopup();
});
$("lista-mapa").addEventListener("dblclick", e => {
  const item = e.target.closest(".item");
  if (item) abrirDetalle(item.dataset.id);
});

dibujar();