const PROGRAM_KEY = "program";

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function saveProgram(program) {
  if (isLoggedIn()) {
    localStorage.setItem(PROGRAM_KEY, program);
  } else {
    sessionStorage.setItem(PROGRAM_KEY, program);
  }
}

/* Supported programs ONLY */
window.selectProgram = function (program) {

  saveProgram(program);

  if (program === "BTECH") {
    window.location.href = "form.html";
    return;
  }

  if (program === "MCA") {
    window.location.href = "dashboard.html";
    return;
  }
};

   
   
   