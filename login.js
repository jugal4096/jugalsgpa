/* ================= FIREBASE ================= */
import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const startBtn = document.getElementById("startBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const popup = document.getElementById("loginPopup");
const popupLoginBtn = document.getElementById("popupLogin");
const popupLaterBtn = document.getElementById("popupLater");

/* ================= GOOGLE PROVIDER ================= */
const provider = new GoogleAuthProvider();

/* ===================================================
   🔐 AUTH STATE — SOURCE OF TRUTH
   =================================================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (
      snap.exists() &&
      snap.data().branch &&
      snap.data().scheme &&
      snap.data().admissionMode
    ) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("profileCompleted", "true");

      localStorage.setItem(
        "profile",
        JSON.stringify({
          name: snap.data().name,
          branch: snap.data().branch,
          scheme: snap.data().scheme,
          admissionMode: snap.data().admissionMode
        })
      );

      window.location.replace("dashboard.html");
    }
  } catch (err) {
    console.warn("Auth check failed", err);
  }
});

/* ================= GET STARTED ================= */
startBtn.addEventListener("click", () => {
  popup.style.display = "flex";
});

/* ================= LOGIN / REGISTER ================= */
loginBtn.addEventListener("click", openGoogleLogin);
registerBtn.addEventListener("click", openGoogleLogin);
popupLoginBtn.addEventListener("click", openGoogleLogin);

/* ================= MAYBE LATER ================= */
popupLaterBtn.addEventListener("click", () => {
  popup.style.display = "none";
  window.location.replace("select.html");
});

/* ================= GOOGLE LOGIN FLOW ================= */
async function openGoogleLogin() {
  popup.style.display = "none";

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // 🆕 First-time user
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email || "",
        branch: null,
        scheme: null,
        admissionMode: null,
        createdAt: new Date()
      });

      localStorage.setItem("profileCompleted", "false");
      window.location.replace("form.html");
      return;
    }

    // 🧭 Profile incomplete
    if (
      !snap.data().branch ||
      !snap.data().scheme ||
      !snap.data().admissionMode
    ) {
      localStorage.setItem("profileCompleted", "false");
      window.location.replace("form.html");
      return;
    }

    // ✅ Fully onboarded
    localStorage.setItem("profileCompleted", "true");

    localStorage.setItem(
      "profile",
      JSON.stringify({
        name: snap.data().name,
        branch: snap.data().branch,
        scheme: snap.data().scheme,
        admissionMode: snap.data().admissionMode
      })
    );

    window.location.replace("dashboard.html");

  } catch (err) {
    console.error("Google login failed:", err);
    alert("Login failed. Please try again.");
  }
}

/* ================= CLOSE POPUP ON BACKDROP ================= */
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
  }
});
