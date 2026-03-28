import { state } from "./state.js";
import { appBase, escapeHtml } from "./utils.js";

export function renderLogin() {
  return `
  <section class="login-screen">
    <div class="login-card">
      <div class="brand-badge">
        <div class="brand-logo">PV</div>
        <div>
          <h1>Punto de Venta PRO TOTAL</h1>
          <p>GitHub + Firebase Spark</p>
        </div>
      </div>
      <div class="form-group">
        <label>Correo</label>
        <input class="input" id="loginEmail" type="email" placeholder="admin@correo.com" />
      </div>
      <div class="form-group">
        <label>Contraseña</label>
        <input class="input" id="loginPassword" type="password" placeholder="********" />
      </div>
      <button class="btn btn-primary btn-block" id="btnLogin">Entrar al sistema</button>
      <div class="alert alert-info mt16">
        Crea tu primer usuario administrador en Firebase Authentication y luego inicia sesión aquí.
      </div>
    </div>
  </section>`;
}

export function renderLayout(content) {
  const user = state.userProfile || {};
  const cfg = state.config || {};
  const logo = buildSidebarLogo(cfg);
  const isAdmin = user.rol === 'admin';
  return `
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="sidebar-logo">${logo}</div>
        <div>
          <div class="sidebar-title">${escapeHtml(cfg.nombreTienda || "Mi Tienda")}</div>
          <div class="sidebar-subtitle">Punto de Venta PRO TOTAL</div>
        </div>
      </div>

      <nav class="nav">
        ${navLink("inicio", "🏠 Inicio")}
        ${navLink("caja", "💵 Caja")}
        ${navLink("ventas", "🛒 Ventas")}
        ${navLink("productos", "📦 Productos")}
        ${navLink("kardex", "📚 Kardex")}
        ${navLink("reportes", "📈 Reportes")}
        ${isAdmin ? navLink("usuarios", "👥 Usuarios") : ''}
        ${isAdmin ? navLink("configuracion", "⚙️ Configuración") : ''}
      </nav>

      <div class="sidebar-footer">
        <div><strong>${escapeHtml(user.nombre || "Usuario")}</strong></div>
        <div>${escapeHtml(user.rol || "")}</div>
        <div class="mt12">Base: ${escapeHtml(appBase)}</div>
        <div class="mt12">
          <button class="btn btn-secondary btn-sm" id="btnLogout">Cerrar sesión</button>
        </div>
      </div>
    </aside>

    <main class="main">
      ${content}
    </main>
  </div>`;
}

function navLink(hash, text) {
  const active = state.currentView === hash ? "active" : "";
  return `<a class="${active}" href="#${hash}">${text}</a>`;
}

function buildSidebarLogo(cfg) {
  if (cfg.logoValue) {
    return `<img src="${escapeHtml(cfg.logoValue)}" alt="Logo">`;
  }
  return `<span>PV</span>`;
}

export function topbar(title, actions = "") {
  const user = state.userProfile || {};
  return `
  <div class="topbar">
    <h2>${escapeHtml(title)}</h2>
    <div class="flex align-center">
      ${actions}
      <div class="userbox">
        <div class="avatar">${escapeHtml((user.nombre || "U").slice(0,1).toUpperCase())}</div>
        <div>
          <div><strong>${escapeHtml(user.nombre || "")}</strong></div>
          <div class="sidebar-subtitle">${escapeHtml(user.rol || "")}</div>
        </div>
      </div>
    </div>
  </div>`;
}

export function modalShell(content) {
  return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal">${content}</div></div>`;
}


// BOTONES PRO
function agregarBotonesPro() {
    const cont = document.body;

    const btn1 = document.createElement("button");
    btn1.innerText = "📊 Exportar Productos";
    btn1.onclick = exportarProductosExcel;

    const btn2 = document.createElement("button");
    btn2.innerText = "🧹 Limpiar Ventas";
    btn2.onclick = limpiarVentasAntiguas;

    cont.appendChild(btn1);
    cont.appendChild(btn2);
}

window.addEventListener("load", agregarBotonesPro);
