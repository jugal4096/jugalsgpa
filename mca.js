/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= CSV ================= */
const MCA_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBScbDNIhfmJbX1vbZHjhaZAumvPpAhhOn3jVIl22aRO_5Oo_n35VJV7TllnTEbTgImZXgrp69QkY1/pub?output=csv";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);

function safeOn(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}

function getValue(row, key) {
  const found = Object.keys(row).find(
    k => k.replace(/\s+/g, "").toLowerCase() === key.toLowerCase()
  );
  return found ? row[found] : null;
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

/* ================= SEMESTER ================= */
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
      complete: res => {
        sheetCache = res.data || [];
        resolve(sheetCache);
      }
    });
  });
}

/* ================= ROW ================= */
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
  $("subjects")?.querySelector("tbody")?.appendChild(tr);
}

/* ================= SUBJECT LOAD ================= */
async function loadSubjects() {
  const tbody = $("subjects")?.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const sem = String($("semester")?.value || "");
  const data = await loadSheetOnce();

  data.forEach(row => {
    if (
      String(getValue(row, "semester")).trim() === sem &&
      getValue(row, "subject") &&
      !isNaN(getValue(row, "credits"))
    ) {
      createRow(
        getValue(row, "subject"),
        Number(getValue(row, "credits"))
      );
    }
  });

  calculateSGPA();
}

/* ================= MANUAL SUBJECT ================= */
function addManualSubject() {
  const tbody = $("subjects")?.querySelector("tbody");
  if (!tbody) return;

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
  tbody.appendChild(tr);
}

/* ================= SGPA ================= */
function calculateSGPA() {
  let creditsSum = 0;
  let pointsSum = 0;

  document.querySelectorAll("#subjects tbody tr").forEach(row => {
    const credits =
      parseFloat(
        row.children[1].querySelector("input")?.value ||
        row.children[1].textContent
      );

    const grade = parseFloat(row.querySelector("select")?.value);

    if (!isNaN(credits) && credits > 0 && !isNaN(grade)) {
      creditsSum += credits;
      pointsSum += credits * grade;
    }
  });

  const sgpa = creditsSum
    ? (pointsSum / creditsSum).toFixed(2)
    : "0.00";

  if ($("results")) $("results").textContent = `SGPA: ${sgpa}`;
  saveSGPA(sgpa, $("semester")?.value);
}

/* ================= SAVE ================= */
function saveSGPA(sgpa, semester) {
  const record = { semester, sgpa, time: Date.now() };

  if (localStorage.getItem("isLoggedIn") === "true") {
    const arr = JSON.parse(localStorage.getItem("mcaSgpaData")) || [];
    arr.push(record);
    localStorage.setItem("mcaSgpaData", JSON.stringify(arr));
  } else {
    sessionStorage.setItem("mcaLastSGPA", JSON.stringify(record));
  }
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (user) {
    $("authButtons")?.classList.add("hidden");
    $("profileBadge")?.classList.remove("hidden");
    $("profileInitial").textContent =
      user.displayName?.charAt(0).toUpperCase() || "U";
    localStorage.setItem("isLoggedIn", "true");
  } else {
    $("authButtons")?.classList.remove("hidden");
    $("profileBadge")?.classList.add("hidden");
    localStorage.setItem("isLoggedIn", "false");
  }
});

/* ================= EVENTS ================= */
safeOn($("semester"), "change", loadSubjects);
safeOn($("add-subject"), "click", addManualSubject);
safeOn($("subjects"), "change", calculateSGPA);

safeOn($("subjects"), "click", e => {
  if (e.target.classList.contains("drop-btn")) {
    e.target.closest("tr").remove();
    calculateSGPA();
  }
});

safeOn($("profileBadge"), "click", e => {
  e.stopPropagation();
  $("profilePanel")?.classList.toggle("hidden");
});

safeOn(document, "click", () =>
  $("profilePanel")?.classList.add("hidden")
);

safeOn($("logoutBtn"), "click", async () => {
  localStorage.clear();
  sessionStorage.clear();
  if (auth.currentUser) await signOut(auth);
  window.location.replace("login.html");
});

safeOn($("editProfileBtn"), "click", () =>
  window.location.href = "form.html"
);

safeOn($("loginBtn"), "click", () =>
  window.location.href = "login.html"
);

safeOn($("registerBtn"), "click", () =>
  window.location.href = "login.html"
);

/* ================= INIT ================= */
populateSemesterDropdown();
loadSubjects();
