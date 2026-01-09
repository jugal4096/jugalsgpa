import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const $ = id => document.getElementById(id);
const provider = new GoogleAuthProvider();

/* ================= ELEMENTS ================= */
const authButtons = $("authButtons");
const profileBadge = $("profileBadge");
const profileInitial = $("profileInitial");
const profilePanel = $("profilePanel");

const changeProgramBtn = $("changeProgramBtn");
const editProfileBtn = $("editProfileBtn");
const logoutBtn = $("logoutBtn");

const loginBtn = $("loginBtn");
const registerBtn = $("registerBtn");

const loginPopup = $("loginPopup");
const popupLoginBtn = $("popupLoginBtn");

const comingSoonPopup = $("comingSoonPopup");
const closeComingSoonBtn = $("closeComingSoon");

const aiChatBtn = $("aiChatBtn");
const groupChatBtn = $("groupChatBtn");

/* 🔹 SGPA button (anchor or div) */
const sgpaBtn = $("sgpaBtn");

/* ================= INITIAL STATE ================= */
profilePanel?.classList.add("hidden");
loginPopup?.classList.add("hidden");
comingSoonPopup?.classList.add("hidden");

/* ================= AUTH STATE ================= */
auth.onAuthStateChanged(user => {
  if (user) {
    authButtons.style.display = "none";
    profileBadge.classList.remove("hidden");
    profileInitial.textContent =
      user.displayName?.[0]?.toUpperCase() || "U";

    localStorage.setItem("isLoggedIn", "true");
  } else {
    authButtons.style.display = "flex";
    profileBadge.classList.add("hidden");
    profilePanel.classList.add("hidden");

    localStorage.setItem("isLoggedIn", "false");
  }
});

/* ================= GOOGLE SIGN-IN ================= */
async function googleLogin() {
  try {
    await signInWithPopup(auth, provider);
    loginPopup?.classList.add("hidden");
  } catch (err) {
    console.error("Google sign-in failed", err);
  }
}

/* 🔐 Login / Register → Google popup */
loginBtn.onclick = googleLogin;
registerBtn.onclick = googleLogin;
popupLoginBtn && (popupLoginBtn.onclick = googleLogin);

/* ================= PROFILE PANEL ================= */
profileBadge.onclick = e => {
  e.stopPropagation();
  profilePanel.classList.toggle("hidden");
};

document.addEventListener("click", () =>
  profilePanel.classList.add("hidden")
);

/* ================= CHANGE COURSE ================= */
changeProgramBtn.onclick = () => {
  profilePanel.classList.add("hidden");

  localStorage.removeItem("program");
  sessionStorage.removeItem("program");

  sessionStorage.setItem("redirectAfterProgramChange", "true");

  location.replace("select.html");
};

/* ================= EDIT PROFILE ================= */
editProfileBtn.onclick = () =>
  location.href = "form.html";

/* ================= LOGOUT ================= */
logoutBtn.onclick = async () => {
  try { await signOut(auth); } catch {}
  localStorage.clear();
  sessionStorage.clear();
  location.replace("login.html");
};

/* ================= AI / GROUP CHAT ================= */
aiChatBtn.onclick = () => {
  if (auth.currentUser) {
    location.href = "ai.html";
  } else {
    googleLogin();
  }
};

groupChatBtn.onclick = () =>
  comingSoonPopup.classList.remove("hidden");

closeComingSoonBtn &&
  (closeComingSoonBtn.onclick = () =>
    comingSoonPopup.classList.add("hidden"));

/* =================================================
   🎯 SGPA ROUTING BASED ON COURSE (FINAL FIX)
   ================================================= */
if (sgpaBtn) {
  sgpaBtn.addEventListener("click", e => {
    e.preventDefault();

    const program =
      localStorage.getItem("program") ||
      sessionStorage.getItem("program");

    console.log("SGPA clicked → program:", program);

    if (program === "MCA") {
      window.location.href = "mca.html";
    } else {
      window.location.href = "index.html";
    }
  });
}
