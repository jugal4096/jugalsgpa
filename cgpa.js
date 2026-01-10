/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const provider = new GoogleAuthProvider();

/* ================= SAFE ELEMENTS ================= */
const authButtons = $("authButtons");
const profileBadge = $("profileBadge");
const profileInitial = $("profileInitial");
const profilePanel = $("profilePanel");

const loginBtn = $("loginBtn");
const registerBtn = $("registerBtn");

const loginPopup = $("loginPopup");
const popupLoginBtn = $("popupLoginBtn");
const popupLaterBtn = $("popupLaterBtn");

const changeProgramBtn = $("changeProgramBtn");
const editProfileBtn = $("editProfileBtn");
const logoutBtn = $("logoutBtn");

const sgpaBtn = $("sgpaBtn");

/* ================= INITIAL STATE ================= */
profilePanel && profilePanel.classList.add("hidden");
loginPopup && loginPopup.classList.add("hidden");

/* ================= AUTH STATE ================= */
auth.onAuthStateChanged(user => {
  if (!authButtons || !profileBadge) return;

  if (user) {
    authButtons.style.display = "none";
    profileBadge.classList.remove("hidden");
    if (profileInitial) {
      profileInitial.textContent =
        user.displayName?.charAt(0).toUpperCase() || "U";
    }
    localStorage.setItem("isLoggedIn", "true");
  } else {
    authButtons.style.display = "flex";
    profileBadge.classList.add("hidden");
    profilePanel && profilePanel.classList.add("hidden");
    localStorage.setItem("isLoggedIn", "false");
  }
});

/* ================= GOOGLE LOGIN ================= */
async function googleLogin() {
  try {
    await signInWithPopup(auth, provider);
    loginPopup && loginPopup.classList.add("hidden");
  } catch {
    console.warn("Login cancelled");
  }
}

/* ================= LOGIN / REGISTER ================= */
loginBtn && (loginBtn.onclick = googleLogin);
registerBtn && (registerBtn.onclick = googleLogin);
popupLoginBtn && (popupLoginBtn.onclick = googleLogin);

popupLaterBtn &&
  (popupLaterBtn.onclick = () =>
    loginPopup.classList.add("hidden"));

/* ================= PROFILE PANEL ================= */
profileBadge &&
  (profileBadge.onclick = e => {
    e.stopPropagation();
    profilePanel.classList.toggle("hidden");
  });

document.addEventListener("click", () =>
  profilePanel && profilePanel.classList.add("hidden")
);

/* ================= PROFILE ACTIONS ================= */
changeProgramBtn &&
  (changeProgramBtn.onclick = () => {
    localStorage.removeItem("program");
    sessionStorage.removeItem("program");
    location.replace("select.html");
  });

editProfileBtn &&
  (editProfileBtn.onclick = () =>
    location.href = "form.html");

logoutBtn &&
  (logoutBtn.onclick = async () => {
    try { await signOut(auth); } catch {}
    localStorage.clear();
    sessionStorage.clear();
    location.replace("login.html");
  });

/* =================================================
   🎯 SGPA ROUTING (THIS IS THE FIX YOU WANT)
   ================================================= */
if (sgpaBtn) {
  sgpaBtn.addEventListener("click", e => {
    e.preventDefault();

    const program =
      localStorage.getItem("program") ||
      sessionStorage.getItem("program") ||
      "BTECH";

    if (program === "MCA") {
      window.location.href = "mca.html";
    } else {
      window.location.href = "sgpa.html";
    }
  });
}