// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCk_rMZeuOV2R51e3oNy_QHU45IXbE91bI",
//   authDomain: "attendance-b3168.firebaseapp.com",
//   projectId: "attendance-b3168",
//   storageBucket: "attendance-b3168.firebasestorage.app",
//   messagingSenderId: "191006788280",
//   appId: "1:191006788280:web:42d4ec87918008f015424d",
//   measurementId: "G-E7HMDCM59V"
// };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Only initialize Firebase on the client side to avoid SSR prerender errors.
// All Firebase calls happen inside useEffect / client components, so null is safe during SSR.
let app = null;
let auth = null;
let db = null;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db, app };
