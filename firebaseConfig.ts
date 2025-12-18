// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC2_fHw4pfCmD2JfUBTOpdgQGoxc5ouq2A",  // From google-services.json
    authDomain: "go-grow-smart.firebaseapp.com",        // project_id + .firebaseapp.com
    projectId: "go-grow-smart",                         // From google-services.json
    storageBucket: "go-grow-smart.firebasestorage.app", // From google-services.json
    messagingSenderId: "144030897819",                  // From App ID (before :android:)
    appId: "1:144030897819:android:d6a67aef85b159e12bd83e" // Full App ID
};

// Reuse the app if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

export { db, app };