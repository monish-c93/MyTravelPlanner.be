import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMWD-9UzWswFjTwBxLyQTD2dJzabKPUVE",
  authDomain: "travel-planner-app-57fba.firebaseapp.com",
  projectId: "travel-planner-app-57fba",
  storageBucket: "travel-planner-app-57fba.firebasestorage.app",
  messagingSenderId: "723025635508",
  appId: "1:723025635508:web:5719f16ebc041486678fe1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
