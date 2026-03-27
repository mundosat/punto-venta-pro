import { state } from "./state.js";
import { currency, formatDateTime, formatDate, escapeHtml } from "./utils.js";
import { topbar } from "./ui.js";

export function renderInicio({ sales = [], products = [], cashSession = null }) {
  const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const lowStock = products.filter(p => Number(p.stock || 0) <= Number(p.minimo || 0)).length;
  const totalProductos = products.length;
  const lastSalesRows = sales.slice(0, 8).map(s => `
    <tr>
      <td>#${String(s.numero || 0).padStart(6, "0")}</td>
      <td>${escapeHtml(s.cliente || "Consumidor Final")}</td>
      <td>${formatDateTime(s.fecha)}</td>
      <td>${escapeHtml(s.usuarioNombre || "")}</td>
      <td class="right">${currency(s.total, state.config.moneda)}</td>
    </tr>`).join("");

  return `
    ${topbar("Panel principal")}
    <div class="grid grid-4">
      <div class="stat"><div class="label">Ventas registradas</div><div class="value">${sales.length}</div><div class="hint">Historial cargado</div></div>
      <div class="stat"><div class="label">Ingresos acumulados</div><div class="value">${currency(totalVentas, state.config.moneda)}</div><div class="hint">Total en ventas</div></div>
      <div class="stat"><div class="label">Productos</div><div class="value">${totalProductos}</div><div class="hint">Inventario</div></div>
      <div class="stat"><div class="label">Stock bajo</div><div class="value">${lowStock}</div><div class="hint">Revisar reposición</div></div>
    </div>

    <div class="grid grid-2 mt16">
      <section class="card">
        <div class="flex justify-between align-center">
          <h3 class="m0">Estado de caja</h3>
          ${cashSession ? '<span class="badge badge-ok">Caja abierta</span>' : '<span class="badge badge-warn">Caja cerrada</span>'}
        </div>
        <div class="mt12">
          ${cashSession ? `
            <p><strong>Apertura:</strong> ${formatDateTime(cashSession.fechaApertura)}</p>
            <p><strong>Monto inicial:</strong> ${currency(cashSession.montoInicial, state.config.moneda)}</p>
            <p><strong>Cajero:</strong> ${escapeHtml(cashSession.usuarioNombre || "")}</p>
          ` : `<div class="alert alert-info">No hay una caja abierta en este momento.</div>`}
        </div>
      </section>

      <section class="card">
        <h3 class="m0">Accesos rápidos</h3>
        <div class="toolbar mt16">
          <a class="btn btn-primary" href="#ventas">Nueva venta</a>
          <a class="btn btn-secondary" href="#productos">Productos</a>
          <a class="btn btn-secondary" href="#caja">Caja</a>
          <a class="btn btn-secondary" href="#configuracion">Configuración</a>
        </div>
      </section>
    </div>

    <section class="card mt16">
      <h3 class="m0">Últimas ventas</h3>
      <div class="table-wrap mt12">
        <table class="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>${lastSalesRows || '<tr><td colspan="5" class="center">Sin ventas todavía</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderCaja({ session = null, movements = [], sales = [] }) {
  const ingresos = movements.filter(m => m.tipo === "ingreso").reduce((a, m) => a + Number(m.monto || 0), 0);
  const egresos = movements.filter(m => m.tipo === "egreso").reduce((a, m) => a + Number(m.monto || 0), 0);
  const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const montoFinal = (Number(session?.montoInicial || 0) + ingresos + totalVentas - egresos);

  const rows = movements.map(m => `
    <tr>
      <td>${formatDateTime(m.fecha)}</td>
      <td>${escapeHtml(m.tipo)}</td>
      <td>${escapeHtml(m.concepto || "")}</td>
      <td>${escapeHtml(m.usuarioNombre || "")}</td>
      <td class="right">${currency(m.monto, state.config.moneda)}</td>
    </tr>
  `).join("");

  return `
    ${topbar("Caja", `
      ${session ? `<button class="btn btn-danger" id="btnCerrarCaja">Cerrar caja</button>` : `<button class="btn btn-primary" id="btnAbrirCaja">Abrir caja</button>`}
    `)}

    <div class="grid grid-4">
      <div class="stat"><div class="label">Estado</div><div class="value">${session ? "ABIERTA" : "CERRADA"}</div><div class="hint">${session ? "Operativa" : "Sin sesión activa"}</div></div>
      <div class="stat"><div class="label">Monto inicial</div><div class="value">${currency(session?.montoInicial || 0, state.config.moneda)}</div><div class="hint">Apertura</div></div>
      <div class="stat"><div class="label">Ventas</div><div class="value">${currency(totalVentas, state.config.moneda)}</div><div class="hint">Sesión actual</div></div>
      <div class="stat"><div class="label">Disponible</div><div class="value">${currency(montoFinal, state.config.moneda)}</div><div class="hint">Estimado</div></div>
    </div>

    <div class="grid grid-2 mt16">
      <section class="card">
        <h3 class="m0">Movimiento manual</h3>
        ${session ? `
        <div class="grid grid-2 mt16">
          <div class="form-group">
            <label>Tipo</label>
            <select class="select" id="movTipo">
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div class="form-group">
            <label>Monto</label>
            <input class="input" id="movMonto" type="number" step="0.01" value="0" />
          </div>
        </div>
        <div class="form-group">
          <label>Concepto</label>
          <input class="input" id="movConcepto" placeholder="Ejemplo: pago de transporte" />
        </div>
        <button class="btn btn-primary" id="btnGuardarMovimiento">Guardar movimiento</button>
        ` : `<div class="alert alert-info mt12">Abre una caja para registrar movimientos.</div>`}
      </section>

      <section class="card">
        <h3 class="m0">Resumen</h3>
        <div class="totals mt16">
          <p><strong>Ingresos manuales:</strong> <span style="float:right">${currency(ingresos, state.config.moneda)}</span></p>
          <p><strong>Egresos manuales:</strong> <span style="float:right">${currency(egresos, state.config.moneda)}</span></p>
          <p><strong>Total ventas:</strong> <span style="float:right">${currency(totalVentas, state.config.moneda)}</span></p>
          <div class="total-big">Disponible ${currency(montoFinal, state.config.moneda)}</div>
        </div>
      </section>
    </div>

    <section class="card mt16">
      <h3 class="m0">Movimientos</h3>
      <div class="table-wrap mt12">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Usuario</th>
              <th class="right">Monto</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5" class="center">Sin movimientos</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderVentas({ products = [], cart = [] }) {
  const cards = products
    .filter(p => p.activo !== false)
    .map(p => `
      <button class="product-card" data-add-product="${p.id}">
        <div class="product-name">${escapeHtml(p.nombre)}</div>
        <div class="product-meta">Código: ${escapeHtml(p.codigo || "-")}</div>
        <div class="product-meta">Stock: ${Number(p.stock || 0)}</div>
        <div class="mt12"><strong>${currency(p.precio, state.config.moneda)}</strong></div>
      </button>
    `).join("");

  const subtotal = cart.reduce((a, i) => a + Number(i.total || 0), 0);
  const impuesto = subtotal * (Number(state.config.impuesto || 0) / 100);
  const total = subtotal + impuesto;

  const cartRows = cart.map(item => `
    <div class="cart-item">
      <div>
        <div><strong>${escapeHtml(item.nombre)}</strong></div>
        <div class="product-meta">${escapeHtml(item.codigo || "-")}</div>
      </div>
      <div class="qty-box">
        <button class="qty-btn" data-cart-dec="${item.id}">-</button>
        <span>${item.cantidad}</span>
        <button class="qty-btn" data-cart-inc="${item.id}">+</button>
      </div>
      <div class="right">${currency(item.precio, state.config.moneda)}</div>
      <div class="flex">
        <div class="right">${currency(item.total, state.config.moneda)}</div>
        <button class="btn btn-danger btn-sm" data-cart-remove="${item.id}">x</button>
      </div>
    </div>
  `).join("");

  return `
    ${topbar("Ventas", `
      <button class="btn btn-secondary" id="btnLimpiarCarrito">Vaciar carrito</button>
    `)}

    <div class="pos-layout">
      <section class="card">
        <div class="grid grid-2">
          <div class="form-group">
            <label>Buscar producto</label>
            <input class="input" id="buscarProducto" placeholder="Nombre o código" />
          </div>
          <div class="form-group">
            <label>Cliente</label>
            <input class="input" id="clienteVenta" placeholder="Consumidor Final" />
          </div>
        </div>

        <div class="product-grid mt16" id="productGrid">
          ${cards || '<div class="alert alert-info">No hay productos todavía.</div>'}
        </div>
      </section>

      <section class="card">
        <h3 class="m0">Carrito</h3>
        <div class="cart-list mt16">
          ${cartRows || '<div class="alert alert-info">Agrega productos para vender.</div>'}
        </div>

        <div class="totals mt16">
          <p><strong>Subtotal</strong><span style="float:right">${currency(subtotal, state.config.moneda)}</span></p>
          <p><strong>Impuesto (${Number(state.config.impuesto || 0)}%)</strong><span style="float:right">${currency(impuesto, state.config.moneda)}</span></p>
          <div class="total-big">TOTAL ${currency(total, state.config.moneda)}</div>

          <div class="grid grid-2 mt16">
            <div class="form-group">
              <label>Pagó con</label>
              <input class="input money-input" id="pagadoCon" type="number" step="0.01" value="${total.toFixed(2)}" />
            </div>
            <div class="form-group">
              <label>Cambio</label>
              <input class="input money-input" id="cambioVenta" value="${(0).toFixed(2)}" readonly />
            </div>
          </div>

          <div class="toolbar mt16">
            <button class="btn btn-primary" id="btnCobrarImprimir">Cobrar e imprimir</button>
            <button class="btn btn-secondary" id="btnCobrarSinImprimir">Cobrar sin imprimir</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderProductos({ products = [] }) {
  const rows = products.map(p => `
    <tr>
      <td>${escapeHtml(p.codigo || "")}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria || "")}</td>
      <td class="right">${currency(p.precio, state.config.moneda)}</td>
      <td class="right">${Number(p.stock || 0)}</td>
      <td class="right">${Number(p.minimo || 0)}</td>
      <td>${p.activo !== false ? '<span class="badge badge-ok">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
      <td class="right">
        <button class="btn btn-secondary btn-sm" data-edit-product="${p.id}">Editar</button>
        <button class="btn btn-warning btn-sm" data-adjust-stock="${p.id}">Ajustar stock</button>
      </td>
    </tr>
  `).join("");

  return `
    ${topbar("Productos", `
      <button class="btn btn-secondary" id="btnImportarProductos">Importar CSV</button>
      <button class="btn btn-primary" id="btnNuevoProducto">Nuevo producto</button>
    `)}
    <section class="card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>Buscar</label>
          <input class="input" id="buscarProductoTabla" placeholder="Código o nombre" />
        </div>
        <div class="alert alert-info">Puedes importar productos desde un archivo CSV simple.</div>
      </div>
      <div class="table-wrap mt16">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th class="right">Precio</th>
              <th class="right">Stock</th>
              <th class="right">Mínimo</th>
              <th>Estado</th>
              <th class="right">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8" class="center">No hay productos</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderKardex({ items = [] }) {
  const rows = items.map(k => `
    <tr>
      <td>${formatDateTime(k.fecha)}</td>
      <td>${escapeHtml(k.codigo || "")}</td>
      <td>${escapeHtml(k.nombre || "")}</td>
      <td>${escapeHtml(k.tipo || "")}</td>
      <td class="right">${Number(k.cantidad || 0)}</td>
      <td class="right">${Number(k.stockAnterior || 0)}</td>
      <td class="right">${Number(k.stockNuevo || 0)}</td>
      <td>${escapeHtml(k.referencia || "")}</td>
      <td>${escapeHtml(k.usuarioNombre || "")}</td>
    </tr>
  `).join("");

  return `
    ${topbar("Kardex")}
    <section class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th class="right">Cantidad</th>
              <th class="right">Antes</th>
              <th class="right">Después</th>
              <th>Referencia</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9" class="center">Sin movimientos</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderUsuarios({ users = [] }) {
  const rows = users.map(u => `
    <tr>
      <td>${escapeHtml(u.nombre || "")}</td>
      <td>${escapeHtml(u.email || "")}</td>
      <td>${escapeHtml(u.rol || "")}</td>
      <td>${u.activo !== false ? '<span class="badge badge-ok">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
      <td class="right"><button class="btn btn-secondary btn-sm" data-edit-user="${u.id}">Editar</button></td>
    </tr>
  `).join("");

  return `
    ${topbar("Usuarios", `<button class="btn btn-primary" id="btnNuevoUsuario">Nuevo / vincular usuario</button>`)}
    <section class="card">
      <div class="alert alert-info">
        Los usuarios deben existir primero en Firebase Authentication. Aquí vinculas el UID con nombre, correo y rol.
      </div>
      <div class="table-wrap mt16">
        <table class="table">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th class="right">Acción</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="center">No hay usuarios</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderReportes({ sales = [], products = [] }) {
  const hoy = new Date().toLocaleDateString("es-EC");
  const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const totalUnidades = sales.reduce((acc, s) => acc + (s.items || []).reduce((a, i) => a + Number(i.cantidad || 0), 0), 0);
  const lowStock = products.filter(p => Number(p.stock || 0) <= Number(p.minimo || 0));

  const rows = sales.map(s => `
    <tr>
      <td>#${String(s.numero || 0).padStart(6, "0")}</td>
      <td>${formatDateTime(s.fecha)}</td>
      <td>${escapeHtml(s.cliente || "Consumidor Final")}</td>
      <td>${escapeHtml(s.usuarioNombre || "")}</td>
      <td class="right">${currency(s.total, state.config.moneda)}</td>
    </tr>
  `).join("");

  const lowRows = lowStock.map(p => `
    <tr>
      <td>${escapeHtml(p.codigo || "")}</td>
      <td>${escapeHtml(p.nombre || "")}</td>
      <td>${escapeHtml(p.categoria || "")}</td>
      <td class="right">${Number(p.stock || 0)}</td>
      <td class="right">${Number(p.minimo || 0)}</td>
    </tr>
  `).join("");

  return `
    ${topbar("Reportes", `
      <button class="btn btn-secondary" id="btnExportVentasCSV">Exportar ventas CSV</button>
      <button class="btn btn-secondary" id="btnExportProductosCSV">Exportar productos CSV</button>
    `)}

    <div class="grid grid-3">
      <div class="stat"><div class="label">Fecha</div><div class="value">${escapeHtml(hoy)}</div><div class="hint">Resumen actual</div></div>
      <div class="stat"><div class="label">Total vendido</div><div class="value">${currency(totalVentas, state.config.moneda)}</div><div class="hint">Historial visible</div></div>
      <div class="stat"><div class="label">Unidades vendidas</div><div class="value">${totalUnidades}</div><div class="hint">Suma de cantidades</div></div>
    </div>

    <section class="card mt16">
      <h3 class="m0">Ventas</h3>
      <div class="table-wrap mt12">
        <table class="table">
          <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Usuario</th><th class="right">Total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="center">Sin ventas</td></tr>'}</tbody>
        </table>
      </div>
    </section>

    <section class="card mt16">
      <h3 class="m0">Productos con stock bajo</h3>
      <div class="table-wrap mt12">
        <table class="table">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th class="right">Stock</th><th class="right">Mínimo</th></tr></thead>
          <tbody>${lowRows || '<tr><td colspan="5" class="center">Todo bien por ahora</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderConfiguracion() {
  const c = state.config;
  const logoPreview = c.logoValue ? `<img src="${escapeHtml(c.logoValue)}" alt="Logo"/>` : '<span class="sidebar-subtitle">Sin logo</span>';

  return `
    ${topbar("Configuración de tienda")}
    <section class="card">
      <div class="grid grid-2">
        <div>
          <div class="form-group">
            <label>Nombre de tienda</label>
            <input class="input" id="cfgNombreTienda" value="${escapeHtml(c.nombreTienda || "")}" />
          </div>
          <div class="form-group">
            <label>RUC / Identificación</label>
            <input class="input" id="cfgRuc" value="${escapeHtml(c.ruc || "")}" />
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input class="input" id="cfgTelefono" value="${escapeHtml(c.telefono || "")}" />
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <textarea class="textarea" id="cfgDireccion">${escapeHtml(c.direccion || "")}</textarea>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label>Moneda</label>
              <input class="input" id="cfgMoneda" value="${escapeHtml(c.moneda || "$")}" />
            </div>
            <div class="form-group">
              <label>Impuesto %</label>
              <input class="input" id="cfgImpuesto" type="number" step="0.01" value="${Number(c.impuesto || 0)}" />
            </div>
          </div>
          <div class="form-group">
            <label>Pie de ticket</label>
            <textarea class="textarea" id="cfgTicketFooter">${escapeHtml(c.ticketFooter || "")}</textarea>
          </div>
          <div class="form-group">
            <label><input type="checkbox" id="cfgImprimirAuto" ${c.imprimirAutomatico ? "checked" : ""} /> Imprimir automático después de cobrar</label>
          </div>
        </div>

        <div>
          <div class="form-group">
            <label>Modo de logo</label>
            <select class="select" id="cfgLogoMode">
              <option value="url" ${c.logoMode === "url" ? "selected" : ""}>URL de imagen</option>
              <option value="base64" ${c.logoMode === "base64" ? "selected" : ""}>Imagen base64 desde archivo</option>
            </select>
          </div>
          <div class="form-group">
            <label>Logo por URL</label>
            <input class="input" id="cfgLogoUrl" placeholder="https://..." value="${c.logoMode === "url" ? escapeHtml(c.logoValue || "") : ""}" />
          </div>
          <div class="form-group">
            <label>Logo desde archivo</label>
            <input class="input" id="cfgLogoFile" type="file" accept="image/*" />
            <div class="sidebar-subtitle mt8">Usa imágenes ligeras para no recargar Firestore.</div>
          </div>
          <div class="form-group">
            <label>Vista previa</label>
            <div class="logo-preview">${logoPreview}</div>
          </div>
          <div class="alert alert-info">
            Para evitar cobros, este sistema no usa Firebase Storage. El logo puede guardarse como URL o base64.
          </div>
        </div>
      </div>

      <div class="toolbar mt16">
        <button class="btn btn-primary" id="btnGuardarConfiguracion">Guardar configuración</button>
      </div>
    </section>
  `;
}
