/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= MCA CSV ================= */
const MCA_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBScbDNIhfmJbX1vbZHjhaZAumvPpAhhOn3jVIl22aRO_5Oo_n35VJV7TllnTEbTgImZXgrp69QkY1/pub?output=csv";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const provider = new GoogleAuthProvider();

/* ================= SAFE CSV ACCESS ================= */
function getValue(row, key) {
  const k = Object.keys(row).find(
    x => x.replace(/\s+/g, "").toLowerCase() === key.toLowerCase()
  );
  return k ? row[k] : null;
}

/* ================= PROGRAM GUARD ================= */
const program =
  localStorage.getItem("program") ||
  sessionStorage.getItem("program");

if (program !== "MCA") {
  location.replace("select.html");
}

/* ================= STATE ================= */
let sheetCache = null;

/* ================= SEMESTERS ================= */
function populateSemesterDropdown() {
  const select = $("semester");
  if (!select) return;

  select.innerHTML = "";
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
      complete: r => {
        sheetCache = r.data;
        resolve(sheetCache);
      }
    });
  });
}

/* ================= SUBJECT ROW ================= */
function createRow(subject, credits) {
  const tbody = $("subjects")?.querySelector("tbody");
  if (!tbody) return;

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
  tbody.appendChild(tr);
}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects() {
  const tbody = $("subjects")?.querySelector("tbody");
  const semSelect = $("semester");
  if (!tbody || !semSelect) return;

  tbody.innerHTML = "";

  const semester = String(semSelect.value);
  const data = await loadSheetOnce();

  data.forEach(row => {
    if (
      String(getValue(row, "semester")).trim() === semester
    ) {
      const subject = getValue(row, "subject");
      const credits = Number(getValue(row, "credits"));
      if (subject && !isNaN(credits)) {
        createRow(subject, credits);
      }
    }
  });

  calculateSGPA();
}

/* ================= SGPA ================= */
function calculateSGPA() {
  let tc = 0, tp = 0;

  document.querySelectorAll("#subjects tbody tr").forEach(r => {
    const c = parseFloat(
      r.children[1].querySelector("input")?.value ||
      r.children[1].textContent
    );
    const g = parseFloat(r.querySelector("select")?.value);

    if (c > 0 && g >= 0) {
      tc += c;
      tp += c * g;
    }
  });

  const sgpa = tc ? (tp / tc).toFixed(2) : "0.00";
  $("results").textContent = "SGPA: " + sgpa;
}

/* ================= GOOGLE LOGIN ================= */
async function googleLogin() {
  try {
    await signInWithPopup(auth, provider);
  } catch {
    console.warn("Login cancelled");
  }
}

/* ================= AUTH UI ================= */
auth.onAuthStateChanged(user => {
  const authBtns = $("authButtons");
  const badge = $("profileBadge");
  const initial = $("profileInitial");

  if (!authBtns || !badge) return;

  if (user) {
    authBtns.style.display = "none";
    badge.classList.remove("hidden");
    if (initial) {
      initial.textContent = user.displayName?.[0]?.toUpperCase() || "U";
    }
  } else {
    authBtns.style.display = "flex";
    badge.classList.add("hidden");
  }
});

/* ================= EVENTS ================= */
$("semester")?.addEventListener("change", loadSubjects);
$("add-subject")?.addEventListener("click", () => {
  createRow("", "");
});

$("subjects")?.addEventListener("change", calculateSGPA);
$("subjects")?.addEventListener("click", e => {
  if (e.target.classList.contains("drop-btn")) {
    e.target.closest("tr").remove();
    calculateSGPA();
  }
});

$("loginBtn") && ($("loginBtn").onclick = googleLogin);
$("registerBtn") && ($("registerBtn").onclick = googleLogin);

$("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  sessionStorage.clear();
  location.replace("login.html");
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  populateSemesterDropdown();
  loadSubjects();
});