import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if Firebase config is valid before initializing
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

// Initialize Firebase only if config is valid
let app;
let auth;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn(
    "Firebase configuration is incomplete. Authentication will not work.",
  );
}

// Export the Firebase instances
export { auth };
export default app;
