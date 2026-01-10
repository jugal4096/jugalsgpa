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

/* ================= PROGRAM ================= */
const program =
  localStorage.getItem("program") ||
  sessionStorage.getItem("program") ||
  "BTECH";

/* ================= PROFILE ================= */
const profile =
  JSON.parse(localStorage.getItem("profile")) ||
  JSON.parse(sessionStorage.getItem("profile")) ||
  { admissionMode: "Regular" };

/* ================= AUTH UI ================= */
auth.onAuthStateChanged(user => {
  if (!authButtons || !profileBadge) return;

  if (user) {
    authButtons.style.display = "none";
    profileBadge.classList.remove("hidden");
    profileInitial.textContent =
      user.displayName?.[0]?.toUpperCase() || "U";
  } else {
    authButtons.style.display = "flex";
    profileBadge.classList.add("hidden");
    profilePanel.classList.add("hidden");
  }
});

const authButtons = $("authButtons");
const profileBadge = $("profileBadge");
const profileInitial = $("profileInitial");
const profilePanel = $("profilePanel");

$("loginBtn")?.addEventListener("click", () =>
  signInWithPopup(auth, provider)
);

$("registerBtn")?.addEventListener("click", () =>
  signInWithPopup(auth, provider)
);

$("logoutBtn")?.addEventListener("click", async () => {
  try { await signOut(auth); } catch {}
  localStorage.clear();
  sessionStorage.clear();
  location.replace("login.html");
});

$("editProfileBtn")?.addEventListener("click", () =>
  location.href = "form.html"
);

profileBadge?.addEventListener("click", e => {
  e.stopPropagation();
  profilePanel.classList.toggle("hidden");
});

document.addEventListener("click", () =>
  profilePanel?.classList.add("hidden")
);

/* ================= SEMESTER RANGE ================= */
function getSemesterRange() {
  if (program === "MCA" || program === "MTECH") {
    return { start: 1, end: 4 };
  }

  if (profile.admissionMode === "Direct Second Year")
    return { start: 3, end: 8 };

  if (profile.admissionMode === "Direct Third Year")
    return { start: 5, end: 8 };

  return { start: 1, end: 8 };
}

const { start, end } = getSemesterRange();

/* ================= CGPA TABLE ================= */
const tbody = document.querySelector("#cgpa-table tbody");

/* ================= NEXT SEMESTER ================= */
function getNextSemester() {
  const used = [...tbody.querySelectorAll("tr")].map(
    r => Number(r.dataset.sem)
  );

  for (let s = start; s <= end; s++) {
    if (!used.includes(s)) return s;
  }
  return null;
}

/* ================= ADD ROW ================= */
function addSemesterRow(sem) {
  const tr = document.createElement("tr");
  tr.dataset.sem = sem;

  tr.innerHTML = `
    <td>Semester ${sem}</td>
    <td><input type="number" min="1" /></td>
    <td><input type="number" min="0" max="10" step="0.01" /></td>
    <td><button class="drop-btn">✖</button></td>
  `;

  tbody.appendChild(tr);
}

/* ================= LIMIT POPUP ================= */
const limitPopup = $("limitPopup");
const closePopup = $("closePopup");

function showLimitPopup() {
  const msg = limitPopup.querySelector("p");

  if (program === "MCA" || program === "MTECH") {
    msg.innerHTML =
      "Hey dude 😄<br><b>MCA ends at 4 semesters only!</b>";
  } else {
    msg.innerHTML =
      "Hey dude 😅<br><b>B.Tech ends at 8 semesters only!</b>";
  }

  limitPopup.classList.remove("hidden");
}

closePopup?.addEventListener("click", () =>
  limitPopup.classList.add("hidden")
);

/* ================= ADD SEM BUTTON ================= */
$("add-sem").addEventListener("click", () => {
  const next = getNextSemester();

  if (!next) {
    showLimitPopup();
    return;
  }

  addSemesterRow(next);
});

/* ================= CGPA CALC ================= */
function calculateCGPA() {
  let totalCredits = 0;
  let totalPoints = 0;

  tbody.querySelectorAll("tr").forEach(row => {
    const credits = parseFloat(row.children[1].querySelector("input").value);
    const sgpa = parseFloat(row.children[2].querySelector("input").value);

    if (credits > 0 && sgpa >= 0) {
      totalCredits += credits;
      totalPoints += credits * sgpa;
    }
  });

  $("cgpa-result").textContent =
    "CGPA: " +
    (totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00");
}

tbody.addEventListener("input", calculateCGPA);

tbody.addEventListener("click", e => {
  if (e.target.classList.contains("drop-btn")) {
    e.target.closest("tr").remove();
    calculateCGPA();
  }
});

/* ================= INIT ================= */
addSemesterRow(start);

/* ================= GO TO SGPA ================= */
$("goToSgpaBtn").addEventListener("click", e => {
  e.preventDefault();

  if (program === "MCA") {
    location.href = "mca.html";
  } else {
    location.href = "sgpa.html";
  }
});