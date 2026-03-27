import {
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp
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
  const snap = await getDocs(query(collection(db, "usuarios")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  return (Number(snap.docs[0].data().numero || 0) + 1);
}

export async function createSale(payload) {
  const ref = await addDoc(collection(db, "ventas"), {
    ...payload,
    fecha: serverTimestamp()
  });
  return ref;
}

export async function getOpenCashSession() {
  const snap = await getDocs(query(
    collection(db, "cajas_sesiones"),
    where("estado", "==", "abierta"),
    orderBy("fechaApertura", "desc"),
    limit(1)
  ));
  if (snap.empty) return null;
  const doc0 = snap.docs[0];
  return { id: doc0.id, ...doc0.data() };
}

export async function openCashSession({ montoInicial, user }) {
  const ref = await addDoc(collection(db, "cajas_sesiones"), {
    estado: "abierta",
    fechaApertura: serverTimestamp(),
    fechaCierre: null,
    montoInicial: toNumber(montoInicial),
    totalVentas: 0,
    ingresos: 0,
    egresos: 0,
    montoFinal: 0,
    usuarioId: user?.id || "",
    usuarioNombre: user?.nombre || ""
  });
  return ref;
}

export async function closeCashSession(session, summary) {
  await updateDoc(doc(db, "cajas_sesiones", session.id), {
    estado: "cerrada",
    fechaCierre: serverTimestamp(),
    totalVentas: toNumber(summary.totalVentas),
    ingresos: toNumber(summary.ingresos),
    egresos: toNumber(summary.egresos),
    montoFinal: toNumber(summary.montoFinal)
  });
}

export async function listCashSessions() {
  const snap = await getDocs(query(collection(db, "cajas_sesiones"), orderBy("fechaApertura", "desc"), limit(50)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createCashMovement(payload) {
  const ref = await addDoc(collection(db, "movimientos_caja"), {
    sesionId: payload.sesionId,
    tipo: payload.tipo,
    concepto: payload.concepto || "",
    monto: toNumber(payload.monto),
    fecha: serverTimestamp(),
    usuarioId: payload.usuarioId || "",
    usuarioNombre: payload.usuarioNombre || ""
  });
  return ref;
}

export async function listCashMovements(sessionId) {
  const snap = await getDocs(query(
    collection(db, "movimientos_caja"),
    where("sesionId", "==", sessionId),
    orderBy("fecha", "desc"),
    limit(300)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
