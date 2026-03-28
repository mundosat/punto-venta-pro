// Firebase SDKs (CDN)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function createUserByAdmin({ email, password, nombre, rol, activo }) {
  const secondaryName = `admin-create-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      email,
      rol,
      activo,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    }, { merge: true });
    await signOut(secondaryAuth);
    await secondaryApp.delete();
    return user;
  } catch (error) {
    try { await secondaryApp.delete(); } catch {}
    throw error;
  }
}

export {
  app,
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
};
