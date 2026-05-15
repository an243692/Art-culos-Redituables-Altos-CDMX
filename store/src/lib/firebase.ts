import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k",
    authDomain: "articulos-redituables.firebaseapp.com",
    databaseURL: "https://articulos-redituables-default-rtdb.firebaseio.com",
    projectId: "articulos-redituables",
    storageBucket: "articulos-redituables.firebasestorage.app",
    messagingSenderId: "281933269770",
    appId: "1:281933269770:web:f4c4c4d63e49b6f80ec8f3",
    measurementId: "G-LVF95RQ4Y7"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
let db: Firestore;
if (getApps().length > 1 || typeof window === 'undefined') {
  db = getFirestore(app);
} else {
  // Solo se puede inicializar Firestore con cache local en el cliente una única vez.
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    db = getFirestore(app);
  }
}

const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { db, app, auth, storage, googleProvider };
