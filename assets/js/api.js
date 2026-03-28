
import {
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, orderBy, limit, serverTimestamp, Timestamp
} from "./firebase.js";
import { state } from "./state.js";
import { toNumber } from "./utils.js";

export async function getConfig() {
  const snap = await getDoc(doc(db, "configuracion", "general"));
  if (snap.exists()) {
    state.config = { ...state.config, ...snap.data() };
  }
  return state.config;
}

export async function saveConfig(payload) {
  await setDoc(doc(db, "configuracion", "general"), {
    ...payload,
    actualizadoEn: serverTimestamp()
  }, { merge: true });
  return getConfig();
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listUsers() {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), 'es'));
}

export async function saveUser(userId, payload) {
  await setDoc(doc(db, "usuarios", userId), {
    ...payload,
    actualizadoEn: serverTimestamp()
  }, { merge: true });
}

export async function listProducts() {
  const snap = await getDocs(query(collection(db, "productos"), orderBy("nombre")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createProduct(payload) {
  return addDoc(collection(db, "productos"), {
    codigo: payload.codigo || "",
    nombre: payload.nombre || "",
    categoria: payload.categoria || "General",
    precio: toNumber(payload.precio),
    stock: toNumber(payload.stock),
    minimo: toNumber(payload.minimo),
    activo: payload.activo !== false,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });
}

export async function updateProduct(id, payload) {
  await updateDoc(doc(db, "productos", id), {
    codigo: payload.codigo || "",
    nombre: payload.nombre || "",
    categoria: payload.categoria || "General",
    precio: toNumber(payload.precio),
    stock: toNumber(payload.stock),
    minimo: toNumber(payload.minimo),
    activo: payload.activo !== false,
    actualizadoEn: serverTimestamp()
  });
}

export async function adjustStock(product, quantity, type, reference, user) {
  const previous = toNumber(product.stock);
  const next = previous + toNumber(quantity);
  await updateDoc(doc(db, "productos", product.id), {
    stock: next,
    actualizadoEn: serverTimestamp()
  });
  await addDoc(collection(db, "kardex"), {
    productoId: product.id,
    codigo: product.codigo || "",
    nombre: product.nombre || "",
    tipo,
    cantidad: toNumber(quantity),
    stockAnterior: previous,
    stockNuevo: next,
    referencia: reference || "",
    fecha: serverTimestamp(),
    usuarioId: user?.id || "",
    usuarioNombre: user?.nombre || ""
  });
}

export async function listKardex() {
  const snap = await getDocs(query(collection(db, "kardex"), orderBy("fecha", "desc"), limit(300)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listSales() {
  const snap = await getDocs(query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(300)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getNextSaleNumber() {
  const snap = await getDocs(query(collection(db, "ventas"), orderBy("numero", "desc"), limit(1)));
  if (snap.empty) return 1;
  return Number(snap.docs[0].data().numero || 0) + 1;
}

export async function createSale(payload) {
  return addDoc(collection(db, "ventas"), {
    ...payload,
    fecha: serverTimestamp()
  });
}

async function ensureCajaDoc() {
  const ref = doc(db, "caja", "caja");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      abierta: false,
      monto: 0,
      montoInicial: 0,
      fechaApertura: null,
      fechaCierre: null,
      usuarioId: "",
      usuarioNombre: "",
      actualizadoEn: serverTimestamp()
    }, { merge: true });
    return { id: "caja", abierta: false, monto: 0, montoInicial: 0 };
  }
  return { id: "caja", ...snap.data() };
}

export async function getOpenCashSession() {
  const caja = await ensureCajaDoc();
  if (caja.abierta === true) {
    return {
      id: "caja",
      estado: "abierta",
      montoInicial: toNumber(caja.montoInicial ?? caja.monto ?? 0),
      fechaApertura: caja.fechaApertura || Timestamp.now(),
      usuarioId: caja.usuarioId || "",
      usuarioNombre: caja.usuarioNombre || ""
    };
  }
  return null;
}

export async function openCashSession({ montoInicial, user }) {
  const cajaRef = doc(db, "caja", "caja");
  const current = await ensureCajaDoc();
  if (current.abierta === true) {
    return {
      id: "caja",
      estado: "abierta",
      montoInicial: toNumber(current.montoInicial ?? current.monto ?? 0),
      fechaApertura: current.fechaApertura || Timestamp.now(),
      usuarioId: current.usuarioId || "",
      usuarioNombre: current.usuarioNombre || ""
    };
  }

  const monto = toNumber(montoInicial);
  await setDoc(cajaRef, {
    abierta: true,
    monto,
    montoInicial: monto,
    fechaApertura: serverTimestamp(),
    fechaCierre: null,
    usuarioId: user?.id || "",
    usuarioNombre: user?.nombre || "",
    actualizadoEn: serverTimestamp()
  }, { merge: true });

  const histRef = await addDoc(collection(db, "cajas_sesiones"), {
    estado: "abierta",
    fechaApertura: serverTimestamp(),
    fechaCierre: null,
    montoInicial: monto,
    totalVentas: 0,
    ingresos: 0,
    egresos: 0,
    montoFinal: 0,
    usuarioId: user?.id || "",
    usuarioNombre: user?.nombre || ""
  });

  const snap = await getDoc(cajaRef);
  return {
    id: histRef.id,
    estado: "abierta",
    montoInicial: toNumber(snap.data()?.montoInicial ?? monto),
    fechaApertura: snap.data()?.fechaApertura || Timestamp.now(),
    usuarioId: user?.id || "",
    usuarioNombre: user?.nombre || ""
  };
}

export async function closeCashSession(session, summary) {
  await setDoc(doc(db, "caja", "caja"), {
    abierta: false,
    monto: 0,
    montoInicial: 0,
    fechaCierre: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  }, { merge: true });

  if (session?.id && session.id !== 'caja') {
    await updateDoc(doc(db, "cajas_sesiones", session.id), {
      estado: "cerrada",
      fechaCierre: serverTimestamp(),
      totalVentas: toNumber(summary.totalVentas),
      ingresos: toNumber(summary.ingresos),
      egresos: toNumber(summary.egresos),
      montoFinal: toNumber(summary.montoFinal)
    });
  }
}

export async function listCashSessions() {
  const snap = await getDocs(collection(db, "cajas_sesiones"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const at = a.fechaApertura?.toDate ? a.fechaApertura.toDate().getTime() : 0;
      const bt = b.fechaApertura?.toDate ? b.fechaApertura.toDate().getTime() : 0;
      return bt - at;
    })
    .slice(0, 50);
}

export async function createCashMovement(payload) {
  return addDoc(collection(db, "movimientos_caja"), {
    sesionId: payload.sesionId || 'caja',
    tipo: payload.tipo,
    concepto: payload.concepto || "",
    monto: toNumber(payload.monto),
    fecha: serverTimestamp(),
    usuarioId: payload.usuarioId || "",
    usuarioNombre: payload.usuarioNombre || ""
  });
}

export async function listCashMovements(sessionId) {
  const snap = await getDocs(collection(db, "movimientos_caja"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(m => !sessionId || m.sesionId === sessionId || m.sesionId === 'caja')
    .sort((a, b) => {
      const at = a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
      const bt = b.fecha?.toDate ? b.fecha.toDate().getTime() : 0;
      return bt - at;
    })
    .slice(0, 300);
}
