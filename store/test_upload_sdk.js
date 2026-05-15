import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k",
    authDomain: "articulos-redituables.firebaseapp.com",
    databaseURL: "https://articulos-redituables-default-rtdb.firebaseio.com",
    projectId: "articulos-redituables",
    storageBucket: "articulos-redituables.firebasestorage.app",
    messagingSenderId: "281933269770",
    appId: "1:281933269770:web:f4c4c4d63e49b6f80ec8f3"
};

async function test() {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const storageRef = ref(storage, 'test_cors.txt');
  try {
    const res = await uploadString(storageRef, 'data:text/plain;base64,aGVsbG8=', 'data_url');
    console.log('Upload success');
    const url = await getDownloadURL(storageRef);
    console.log('URL:', url);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
