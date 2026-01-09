// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb9fF3mJNrIwNXWNYHKZm_prNkG4vAzMc",
  authDomain: "sgpa-calculator-website.firebaseapp.com",
  projectId: "sgpa-calculator-website",
  storageBucket: "sgpa-calculator-website.appspot.com",
  messagingSenderId: "647200677370",
  appId: "1:647200677370:web:f0186437b65f70a2081843"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// persist login across refresh & redirect
setPersistence(auth, browserLocalPersistence);
