// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Auth modülünü ekliyoruz
import { getAuth } from "firebase/auth";

// --- BURAYI KENDİ BİLGİLERİNİZLE DOLDURUN ---
const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// Auth servisini dışarı aktarıyoruz
export const auth = getAuth(app);