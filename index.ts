import { initializeApp, getApps, getApp } from "firebase/app";

// Import the specific services we need (Login and Database)
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the keys we set up in config.ts
import { firebaseConfig } from "./config.ts";

// This line checks if Firebase is already running. 
// If it is, we use the existing one; if not, we start a new one.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);         // For Login
export const db = getFirestore(app);      // For the Database
export const googleProvider = new GoogleAuthProvider(); // For the "Sign in with Google" button

export default app;