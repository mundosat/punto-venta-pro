// 🔥 Firebase SDKs (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
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

// 🔧 Configuración de tu proyecto Firebase
import { firebaseConfig } from "./firebase-config.js";

// 🚀 Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
const auth = getAuth(app);

// 🗄️ Firestore
const db = getFirestore(app);

// 📦 Exportar TODO para usar en el sistema
export {
  app,
  auth,
  db,

  // Firestore
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

  // Auth
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
};