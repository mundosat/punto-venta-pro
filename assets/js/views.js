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

export function renderVentas({ products = [], cart = [], clients = [], selectedClientId = "final" }) {
  const query = (state.saleSearchQuery || "").trim().toLowerCase();
  const activeProducts = products.filter(p => p.activo !== false);
  const scored = query
    ? activeProducts.map(p => {
        const nombre = String(p.nombre || "").toLowerCase();
        const codigo = String(p.codigo || "").toLowerCase();
        const exactCode = codigo === query ? 100 : 0;
        const startsName = nombre.startsWith(query) ? 60 : 0;
        const startsCode = codigo.startsWith(query) ? 55 : 0;
        const includesName = nombre.includes(query) ? 25 : 0;
        const includesCode = codigo.includes(query) ? 20 : 0;
        const score = exactCode + startsName + startsCode + includesName + includesCode;
        return { p, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || String(a.p.nombre || "").localeCompare(String(b.p.nombre || "")))
    : [];
  const visibleResults = scored.slice(0, 12);
  const searchResults = query
    ? visibleResults.length
      ? visibleResults.map(({ p }, idx) => `
        <button class="product-search-item ${idx === 0 ? 'is-active' : ''}" type="button" data-search-product="${p.id}">
          <div class="product-search-main">
            <strong>${escapeHtml(p.nombre || "Producto")}</strong>
            <span class="product-search-code">${escapeHtml(p.codigo || "Sin código")}</span>
          </div>
          <div class="product-search-side">
            <span class="product-search-stock">Stock: ${Number(p.stock || 0)}</span>
            <span class="product-search-price">${currency(p.precio, state.config.moneda)}</span>
          </div>
        </button>`).join("")
      : `<div class="search-empty">No se encontraron productos para <strong>${escapeHtml(state.saleSearchQuery || "")}</strong>.</div>`
    : `<div class="search-hint">Escribe el nombre, código o escanea el producto. También puedes presionar <strong>Enter</strong> para agregar el primer resultado.</div>`;

  const clientOptions = [`<option value="final">Consumidor Final</option>`]
    .concat(clients.map(c => `<option value="${c.id}" ${selectedClientId === c.id ? 'selected' : ''}>${escapeHtml(c.nombre || 'Cliente')}</option>`))
    .join("");

  const selectedClient = selectedClientId === 'final' ? null : clients.find(c => c.id === selectedClientId);
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
      <section class="card sales-left-panel">
        <div class="grid grid-2 sales-header-grid">
          <div class="form-group search-group">
            <label>Buscar producto</label>
            <input class="input" id="buscarProducto" placeholder="Nombre, código o escaneo" autocomplete="off" value="${escapeHtml(state.saleSearchQuery || "")}" />
          </div>
          <div class="form-group">
            <label>Cliente</label>
            <div class="client-row">
              <select class="select" id="clienteVenta">${clientOptions}</select>
              <button class="btn btn-primary" type="button" id="btnRegistrarCliente">Registrar cliente</button>
            </div>
          </div>
        </div>

        <div class="client-summary ${selectedClient ? '' : 'muted'}" id="clientSummary">
          ${selectedClient ? `Cliente: <strong>${escapeHtml(selectedClient.nombre || '')}</strong> · ${escapeHtml(selectedClient.identificacion || 'Sin identificación')}` : 'Cliente actual: <strong>Consumidor Final</strong>'}
        </div>

        <div class="search-results-card mt16">
          <div class="search-results-head">
            <h3 class="m0">Resultados</h3>
            <span class="search-results-count">${query ? `${visibleResults.length} resultado(s)` : 'Listo para buscar'}</span>
          </div>
          <div class="search-results-list" id="listaProductos">${searchResults}</div>
        </div>

        <div class="quick-sale-card mt16">
          <div class="quick-sale-head">
            <h3 class="m0">Venta rápida</h3>
            <span class="muted">Para productos no registrados</span>
          </div>
          <div class="quick-sale-grid mt12">
            <input class="input" id="ventaRapidaNombre" placeholder="Producto rápido">
            <input class="input" id="ventaRapidaPrecio" type="number" placeholder="Precio">
            <input class="input" id="ventaRapidaCantidad" type="number" value="1" min="1">
            <button class="btn btn-primary" id="btnAgregarVentaRapida">Agregar</button>
          </div>
        </div>

        <button class="calc-fab" type="button" id="btnOpenCalc" title="Calculadora">🧮</button>
        <div class="calc-panel hidden" id="calcPanel">
          <div class="calc-head">
            <strong>Calculadora</strong>
            <button class="calc-close" type="button" id="btnCloseCalc">×</button>
          </div>
          <input class="input calc-display" id="calcDisplay" type="text" readonly value="" />
          <div class="calc-grid">
            <button type="button" data-calc="7">7</button><button type="button" data-calc="8">8</button><button type="button" data-calc="9">9</button><button type="button" data-calc="/">÷</button>
            <button type="button" data-calc="4">4</button><button type="button" data-calc="5">5</button><button type="button" data-calc="6">6</button><button type="button" data-calc="*">×</button>
            <button type="button" data-calc="1">1</button><button type="button" data-calc="2">2</button><button type="button" data-calc="3">3</button><button type="button" data-calc="-">−</button>
            <button type="button" data-calc="0">0</button><button type="button" data-calc=".">.</button><button type="button" id="btnCalcEquals">=</button><button type="button" data-calc="+">+</button>
            <button type="button" class="span-2" id="btnCalcClear">Limpiar</button>
            <button type="button" class="span-2 btn btn-primary" id="btnCalcToQuickSale">Usar en precio</button>
          </div>
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
            <button class="btn btn-primary btn-block" id="btnCobrarImprimir">Cobrar e imprimir</button>
            <button class="btn btn-secondary btn-block" id="btnCobrarSinImprimir">Cobrar sin imprimir</button>
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
    ${topbar("Usuarios", `<button class="btn btn-primary" id="btnNuevoUsuario">Nuevo usuario automático</button>`)}
    <section class="card">
      <div class="alert alert-info">
        Desde aquí el administrador crea usuarios automáticos. El sistema genera la cuenta en Firebase Authentication y guarda el perfil en Firestore sin pedir UID manual.
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
  const ventasHoy = sales.filter(s => formatDate(s.fecha) === hoy);
  const totalHoy = ventasHoy.reduce((a, s) => a + Number(s.total || 0), 0);
  const topMap = new Map();
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const key = item.nombre || 'Producto';
      topMap.set(key, (topMap.get(key) || 0) + Number(item.cantidad || 0));
    }
  }
  const topProducts = [...topMap.entries()].sort((a,b) => b[1]-a[1]).slice(0,5);

  const rows = sales.map(s => `
    <tr>
      <td>#${String(s.numero || 0).padStart(6, "0")}</td>
      <td>${formatDateTime(s.fecha)}</td>
      <td>${escapeHtml(s.cliente || "Consumidor Final")}</td>
      <td>${escapeHtml(s.usuarioNombre || "")}</td>
      <td class="right">${currency(s.subtotal, state.config.moneda)}</td>
      <td class="right">${currency(s.impuesto, state.config.moneda)}</td>
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

  const topRows = topProducts.map(([name, qty]) => `
    <tr>
      <td>${escapeHtml(name)}</td>
      <td class="right">${qty}</td>
    </tr>
  `).join("");

  return `
    ${topbar("Reportes", `
      <button class="btn btn-secondary" id="btnExportVentasCSV">Exportar ventas CSV</button>
      <button class="btn btn-secondary" id="btnExportProductosCSV">Exportar productos CSV</button>
    `)}

    <div class="grid grid-4">
      <div class="stat"><div class="label">Fecha</div><div class="value">${escapeHtml(hoy)}</div><div class="hint">Resumen actual</div></div>
      <div class="stat"><div class="label">Total vendido</div><div class="value">${currency(totalVentas, state.config.moneda)}</div><div class="hint">Historial visible</div></div>
      <div class="stat"><div class="label">Ventas de hoy</div><div class="value">${currency(totalHoy, state.config.moneda)}</div><div class="hint">Caja diaria</div></div>
      <div class="stat"><div class="label">Unidades vendidas</div><div class="value">${totalUnidades}</div><div class="hint">Suma de cantidades</div></div>
    </div>

    <div class="grid grid-2 mt16">
      <section class="card">
        <h3 class="m0">Productos más vendidos</h3>
        <div class="table-wrap mt12">
          <table class="table">
            <thead><tr><th>Producto</th><th class="right">Cantidad</th></tr></thead>
            <tbody>${topRows || '<tr><td colspan="2" class="center">Sin datos todavía</td></tr>'}</tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h3 class="m0">Productos con stock bajo</h3>
        <div class="table-wrap mt12">
          <table class="table">
            <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th class="right">Stock</th><th class="right">Mínimo</th></tr></thead>
            <tbody>${lowRows || '<tr><td colspan="5" class="center">Todo bien por ahora</td></tr>'}</tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="card mt16">
      <h3 class="m0">Resumen de ventas</h3>
      <div class="table-wrap mt12">
        <table class="table">
          <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Usuario</th><th class="right">Subtotal</th><th class="right">IVA</th><th class="right">Total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" class="center">Sin ventas</td></tr>'}</tbody>
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
