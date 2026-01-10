import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const provider = new GoogleAuthProvider();

/* ================= ELEMENTS ================= */
const authButtons = $("authButtons");
const profileBadge = $("profileBadge");
const profileInitial = $("profileInitial");
const profilePanel = $("profilePanel");

const loginBtn = $("loginBtn");
const registerBtn = $("registerBtn");

const loginPopup = $("loginPopup");
const popupLoginBtn = $("popupLoginBtn");
const popupLaterBtn = $("popupLaterBtn");

const aiChatBtn = $("aiChatBtn");
const groupChatBtn = $("groupChatBtn");

const comingSoonPopup = $("comingSoonPopup");
const closeComingSoonBtn = $("closeComingSoon");

const changeProgramBtn = $("changeProgramBtn");
const editProfileBtn = $("editProfileBtn");
const logoutBtn = $("logoutBtn");

/* ================= INITIAL STATE ================= */
profilePanel.classList.add("hidden");
loginPopup.classList.add("hidden");
comingSoonPopup.classList.add("hidden");

/* ================= AUTH STATE ================= */
auth.onAuthStateChanged(user => {
  if (user) {
    authButtons.style.display = "none";
    profileBadge.classList.remove("hidden");
    profileInitial.textContent =
      user.displayName?.charAt(0).toUpperCase() || "U";

    localStorage.setItem("isLoggedIn", "true");
  } else {
    authButtons.style.display = "flex";
    profileBadge.classList.add("hidden");
    profilePanel.classList.add("hidden");

    localStorage.setItem("isLoggedIn", "false");
  }
});

/* ================= GOOGLE LOGIN ================= */
async function googleLogin() {
  try {
    await signInWithPopup(auth, provider);
    loginPopup.classList.add("hidden");
  } catch (err) {
    console.warn("Login cancelled");
  }
}

/* ================= LOGIN / REGISTER ================= */
loginBtn.onclick = googleLogin;
registerBtn.onclick = googleLogin;
popupLoginBtn.onclick = googleLogin;

/* ❌ Not for now → just close popup */
popupLaterBtn.onclick = () => {
  loginPopup.classList.add("hidden");
};

/* ================= PROFILE PANEL ================= */
profileBadge.onclick = e => {
  e.stopPropagation();
  profilePanel.classList.toggle("hidden");
};

document.addEventListener("click", () =>
  profilePanel.classList.add("hidden")
);

/* ================= PROFILE ACTIONS ================= */
changeProgramBtn.onclick = () => {
  profilePanel.classList.add("hidden");
  localStorage.removeItem("program");
  sessionStorage.removeItem("program");
  location.replace("select.html");
};

editProfileBtn.onclick = () =>
  location.href = "form.html";

logoutBtn.onclick = async () => {
  try { await signOut(auth); } catch {}
  localStorage.clear();
  sessionStorage.clear();
  location.replace("login.html");
};

/* ================= AI CHATBOT ================= */
aiChatBtn.onclick = () => {
  if (auth.currentUser) {
    location.href = "ai.html";
  } else {
    loginPopup.classList.remove("hidden");
  }
};

/* ================= GROUP CHAT ================= */
groupChatBtn.onclick = () =>
  comingSoonPopup.classList.remove("hidden");

closeComingSoonBtn.onclick = () =>
  comingSoonPopup.classList.add("hidden");
