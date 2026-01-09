/* ================= FIREBASE ================= */
import { auth } from "./firebase.js";
import { signOut }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= CSV ================= */
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbu6XLHVIEHULa1bRWT87qvcTVXsdpqDwHFgKq7R-mRRjg24EVXOrGlX1C2ZoBURCj18Qp5GkjHHQ4/pub?output=csv";

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelector(sel);
const normalize = v => String(v || "").replace(/\s+/g, "").toUpperCase();

/* ================= STATE ================= */
let profile = null;
let sheetCache = null;

/* ================= PROFILE ================= */
function loadProfile() {
  return (
    JSON.parse(localStorage.getItem("profile")) ||
    JSON.parse(sessionStorage.getItem("profile"))
  );
}

function getGuestProfile() {
  return {
    admissionMode: "Regular",
    branch: "IT",
    scheme: "NEP"
  };
}

/* ================= SEMESTER LOGIC ================= */
function getValidSemesters(mode) {
  if (mode === "Direct Second Year") return [3,4,5,6,7,8];
  if (mode === "Direct Third Year") return [5,6,7,8];
  return [1,2,3,4,5,6,7,8];
}

function populateSemesterDropdown() {
  const select = $("semester");
  select.innerHTML = "";

  getValidSemesters(profile.admissionMode).forEach(sem => {
    const opt = document.createElement("option");
    opt.value = sem;
    opt.textContent = `Semester ${sem}`;
    select.appendChild(opt);
  });
}

/* ================= LOAD CSV ================= */
function loadSheetOnce() {
  return new Promise(resolve => {
    if (sheetCache) return resolve(sheetCache);

    Papa.parse(SHEET_CSV_URL, {
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
function createRow({ name, credits }) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${name}</td>
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
  $$("#subjects tbody").appendChild(tr);
}

/* ================= LOAD SUBJECTS ================= */
async function loadSubjects() {
  const tbody = $$("#subjects tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const semester = $("semester").value;
  const data = await loadSheetOnce();

  data.forEach(row => {
    if (
      normalize(row.Branch) === normalize(profile.branch) &&
      normalize(row.Scheme) === normalize(profile.scheme) &&
      String(row.semester).trim() === semester
    ) {
      createRow({
        name: row.Subject,
        credits: Number(row.credits)
      });
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
  $$("#subjects tbody").appendChild(tr);
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

/* ================= SAVE SGPA ================= */
function saveSGPA(sgpa, semester) {
  const record = { semester, sgpa, time: Date.now() };
  const loggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (loggedIn) {
    const arr = JSON.parse(localStorage.getItem("sgpaData")) || [];
    arr.push(record);
    localStorage.setItem("sgpaData", JSON.stringify(arr));
  } else {
    sessionStorage.setItem("lastSGPA", JSON.stringify(record));
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

/* ================= INIT ================= */
profile = loadProfile() || getGuestProfile();

populateSemesterDropdown();
loadSubjects();

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
