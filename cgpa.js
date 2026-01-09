/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);

/* ================= PROGRAM ================= */
const program =
  localStorage.getItem("program") ||
  sessionStorage.getItem("program") ||
  "BTECH"; // backward compatibility

/* ================= PROFILE ================= */
function loadProfile() {
  return (
    JSON.parse(localStorage.getItem("profile")) ||
    JSON.parse(sessionStorage.getItem("profile"))
  );
}

const profile = loadProfile() || { admissionMode: "Regular" };

/* ================= AUTH UI ================= */
const provider = new GoogleAuthProvider();

auth.onAuthStateChanged(user => {
  if (user) {
    $("authButtons").style.display = "none";
    $("profileBadge").classList.remove("hidden");
    $("profileInitial").textContent =
      user.displayName?.charAt(0).toUpperCase() || "U";
  } else {
    $("authButtons").style.display = "flex";
    $("profileBadge").classList.add("hidden");
  }
});

$("loginBtn").onclick = () => signInWithPopup(auth, provider);
$("registerBtn").onclick = () => signInWithPopup(auth, provider);

$("logoutBtn").onclick = async () => {
  await signOut(auth);
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("login.html");
};

$("editProfileBtn").onclick = () =>
  window.location.href = "form.html";

/* ================= SEMESTER RANGE ================= */
function getSemesterRange() {

  // MCA / MTECH → max 4 semesters
  if (program === "MCA" || program === "MTECH") {
    return { start: 1, end: 4 };
  }

  // B.Tech logic (unchanged)
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
    <td><input type="number" min="1" placeholder="Credits"></td>
    <td><input type="number" min="0" max="10" step="0.01" placeholder="SGPA"></td>
    <td><button class="drop-btn">✖</button></td>
  `;

  tbody.appendChild(tr);
}

/* ================= POPUP ================= */
function showLimitPopup() {
  const popup = $("limitPopup");
  const msg = popup.querySelector("p");

  if (program === "MCA" || program === "MTECH") {
    msg.textContent =
      "Hey dude 😄 Does 3rd year exist too? MCA / M.Tech ends at 4th semester only.";
  } else {
    msg.textContent =
      "You have already added all available semesters.";
  }

  popup.classList.remove("hidden");
}

$("closePopup").onclick = () =>
  $("limitPopup").classList.add("hidden");

/* ================= ADD SEM BUTTON ================= */
$("add-sem").addEventListener("click", () => {
  const nextSem = getNextSemester();

  if (!nextSem) {
    showLimitPopup();
    return;
  }

  addSemesterRow(nextSem);
});

/* ================= CGPA CALC ================= */
function calculateCGPA() {
  let totalCredits = 0;
  let totalPoints = 0;

  tbody.querySelectorAll("tr").forEach(row => {
    const credits =
      parseFloat(row.children[1].querySelector("input").value);
    const sgpa =
      parseFloat(row.children[2].querySelector("input").value);

    if (credits > 0 && sgpa >= 0) {
      totalCredits += credits;
      totalPoints += credits * sgpa;
    }
  });

  const cgpa = totalCredits
    ? (totalPoints / totalCredits).toFixed(2)
    : "0.00";

  $("cgpa-result").textContent = `CGPA: ${cgpa}`;
}

/* ================= EVENTS ================= */
tbody.addEventListener("input", calculateCGPA);

tbody.addEventListener("click", e => {
  if (e.target.classList.contains("drop-btn")) {
    e.target.closest("tr").remove();
    calculateCGPA();
  }
});

/* ================= INIT ================= */
addSemesterRow(start);
