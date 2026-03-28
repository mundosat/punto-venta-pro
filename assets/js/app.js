import {
  auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserByAdmin
} from "./firebase.js";
import { state } from "./state.js";
import {
  getConfig, getUserProfile, listProducts, createProduct, updateProduct, deleteProduct, deleteOldSales, adjustStock, listKardex,
  listUsers, saveUser, listSales, getNextSaleNumber, createSale,
  getOpenCashSession, openCashSession, closeCashSession, createCashMovement, listCashMovements, saveConfig
} from "./api.js";
import { renderLogin, renderLayout, modalShell } from "./ui.js";
import {
  renderInicio, renderCaja, renderVentas, renderProductos, renderKardex,
  renderUsuarios, renderReportes, renderConfiguracion
} from "./views.js";
import { printTicket } from "./ticket.js";
import { toNumber, formatDateTime, escapeHtml, csvFromRows, downloadTextFile, readFileAsText, parseCsv } from "./utils.js";

const app = document.getElementById("app");

onAuthStateChanged(auth, async (user) => {
  state.currentUser = user;
  if (!user) {
    app.innerHTML = renderLogin();
    bindLogin();
    return;
  }

  try {
    await refreshBootstrap();
    if (!state.userProfile || state.userProfile.activo === false) {
      await signOut(auth);
      app.innerHTML = renderLogin();
      bindLogin("Tu usuario existe en Authentication, pero falta o está inactivo en Firestore.");
      return;
    }
    await renderApp();
  } catch (err) {
    console.error(err);
    app.innerHTML = renderLogin();
    bindLogin("No se pudo cargar el sistema. Revisa tu configuración de Firebase.");
  }
});

async function refreshBootstrap() {
  state.userProfile = await getUserProfile(state.currentUser.uid);
  if (state.userProfile) state.userProfile.id = state.currentUser.uid;
  await getConfig();
  state.products = await listProducts().catch(() => []);
  state.activeCashSession = await getOpenCashSession().catch(() => null);
}

function bindLogin(message = "") {
  const btn = document.getElementById("btnLogin");
  if (!btn) return;
  if (message) {
    const card = document.querySelector(".login-card");
    card.insertAdjacentHTML("beforeend", `<div class="alert alert-danger mt16">${escapeHtml(message)}</div>`);
  }
  btn.onclick = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("No se pudo iniciar sesión: " + (err?.message || err));
    }
  };
}

window.addEventListener("hashchange", () => renderApp());
window.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.hash) window.location.hash = "#inicio";
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    } catch {}
  }
});

async function renderApp() {
  state.currentView = (window.location.hash.replace("#", "") || "inicio");
  const restrictedForCashier = ["usuarios", "configuracion"];
  if (state.userProfile?.rol === "cajero" && restrictedForCashier.includes(state.currentView)) {
    state.currentView = "inicio";
    window.location.hash = "#inicio";
  }
  let content = "";
  const view = state.currentView;

  if (view === "inicio") {
    const sales = await listSales().catch(() => []);
    content = renderInicio({ sales, products: state.products, cashSession: state.activeCashSession });
  } else if (view === "caja") {
    const movements = state.activeCashSession ? await listCashMovements(state.activeCashSession.id).catch(() => []) : [];
    const sales = await getSessionSales();
    content = renderCaja({ session: state.activeCashSession, movements, sales });
  } else if (view === "ventas") {
    content = renderVentas({ products: state.products, cart: state.cart });
  } else if (view === "productos") {
    content = renderProductos({ products: state.products });
  } else if (view === "kardex") {
    const items = await listKardex().catch(() => []);
    content = renderKardex({ items });
  } else if (view === "usuarios") {
    const users = await listUsers().catch(() => []);
    state.cachedUsers = users;
    content = renderUsuarios({ users });
  } else if (view === "reportes") {
    const sales = await listSales().catch(() => []);
    content = renderReportes({ sales, products: state.products });
  } else if (view === "configuracion") {
    content = renderConfiguracion();
  } else {
    content = renderInicio({ sales: [], products: state.products, cashSession: state.activeCashSession });
  }

  app.innerHTML = renderLayout(content);
  bindGlobal();
  bindViewActions(view);
}

function bindGlobal() {
  const logout = document.getElementById("btnLogout");
  if (logout) logout.onclick = async () => signOut(auth);
}

function bindViewActions(view) {
  if (view === "caja") bindCaja();
  if (view === "ventas") bindVentas();
  if (view === "productos") bindProductos();
  if (view === "usuarios") bindUsuarios();
  if (view === "reportes") bindReportes();
  if (view === "configuracion") bindConfiguracion();
}

async function getSessionSales() {
  const all = await listSales().catch(() => []);
  if (!state.activeCashSession?.fechaApertura?.toDate) return all.slice(0, 50);
  const openAt = state.activeCashSession.fechaApertura.toDate().getTime();
  return all.filter(s => {
    const t = s.fecha?.toDate ? s.fecha.toDate().getTime() : new Date(s.fecha).getTime();
    return t >= openAt;
  });
}

function bindCaja() {
  const openBtn = document.getElementById("btnAbrirCaja");
  if (openBtn) {
    openBtn.onclick = () => showOpenCashModal();
  }
  const saveMove = document.getElementById("btnGuardarMovimiento");
  if (saveMove) {
    saveMove.onclick = async () => {
      try {
        const tipo = document.getElementById("movTipo").value;
        const monto = toNumber(document.getElementById("movMonto").value);
        const concepto = document.getElementById("movConcepto").value.trim();
        if (!state.activeCashSession) return alert("Primero abre la caja.");
        if (monto <= 0) return alert("El monto debe ser mayor a 0.");
        await createCashMovement({
          sesionId: state.activeCashSession.id,
          tipo,
          monto,
          concepto,
          usuarioId: state.userProfile.id,
          usuarioNombre: state.userProfile.nombre
        });
        await renderApp();
      } catch (err) {
        console.error(err);
        alert("No se pudo guardar el movimiento.");
      }
    };
  }

  const closeBtn = document.getElementById("btnCerrarCaja");
  if (closeBtn) {
    closeBtn.onclick = async () => {
      if (!state.activeCashSession) return;
      const movements = await listCashMovements(state.activeCashSession.id).catch(() => []);
      const sales = await getSessionSales();
      const ingresos = movements.filter(m => m.tipo === "ingreso").reduce((a, m) => a + Number(m.monto || 0), 0);
      const egresos = movements.filter(m => m.tipo === "egreso").reduce((a, m) => a + Number(m.monto || 0), 0);
      const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
      const montoFinal = Number(state.activeCashSession.montoInicial || 0) + ingresos + totalVentas - egresos;
      if (!confirm(`¿Cerrar caja con total estimado ${state.config.moneda}${montoFinal.toFixed(2)}?`)) return;
      await closeCashSession(state.activeCashSession, { ingresos, egresos, totalVentas, montoFinal });
      state.activeCashSession = null;
      await renderApp();
    };
  }
}

function showOpenCashModal() {
  document.body.insertAdjacentHTML("beforeend", modalShell(`
    <h3 class="m0">Abrir caja</h3>
    <div class="form-group mt16">
      <label>Monto inicial</label>
      <input class="input" id="cashOpenAmount" type="number" step="0.01" value="0" />
    </div>
    <div class="toolbar mt16">
      <button class="btn btn-primary" id="confirmOpenCash">Abrir</button>
      <button class="btn btn-secondary" id="cancelModal">Cancelar</button>
    </div>
  `));
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("confirmOpenCash").onclick = async () => {
    try {
      const montoInicial = toNumber(document.getElementById("cashOpenAmount").value);
      state.activeCashSession = await openCashSession({ montoInicial, user: state.userProfile });
      closeModal();
      alert("Caja abierta correctamente.");
      await renderApp();
    } catch (error) {
      console.error(error);
      const message = error?.message || String(error);
      alert("No se pudo abrir la caja. Detalle: " + message);
    }
  };
}

function bindVentas() {
  document.querySelectorAll("[data-add-product]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-add-product");
      const product = state.products.find(p => p.id === id);
      if (!product) return;
      if (Number(product.stock || 0) <= 0) return alert("No hay stock disponible.");
      addToCart(product);
      renderApp();
    };
  });

  document.querySelectorAll("[data-cart-inc]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-cart-inc");
      changeQty(id, 1);
      renderApp();
    };
  });

  document.querySelectorAll("[data-cart-dec]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-cart-dec");
      changeQty(id, -1);
      renderApp();
    };
  });

  document.querySelectorAll("[data-cart-remove]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-cart-remove");
      state.cart = state.cart.filter(i => i.id !== id);
      renderApp();
    };
  });

  const payInput = document.getElementById("pagadoCon");
  if (payInput) {
    const syncChange = () => {
      const total = cartTotal();
      const paid = toNumber(payInput.value);
      const change = Math.max(0, paid - total);
      const changeInput = document.getElementById("cambioVenta");
      if (changeInput) changeInput.value = change.toFixed(2);
    };
    payInput.oninput = syncChange;
    syncChange();
  }

  const clearBtn = document.getElementById("btnLimpiarCarrito");
  if (clearBtn) clearBtn.onclick = async () => {
    state.cart = [];
    await renderApp();
  };

  const btnPrint = document.getElementById("btnCobrarImprimir");
  if (btnPrint) btnPrint.onclick = () => chargeSale(true);

  const btnNoPrint = document.getElementById("btnCobrarSinImprimir");
  if (btnNoPrint) btnNoPrint.onclick = () => chargeSale(false);

  const search = document.getElementById("buscarProducto");
  if (search) {
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll("[data-add-product]").forEach(card => {
        const txt = card.textContent.toLowerCase();
        card.classList.toggle("hidden", !txt.includes(q));
      });
    };
  }
}

function addToCart(product) {
  const found = state.cart.find(i => i.id === product.id);
  if (found) {
    if (found.cantidad >= Number(product.stock || 0)) return alert("Stock insuficiente.");
    found.cantidad += 1;
    found.total = found.cantidad * found.precio;
  } else {
    state.cart.push({
      id: product.id,
      productoId: product.id,
      codigo: product.codigo || "",
      nombre: product.nombre || "",
      cantidad: 1,
      precio: Number(product.precio || 0),
      total: Number(product.precio || 0)
    });
  }
}

function changeQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  const product = state.products.find(p => p.id === id);
  if (!item || !product) return;
  const next = item.cantidad + delta;
  if (next <= 0) {
    state.cart = state.cart.filter(i => i.id !== id);
    return;
  }
  if (next > Number(product.stock || 0)) return alert("Stock insuficiente.");
  item.cantidad = next;
  item.total = item.cantidad * item.precio;
}

function cartSubtotal() {
  return state.cart.reduce((a, i) => a + Number(i.total || 0), 0);
}

function cartTax() {
  return cartSubtotal() * (Number(state.config.impuesto || 0) / 100);
}

function cartTotal() {
  return cartSubtotal() + cartTax();
}

async function chargeSale(imprimir) {
  try {
    if (!state.activeCashSession) return alert("Debes abrir la caja antes de cobrar.");
    if (!state.cart.length) return alert("Agrega productos al carrito.");
    const cliente = document.getElementById("clienteVenta")?.value.trim() || "Consumidor Final";
    const pagadoCon = toNumber(document.getElementById("pagadoCon")?.value);
    const subtotal = cartSubtotal();
    const impuesto = cartTax();
    const total = cartTotal();
    if (pagadoCon < total) return alert("El monto pagado es insuficiente.");
    const cambio = pagadoCon - total;
    const numero = await getNextSaleNumber();

    for (const item of state.cart) {
      const product = state.products.find(p => p.id === item.productoId);
      if (!product) throw new Error("Producto no encontrado");
      if (Number(product.stock || 0) < Number(item.cantidad || 0)) {
        return alert(`Stock insuficiente para ${item.nombre}`);
      }
    }

    const salePayload = {
      numero,
      usuarioId: state.userProfile.id,
      usuarioNombre: state.userProfile.nombre,
      cliente,
      subtotal,
      impuesto,
      total,
      pagadoCon,
      cambio,
      imprimir,
      items: state.cart.map(i => ({
        productoId: i.productoId,
        codigo: i.codigo,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio: i.precio,
        total: i.total
      }))
    };

    const ref = await createSale(salePayload);

    for (const item of state.cart) {
      const product = state.products.find(p => p.id === item.productoId);
      await adjustStock(product, -Number(item.cantidad || 0), "venta", `venta_${String(numero).padStart(6, "0")}`, state.userProfile);
      product.stock = Number(product.stock || 0) - Number(item.cantidad || 0);
    }

    const saleData = {
      id: ref.id,
      ...salePayload,
      fecha: new Date()
    };

    state.cart = [];
    if (imprimir || state.config.imprimirAutomatico) {
      printTicket(saleData);
    }
    alert(`Venta guardada con número ${String(numero).padStart(6, "0")}`);
    await renderApp();
  } catch (err) {
    console.error(err);
    alert("No se pudo guardar la venta.");
  }
}

function bindProductos() {
  const newBtn = document.getElementById("btnNuevoProducto");
  if (newBtn) newBtn.onclick = () => showProductModal();

  document.querySelectorAll("[data-edit-product]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-edit-product");
      const product = state.products.find(p => p.id === id);
      if (product) showProductModal(product);
    };
  });

  document.querySelectorAll("[data-adjust-stock]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-adjust-stock");
      const product = state.products.find(p => p.id === id);
      if (product) showAdjustStockModal(product);
    };
  });

  document.querySelectorAll("[data-delete-product]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-delete-product");
      const product = state.products.find(p => p.id === id);
      if (!product) return;
      if (!confirm(`¿Eliminar definitivamente el producto "${product.nombre}"?`)) return;
      try {
        await deleteProduct(id);
        state.products = await listProducts();
        await renderApp();
        alert("Producto eliminado correctamente.");
      } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el producto.");
      }
    };
  });

  const search = document.getElementById("buscarProductoTabla");
  if (search) {
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll(".table tbody tr").forEach(row => {
        row.classList.toggle("hidden", !row.textContent.toLowerCase().includes(q));
      });
    };
  }

  const importBtn = document.getElementById("btnImportarProductos");
  if (importBtn) importBtn.onclick = showImportProductsModal;

  const exportBtn = document.getElementById("btnExportProductosExcel");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const rows = [["codigo","nombre","categoria","precio","stock","minimo","activo"]];
      state.products.forEach(p => rows.push([
        p.codigo || "",
        p.nombre || "",
        p.categoria || "",
        Number(p.precio || 0).toFixed(2),
        Number(p.stock || 0),
        Number(p.minimo || 0),
        p.activo !== false ? "true" : "false"
      ]));
      downloadTextFile("productos.xls", rows.map(r => r.join("\t")).join("\n"), "application/vnd.ms-excel;charset=utf-8");
    };
  }
}

function showProductModal(product = null) {
  const isEdit = !!product;
  document.body.insertAdjacentHTML("beforeend", modalShell(`
    <h3 class="m0">${isEdit ? "Editar producto" : "Nuevo producto"}</h3>
    <div class="grid grid-2 mt16">
      <div class="form-group"><label>Código</label><input class="input" id="pCodigo" value="${escapeHtml(product?.codigo || "")}" /></div>
      <div class="form-group"><label>Nombre</label><input class="input" id="pNombre" value="${escapeHtml(product?.nombre || "")}" /></div>
    </div>
    <div class="grid grid-2">
      <div class="form-group"><label>Categoría</label><input class="input" id="pCategoria" value="${escapeHtml(product?.categoria || "General")}" /></div>
      <div class="form-group"><label>Precio</label><input class="input" id="pPrecio" type="number" step="0.01" value="${Number(product?.precio || 0)}" /></div>
    </div>
    <div class="grid grid-2">
      <div class="form-group"><label>Stock</label><input class="input" id="pStock" type="number" step="1" value="${Number(product?.stock || 0)}" /></div>
      <div class="form-group"><label>Mínimo</label><input class="input" id="pMinimo" type="number" step="1" value="${Number(product?.minimo || 0)}" /></div>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="pActivo" ${product?.activo !== false ? "checked" : ""} /> Activo</label>
    </div>
    <div class="toolbar mt16">
      <button class="btn btn-primary" id="saveProductModal">${isEdit ? "Guardar cambios" : "Crear producto"}</button>
      <button class="btn btn-secondary" id="cancelModal">Cancelar</button>
    </div>
  `));
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveProductModal").onclick = async () => {
    const payload = {
      codigo: document.getElementById("pCodigo").value.trim(),
      nombre: document.getElementById("pNombre").value.trim(),
      categoria: document.getElementById("pCategoria").value.trim() || "General",
      precio: toNumber(document.getElementById("pPrecio").value),
      stock: toNumber(document.getElementById("pStock").value),
      minimo: toNumber(document.getElementById("pMinimo").value),
      activo: document.getElementById("pActivo").checked
    };
    if (!payload.nombre) return alert("Debes escribir el nombre.");
    if (isEdit) {
      const previousStock = Number(product.stock || 0);
      await updateProduct(product.id, payload);
      const diff = Number(payload.stock || 0) - previousStock;
      if (diff !== 0) {
        await adjustStock({ ...product, stock: previousStock }, diff, "ajuste", "ajuste_manual", state.userProfile);
      }
    } else {
      const ref = await createProduct(payload);
      if (payload.stock !== 0) {
        await adjustStock({ ...payload, id: ref.id, stock: 0 }, Number(payload.stock || 0), "creacion", "creacion_producto", state.userProfile);
      }
    }
    state.products = await listProducts();
    closeModal();
    await renderApp();
  };
}

function showAdjustStockModal(product) {
  document.body.insertAdjacentHTML("beforeend", modalShell(`
    <h3 class="m0">Ajustar stock</h3>
    <p class="mt12"><strong>${escapeHtml(product.nombre)}</strong> — stock actual: ${Number(product.stock || 0)}</p>
    <div class="grid grid-2 mt16">
      <div class="form-group">
        <label>Tipo</label>
        <select class="select" id="adjTipo">
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>
      </div>
      <div class="form-group">
        <label>Cantidad</label>
        <input class="input" id="adjCantidad" type="number" step="1" value="1" />
      </div>
    </div>
    <div class="form-group">
      <label>Referencia</label>
      <input class="input" id="adjReferencia" placeholder="Compra, merma, conteo, etc." />
    </div>
    <div class="toolbar mt16">
      <button class="btn btn-primary" id="confirmAdjustStock">Guardar ajuste</button>
      <button class="btn btn-secondary" id="cancelModal">Cancelar</button>
    </div>
  `));
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("confirmAdjustStock").onclick = async () => {
    const tipo = document.getElementById("adjTipo").value;
    const cantidad = toNumber(document.getElementById("adjCantidad").value);
    const refText = document.getElementById("adjReferencia").value.trim() || "ajuste_manual";
    if (cantidad <= 0) return alert("Cantidad inválida.");
    const signed = tipo === "entrada" ? cantidad : -cantidad;
    const next = Number(product.stock || 0) + signed;
    if (next < 0) return alert("No puedes dejar el stock en negativo.");
    await adjustStock(product, signed, "ajuste", refText, state.userProfile);
    state.products = await listProducts();
    closeModal();
    await renderApp();
  };
}

function showImportProductsModal() {
  document.body.insertAdjacentHTML("beforeend", modalShell(`
    <h3 class="m0">Importar productos desde CSV</h3>
    <div class="alert alert-info mt16">Encabezados: codigo,nombre,categoria,precio,stock,minimo,activo</div>
    <div class="form-group mt16">
      <label>Archivo CSV</label>
      <input class="input" id="csvFileProducts" type="file" accept=".csv,text/csv" />
    </div>
    <div class="toolbar mt16">
      <button class="btn btn-primary" id="confirmImportProducts">Importar</button>
      <button class="btn btn-secondary" id="cancelModal">Cancelar</button>
    </div>
  `));
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("confirmImportProducts").onclick = async () => {
    const file = document.getElementById("csvFileProducts").files[0];
    if (!file) return alert("Selecciona un CSV.");
    const text = await readFileAsText(file);
    const rows = parseCsv(text);
    for (const row of rows) {
      const payload = {
        codigo: row.codigo || "",
        nombre: row.nombre || "",
        categoria: row.categoria || "General",
        precio: toNumber(row.precio),
        stock: toNumber(row.stock),
        minimo: toNumber(row.minimo),
        activo: String(row.activo || "true").toLowerCase() !== "false"
      };
      if (!payload.nombre) continue;
      const ref = await createProduct({ ...payload, stock: 0 });
      if (payload.stock !== 0) {
        await adjustStock({ ...payload, id: ref.id, stock: 0 }, payload.stock, "creacion", "importacion_csv", state.userProfile);
      }
    }
    state.products = await listProducts();
    closeModal();
    await renderApp();
    alert("Importación completada.");
  };
}

function bindUsuarios() {
  const btn = document.getElementById("btnNuevoUsuario");
  if (btn) btn.onclick = () => showUserModal();

  document.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-edit-user");
      const user = state.cachedUsers?.find(u => u.id === id) || { id };
      showUserModal(user);
    };
  });
}

function showUserModal(user = null) {
  const isEdit = !!user?.id;
  document.body.insertAdjacentHTML("beforeend", modalShell(`
    <h3 class="m0">${isEdit ? "Editar usuario" : "Nuevo usuario automático"}</h3>
    <div class="alert alert-info mt16">${isEdit ? "Edita nombre, rol y estado. Para cambiar contraseña usa Firebase Authentication." : "Este formulario crea la cuenta en Firebase Authentication y guarda el perfil en Firestore de forma automática."}</div>
    <div class="form-group mt16"><label>Nombre</label><input class="input" id="uNombre" value="${escapeHtml(user?.nombre || "")}" /></div>
    <div class="form-group"><label>Correo</label><input class="input" id="uEmail" type="email" value="${escapeHtml(user?.email || "")}" ${isEdit ? "readonly" : ""} /></div>
    ${isEdit ? "" : `<div class="form-group"><label>Contraseña</label><input class="input" id="uPassword" type="password" placeholder="Mínimo 6 caracteres" /></div>`}
    <div class="grid grid-2">
      <div class="form-group">
        <label>Rol</label>
        <select class="select" id="uRol">
          <option value="admin" ${user?.rol === "admin" ? "selected" : ""}>admin</option>
          <option value="cajero" ${user?.rol === "cajero" ? "selected" : ""}>cajero</option>
        </select>
      </div>
      <div class="form-group">
        <label>Activo</label>
        <select class="select" id="uActivo">
          <option value="true" ${user?.activo !== false ? "selected" : ""}>Sí</option>
          <option value="false" ${user?.activo === false ? "selected" : ""}>No</option>
        </select>
      </div>
    </div>
    <div class="toolbar mt16">
      <button class="btn btn-primary" id="saveUserModal">${isEdit ? "Guardar cambios" : "Crear usuario"}</button>
      <button class="btn btn-secondary" id="cancelModal">Cancelar</button>
    </div>
  `));
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveUserModal").onclick = async () => {
    const nombre = document.getElementById("uNombre").value.trim();
    const email = document.getElementById("uEmail").value.trim();
    const password = document.getElementById("uPassword")?.value || "";
    const rol = document.getElementById("uRol").value;
    const activo = document.getElementById("uActivo").value === "true";
    if (!nombre || !email || (!isEdit && password.length < 6)) {
      return alert(isEdit ? "Completa nombre y correo." : "Completa nombre, correo y una contraseña de al menos 6 caracteres.");
    }
    try {
      if (isEdit) {
        await saveUser(user.id, { nombre, email, rol, activo });
      } else {
        await createUserByAdmin({ email, password, nombre, rol, activo });
      }
      closeModal();
      await renderApp();
      alert(isEdit ? "Usuario actualizado." : "Usuario creado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el usuario: " + (error?.message || error));
    }
  };
}

function bindReportes() {
  const btnVentas = document.getElementById("btnExportVentasCSV");
  if (btnVentas) {
    btnVentas.onclick = async () => {
      const sales = await listSales().catch(() => []);
      const rows = [["numero","fecha","cliente","usuario","subtotal","impuesto","total","pagadoCon","cambio"]];
      sales.forEach(s => rows.push([
        String(s.numero || 0).padStart(6, "0"),
        formatDateTime(s.fecha),
        s.cliente || "Consumidor Final",
        s.usuarioNombre || "",
        Number(s.subtotal || 0).toFixed(2),
        Number(s.impuesto || 0).toFixed(2),
        Number(s.total || 0).toFixed(2),
        Number(s.pagadoCon || 0).toFixed(2),
        Number(s.cambio || 0).toFixed(2)
      ]));
      downloadTextFile("reporte_ventas.csv", csvFromRows(rows), "text/csv;charset=utf-8");
    };
  }
  const btnProducts = document.getElementById("btnExportProductosCSV");
  if (btnProducts) {
    btnProducts.onclick = async () => {
      const rows = [["codigo","nombre","categoria","precio","stock","minimo","activo"]];
      state.products.forEach(p => rows.push([
        p.codigo || "",
        p.nombre || "",
        p.categoria || "",
        Number(p.precio || 0).toFixed(2),
        Number(p.stock || 0),
        Number(p.minimo || 0),
        p.activo !== false ? "true" : "false"
      ]));
      downloadTextFile("reporte_productos.csv", csvFromRows(rows), "text/csv;charset=utf-8");
    };
  }

  const btnCleanSales = document.getElementById("btnLimpiarVentasAntiguas");
  if (btnCleanSales) {
    btnCleanSales.onclick = async () => {
      if (!confirm("¿Eliminar ventas con más de 30 días? Esta acción no se puede deshacer.")) return;
      try {
        const deleted = await deleteOldSales(30);
        alert(deleted ? `Se eliminaron ${deleted} ventas antiguas.` : "No había ventas antiguas para eliminar.");
        await renderApp();
      } catch (error) {
        console.error(error);
        alert("No se pudieron limpiar las ventas antiguas.");
      }
    };
  }
}

function bindConfiguracion() {
  const fileInput = document.getElementById("cfgLogoFile");
  if (fileInput) {
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const base64 = await fileToDataUrl(file);
      const preview = document.querySelector(".logo-preview");
      if (preview) preview.innerHTML = `<img src="${base64}" alt="Logo">`;
    };
  }

  const btn = document.getElementById("btnGuardarConfiguracion");
  if (btn) {
    btn.onclick = async () => {
      const logoMode = document.getElementById("cfgLogoMode").value;
      let logoValue = "";
      if (logoMode === "url") {
        logoValue = document.getElementById("cfgLogoUrl").value.trim();
      } else {
        const file = document.getElementById("cfgLogoFile").files[0];
        if (file) {
          logoValue = await fileToDataUrl(file);
        } else if (state.config.logoMode === "base64") {
          logoValue = state.config.logoValue || "";
        }
      }

      await saveConfig({
        nombreTienda: document.getElementById("cfgNombreTienda").value.trim(),
        ruc: document.getElementById("cfgRuc").value.trim(),
        telefono: document.getElementById("cfgTelefono").value.trim(),
        direccion: document.getElementById("cfgDireccion").value.trim(),
        moneda: document.getElementById("cfgMoneda").value.trim() || "$",
        impuesto: toNumber(document.getElementById("cfgImpuesto").value),
        imprimirAutomatico: document.getElementById("cfgImprimirAuto").checked,
        ticketFooter: document.getElementById("cfgTicketFooter").value.trim(),
        logoMode,
        logoValue
      });
      await getConfig();
      alert("Configuración guardada.");
      await renderApp();
    };
  }
}

function closeModal() {
  document.getElementById("modalBackdrop")?.remove();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
