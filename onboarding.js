import { auth, db } from "./firebase.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= ELEMENTS ================= */
const form = document.getElementById("profileForm");

const authButtons = document.getElementById("authButtons");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const userBadge = document.getElementById("userBadge");
const userInitial = document.getElementById("userInitial");
const badgeMenu = document.querySelector(".badge-menu");

const changeProgramBtn = document.getElementById("changeProgramBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* ================= GOOGLE PROVIDER ================= */
const provider = new GoogleAuthProvider();

/* ================= AUTH UI STATE ================= */
auth.onAuthStateChanged(user => {
  if (user) {
    authButtons.style.display = "none";
    userBadge.classList.remove("hidden");
    userInitial.textContent =
      user.email?.charAt(0).toUpperCase() || "U";
  } else {
    authButtons.style.display = "flex";
    userBadge.classList.add("hidden");
  }
});

/* ================= GOOGLE LOGIN ================= */
async function googleLogin() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Google sign-in failed", err);
  }
}

/* 🔐 Login / Register → Google Popup */
loginBtn.onclick = googleLogin;
registerBtn.onclick = googleLogin;

/* ================= PREFILL FORM ================= */
const savedProfile =
  JSON.parse(localStorage.getItem("profile")) ||
  JSON.parse(sessionStorage.getItem("profile"));

if (savedProfile) {
  document.getElementById("admissionMode").value =
    savedProfile.admissionMode || "";
  document.getElementById("branch").value =
    savedProfile.branch || "";
  document.getElementById("scheme").value =
    savedProfile.scheme || "";
}

/* ================= FORM SUBMIT ================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const admissionMode = document.getElementById("admissionMode").value;
  const branch = document.getElementById("branch").value;
  const scheme = document.getElementById("scheme").value;

  const profileData = {
    admissionMode,
    branch,
    scheme
  };

  const user = auth.currentUser;

  /* ===== LOGGED-IN USER ===== */
  if (user) {
    await setDoc(
      doc(db, "users", user.uid),
      profileData,
      { merge: true }
    );

    localStorage.setItem("profile", JSON.stringify(profileData));
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("isLoggedIn", "true");

    window.location.replace("dashboard.html");
    return;
  }

  /* ===== GUEST USER ===== */
  sessionStorage.setItem("profile", JSON.stringify(profileData));
  sessionStorage.setItem("profileCompleted", "true");

  window.location.replace("dashboard.html");
});

/* ================= BADGE MENU ================= */
userBadge.addEventListener("click", () => {
  badgeMenu.style.display =
    badgeMenu.style.display === "block" ? "none" : "block";
});

/* ================= CHANGE PROGRAM ================= */
changeProgramBtn.addEventListener("click", () => {
  badgeMenu.style.display = "none";

  localStorage.removeItem("program");
  sessionStorage.removeItem("program");

  window.location.replace("select.html");
});

/* ================= LOGOUT ================= */
logoutBtn.addEventListener("click", async () => {
  badgeMenu.style.display = "none";

  localStorage.clear();
  sessionStorage.clear();

  if (auth.currentUser) {
    await signOut(auth);
  }

  window.location.replace("login.html");
});

/* ================= CLOSE DROPDOWN ON OUTSIDE CLICK ================= */
document.addEventListener("click", (e) => {
  if (!userBadge.contains(e.target)) {
    badgeMenu.style.display = "none";
  }
});

