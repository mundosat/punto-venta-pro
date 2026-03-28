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

const MAIN_APP_NAME = "[DEFAULT]";
const SECONDARY_APP_NAME = "pv-admin-create-user";

const app = getApps().some(a => a.name === MAIN_APP_NAME)
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

function getSecondaryAuth() {
  const secondaryApp = getApps().some(a => a.name === SECONDARY_APP_NAME)
    ? getApp(SECONDARY_APP_NAME)
    : initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

export async function createManagedUser({ email, password, nombre, rol, activo }) {
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const user = cred.user;

  await setDoc(doc(db, "usuarios", user.uid), {
    nombre,
    email,
    rol,
    activo,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  }, { merge: true });

  await signOut(secondaryAuth);
  return user;
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
