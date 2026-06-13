/* ═══════════════════════════════════════════════
   CLOSET SALE — app.js
   Catálogo público: filtros, carrito, WhatsApp
═══════════════════════════════════════════════ */

// Número de WhatsApp inyectado desde Flask en el template
const WA_NUMBER = window.WA_NUMBER || "521XXXXXXXXXX";

// ── Estado ────────────────────────────────────
let productos = [];
let carrito   = [];          // array de ids
let filtros   = { cat: "todos", estado: "todos", busqueda: "" };

// ── Inicialización ────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await cargarProductos();
  renderCatalogo();
  bindFiltros();
  bindFormulario();
});

async function cargarProductos() {
  try {
    const res = await fetch("/api/productos");
    productos = await res.json();
  } catch {
    productos = [];
  }
  actualizarContador();
}

// ── Contador ──────────────────────────────────
function actualizarContador() {
  const disp = productos.filter(p => p.estado === "disponible").length;
  const el = document.getElementById("contador-disp");
  if (el) el.textContent = disp;
}

// ── Filtros ───────────────────────────────────
function bindFiltros() {
  // Chips de categoría
  document.querySelectorAll(".chip-cat").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-cat").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      filtros.cat = chip.dataset.cat;
      renderCatalogo();
    });
  });

  // Chips de estado
  document.querySelectorAll(".chip-estado").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-estado").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      filtros.estado = chip.dataset.estado;
      renderCatalogo();
    });
  });

  // Buscador
  const input = document.getElementById("buscador");
  if (input) {
    input.addEventListener("input", () => {
      filtros.busqueda = input.value.trim().toLowerCase();
      renderCatalogo();
    });
  }
}

function productosFiltrados() {
  return productos.filter(p => {
    const matchCat    = filtros.cat === "todos" || p.categoria === filtros.cat;
    const matchEstado = filtros.estado === "todos" || p.estado === filtros.estado;
    const matchBusq   = !filtros.busqueda ||
      p.nombre.toLowerCase().includes(filtros.busqueda) ||
      (p.marca && p.marca.toLowerCase().includes(filtros.busqueda));
    return matchCat && matchEstado && matchBusq;
  });
}

// ── Render catálogo ───────────────────────────
const EMOJIS = { pantalon: "👖", sudadera: "🧥", perfume: "🫙" };

function renderCatalogo() {
  const grid = document.getElementById("grid-productos");
  const noRes = document.getElementById("no-results");
  const lista = productosFiltrados();

  if (!lista.length) {
    grid.innerHTML = "";
    if (noRes) noRes.style.display = "block";
    return;
  }
  if (noRes) noRes.style.display = "none";

  grid.innerHTML = lista.map(p => tarjetaHTML(p)).join("");

  // Bind botones
  grid.querySelectorAll(".btn-agregar").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      toggleCarrito(id);
    });
  });
}

function tarjetaHTML(p) {
  const enCarrito  = carrito.includes(p.id);
  const vendida    = p.estado === "vendido";
  const apartada   = p.estado === "apartado";
  const emoji      = EMOJIS[p.categoria] || "📦";

  const imgHTML = p.foto
    ? `<img src="/static/uploads/${p.foto}" alt="${p.nombre}" loading="lazy" />`
    : `<span class="card-emoji">${emoji}</span>`;

  const overlayVendida = vendida
    ? `<div class="overlay-vendido"><span>VENDIDO</span></div>` : "";

  const badgeEstado = `<span class="badge-estado badge-${p.estado}">${estadoLabel(p.estado)}</span>`;
  const badgeMarca  = p.marca
    ? `<span class="badge-marca">${p.marca}</span>` : "";

  const talla = p.talla ? `<div class="card-talla">Talla ${p.talla}</div>` : "";

  const btnLabel = vendida    ? "No disponible"
                 : apartada   ? "Apartado"
                 : enCarrito  ? "✓ Quitar"
                               : "+ Agregar al pedido";
  const btnClass = enCarrito ? "btn-agregar quitar" : "btn-agregar";
  const btnDisabled = (vendida || apartada) ? "disabled" : "";

  return `
    <div class="card${vendida ? " vendida" : ""}${enCarrito ? " seleccionada" : ""}">
      <div class="card-img-wrap">
        ${imgHTML}
        ${overlayVendida}
        ${badgeEstado}
        ${badgeMarca}
      </div>
      <div class="card-body">
        <div class="card-name">${p.nombre}</div>
        ${p.descripcion ? `<div class="card-meta">${p.descripcion}</div>` : ""}
        <div class="card-footer">
          <div class="card-price">$${p.precio}</div>
          ${talla}
        </div>
        <button class="${btnClass}" data-id="${p.id}" ${btnDisabled}>${btnLabel}</button>
      </div>
    </div>`;
}

function estadoLabel(e) {
  return { disponible: "Disponible", apartado: "Apartado", vendido: "Vendido" }[e] || e;
}

// ── Carrito ───────────────────────────────────
function toggleCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto || producto.estado === "vendido" || producto.estado === "apartado") return;

  if (carrito.includes(id)) {
    carrito = carrito.filter(i => i !== id);
  } else {
    carrito.push(id);
  }
  renderCatalogo();
  renderCarrito();
}

function renderCarrito() {
  const lista  = document.getElementById("lista-carrito");
  const totalEl = document.getElementById("total-carrito");
  const totalWrap = document.getElementById("total-wrap");
  const btnEnviar = document.getElementById("btn-enviar");

  if (!carrito.length) {
    lista.innerHTML = `<li class="carrito-empty">Sin productos seleccionados</li>`;
    if (totalWrap)  totalWrap.style.display = "none";
    if (btnEnviar)  btnEnviar.disabled = true;
    return;
  }

  const items = carrito.map(id => productos.find(p => p.id === id)).filter(Boolean);
  const total = items.reduce((s, p) => s + p.precio, 0);

  lista.innerHTML = items.map(p => `
    <li class="carrito-item">
      <div class="ci-info">
        <div class="ci-nombre">${p.nombre}</div>
        <div class="ci-precio">$${p.precio}</div>
      </div>
      <button class="ci-quitar" data-id="${p.id}" title="Quitar">✕</button>
    </li>
  `).join("");

  lista.querySelectorAll(".ci-quitar").forEach(btn => {
    btn.addEventListener("click", () => {
      carrito = carrito.filter(i => i !== parseInt(btn.dataset.id));
      renderCarrito();
      renderCatalogo();
    });
  });

  if (totalWrap)  { totalWrap.style.display = "flex"; }
  if (totalEl)    totalEl.textContent = `$${total}`;
  if (btnEnviar)  btnEnviar.disabled = false;
}

// ── Formulario + WhatsApp ─────────────────────
function bindFormulario() {
  const form     = document.getElementById("form-pedido");
  const inputTel = document.getElementById("inp-telefono");

  // Solo números en teléfono
  if (inputTel) {
    inputTel.addEventListener("input", () => {
      inputTel.value = inputTel.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (validarFormulario()) enviarWhatsApp();
    });
  }
}

function validarFormulario() {
  let ok = true;

  const nombre = document.getElementById("inp-nombre");
  const errNombre = document.getElementById("err-nombre");
  if (!nombre.value.trim()) {
    nombre.classList.add("error");
    errNombre.classList.add("visible");
    ok = false;
  } else {
    nombre.classList.remove("error");
    errNombre.classList.remove("visible");
  }

  const tel = document.getElementById("inp-telefono");
  const errTel = document.getElementById("err-tel");
  if (!/^\d{10}$/.test(tel.value)) {
    tel.classList.add("error");
    errTel.classList.add("visible");
    ok = false;
  } else {
    tel.classList.remove("error");
    errTel.classList.remove("visible");
  }

  if (!carrito.length) {
    alert("Agrega al menos un producto al pedido.");
    ok = false;
  }

  return ok;
}

function enviarWhatsApp() {
  const nombre   = document.getElementById("inp-nombre").value.trim();
  const tel      = document.getElementById("inp-telefono").value.trim();
  const entrega  = document.getElementById("inp-entrega").value;
  const comentario = document.getElementById("inp-comentarios").value.trim();

  const items = carrito.map(id => productos.find(p => p.id === id)).filter(Boolean);
  const total = items.reduce((s, p) => s + p.precio, 0);

  const listaTexto = items.map(p => `  • ${p.nombre} — $${p.precio}`).join("\n");

  let msg = `¡Hola! Me interesa hacer un pedido 🛍️\n\n`;
  msg += `👤 Nombre: ${nombre}\n`;
  msg += `📱 Teléfono: ${tel}\n\n`;
  msg += `📦 Productos solicitados:\n${listaTexto}\n\n`;
  msg += `💰 Total: $${total}\n`;
  msg += `📍 Punto de entrega: ${entrega}\n`;
  if (comentario) msg += `💬 Comentarios: ${comentario}\n`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
