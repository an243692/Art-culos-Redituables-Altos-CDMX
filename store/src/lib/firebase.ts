import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBZdMTsbZ9lMPhHAUrqNW3d86WEc8gLdrI",
    authDomain: "articulos-redituables-altos.firebaseapp.com",
    projectId: "articulos-redituables-altos",
    storageBucket: "articulos-redituables-altos.firebasestorage.app",
    messagingSenderId: "38804963664",
    appId: "1:38804963664:web:335c693d68f3bb4eceec55",
    measurementId: "G-J60MQEZXRQ"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, app, auth, googleProvider };
