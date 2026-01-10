/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import { signOut }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= MCA CSV ================= */
const MCA_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBScbDNIhfmJbX1vbZHjhaZAumvPpAhhOn3jVIl22aRO_5Oo_n35VJV7TllnTEbTgImZXgrp69QkY1/pub?output=csv";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);

/* Normalize header access (VERY IMPORTANT) */
function getValue(row, key) {
  const foundKey = Object.keys(row).find(
    k => k.replace(/\s+/g, "").toLowerCase() === key.toLowerCase()
  );
  return foundKey ? row[foundKey] : null;
}

/* ================= PROGRAM GUARD ================= */
const program =
  localStorage.getItem("program") ||
  sessionStorage.getItem("program");

if (program !== "MCA") {
  window.location.replace("select.html");
}

/* ================= STATE ================= */
let sheetCache = null;

/* ================= SEMESTERS ================= */
function populateSemesterDropdown() {
  const select = $("semester");
  select.innerHTML = "";

  // MCA → 1 to 6
  for (let i = 1; i <= 4; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Semester ${i}`;
    select.appendChild(opt);
  }
}

/* ================= LOAD CSV ================= */
function loadSheetOnce() {
  return new Promise(resolve => {
    if (sheetCache) return resolve(sheetCache);

    Papa.parse(MCA_SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: res => {
        sheetCache = res.data;
        resolve(sheetCache);
      }
    });
  });
}

/* ================= SUBJECT ROW ================= */
function createRow(subject, credits) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${subject}</td>
    <td>${credits}</td>
    <td>
      <select>
        <option value="10">A++</option>
        <option value="9">A+</option>
        <option value="8">A</option>
        <option value="7">B+</option>
        <option value="6">B</option>
        <option value="5">C+</option>
        <option value="4">C</option>
        <option value="0">D</option>
      </select>
    </td>
    <td><button class="drop-btn">❌</button></td>
  `;
  $("subjects").querySelector("tbody").appendChild(tr);
}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects() {
  const tbody = $("subjects").querySelector("tbody");
  tbody.innerHTML = "";

  const selectedSemester = String($("semester").value);
  const data = await loadSheetOnce();

  data.forEach(row => {
    const sem = String(getValue(row, "semester")).trim();
    const subject = getValue(row, "subject");
    const credits = Number(getValue(row, "credits"));

    if (sem === selectedSemester && subject && !isNaN(credits)) {
      createRow(subject, credits);
    }
  });

  calculateSGPA();
}

/* ================= MANUAL SUBJECT ================= */
function addManualSubject() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input placeholder="Subject Name"></td>
    <td><input type="number" min="0"></td>
    <td>
      <select>
        <option value="10">A++</option>
        <option value="9">A+</option>
        <option value="8">A</option>
        <option value="7">B+</option>
        <option value="6">B</option>
        <option value="5">C+</option>
        <option value="4">C</option>
        <option value="0">D</option>
      </select>
    </td>
    <td><button class="drop-btn">❌</button></td>
  `;
  $("subjects").querySelector("tbody").appendChild(tr);
}

/* ================= SGPA ================= */
function calculateSGPA() {
  let totalCredits = 0;
  let totalPoints = 0;

  document.querySelectorAll("#subjects tbody tr").forEach(row => {
    const credits =
      parseFloat(
        row.children[1].querySelector("input")?.value ||
        row.children[1].textContent
      );

    const grade = parseFloat(row.querySelector("select")?.value);

    if (!isNaN(credits) && credits > 0 && !isNaN(grade)) {
      totalCredits += credits;
      totalPoints += credits * grade;
    }
  });

  const sgpa = totalCredits
    ? (totalPoints / totalCredits).toFixed(2)
    : "0.00";

  $("results").textContent = "SGPA: " + sgpa;

  saveSGPA(sgpa, $("semester").value);
}

/* ================= SAVE SGPA (MCA ONLY) ================= */
function saveSGPA(sgpa, semester) {
  const record = { semester, sgpa, time: Date.now() };
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (loggedIn) {
    const arr =
      JSON.parse(localStorage.getItem("mcaSgpaData")) || [];
    arr.push(record);
    localStorage.setItem("mcaSgpaData", JSON.stringify(arr));
  } else {
    sessionStorage.setItem("mcaLastSGPA", JSON.stringify(record));
  }
}

/* ================= AUTH UI ================= */
const authButtons = $("authButtons");
const profileBadge = $("profileBadge");
const profileInitial = $("profileInitial");

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
    localStorage.setItem("isLoggedIn", "false");
  }
});

/* ================= EVENTS ================= */
$("semester").addEventListener("change", loadSubjects);
$("add-subject").addEventListener("click", addManualSubject);

$("subjects").addEventListener("change", calculateSGPA);
$("subjects").addEventListener("click", e => {
  if (e.target.classList.contains("drop-btn")) {
    e.target.closest("tr").remove();
    calculateSGPA();
  }
});

profileBadge.addEventListener("click", e => {
  e.stopPropagation();
  $("profilePanel").classList.toggle("hidden");
});

document.addEventListener("click", () =>
  $("profilePanel").classList.add("hidden")
);

$("logoutBtn").addEventListener("click", async () => {
  localStorage.clear();
  sessionStorage.clear();
  if (auth.currentUser) await signOut(auth);
  window.location.replace("login.html");
});

$("editProfileBtn").onclick = () =>
  window.location.href = "form.html";

$("loginBtn").onclick = () =>
  window.location.href = "login.html";

$("registerBtn").onclick = () =>
  window.location.href = "login.html";

/* ================= INIT ================= */
populateSemesterDropdown();
loadSubjects();
