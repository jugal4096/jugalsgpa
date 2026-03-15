document.addEventListener("DOMContentLoaded", () => {

  /* ================= ELEMENTS ================= */

  const messagesBox = document.getElementById("aiMessages");
  const input = document.querySelector(".ai-input input");
  const sendBtn = document.querySelector(".ai-input button");
  const closeBtn = document.querySelector(".ai-close");
  const suggestionBtns = document.querySelectorAll(".ai-suggestions button");

  // Profile
  const profileCorner = document.getElementById("profileCorner");
  const profileBadge = document.getElementById("profileBadge");
  const profileInitial = document.getElementById("profileInitial");
  const profileMenu = document.getElementById("profileMenu");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let busy = false;

  /* ================= PROFILE LOGIC ================= */

  if (profileCorner) {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    profileInitial.textContent =
      profile.name?.charAt(0).toUpperCase() || "U";
  }

  if (profileBadge) {
    profileBadge.addEventListener("click", e => {
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    });
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      window.location.href = "form.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("login.html");
    });
  }

  document.addEventListener("click", e => {
    if (profileCorner && !profileCorner.contains(e.target)) {
      profileMenu.classList.add("hidden");
    }
  });

  /* ================= UI HELPERS ================= */

  function addMessage(text, type = "ai") {

    const div = document.createElement("div");

    div.className = `ai-bubble ${type}`;

    div.textContent = text;

    messagesBox.appendChild(div);

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function addTyping() {

    const div = document.createElement("div");

    div.className = "ai-bubble ai";

    div.id = "typing";

    div.textContent = "🐼 Panda is thinking...";

    messagesBox.appendChild(div);

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function removeTyping() {

    const t = document.getElementById("typing");

    if (t) t.remove();
  }

  /* ================= CONTEXT ================= */

  function getStudentContext() {
    return {
      isGuest: false,
      admissionMode: "Regular",
      semestersCompleted: 4
    };
  }

  /* ================= LOCAL FALLBACK AI ================= */

  function localAIReply(text) {

    const t = text.toLowerCase();

    if (t.includes("sgpa"))
      return "Improving SGPA is possible 😊 Focus on high-credit subjects and internal marks.";

    if (t.includes("cgpa"))
      return "CGPA improves slowly, but consistency each semester makes a big difference.";

    if (t.includes("8"))
      return "8+ CGPA is achievable if upcoming semesters are planned smartly.";

    if (t.includes("stress"))
      return "Don't worry. Engineering is tough, but you're doing better than you think 🙂";

    if (t.includes("panda"))
      return "🐼 I am GECA's Panda — your academic companion.";

    return "I'm currently in training phase 🤖 I'll soon give you detailed academic plans.";
  }

  /* ================= AI CALL ================= */

  async function sendToAI(text) {

    if (busy) return;

    busy = true;

    addTyping();

    try {

      const res = await fetch("https://geca-panda-1.onrender.com/ai", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: text,
          context: getStudentContext()
        })

      });

      if (!res.ok) throw new Error("Backend not available");

      const data = await res.json();

      removeTyping();

      addMessage(data.reply || localAIReply(text), "ai");

    }

    catch (err) {

      removeTyping();

      addMessage(localAIReply(text), "ai");

    }

    busy = false;

    input.focus();
  }

  /* ================= EVENTS ================= */

  if (sendBtn) {

    sendBtn.onclick = () => {

      const text = input.value.trim();

      if (!text) return;

      addMessage(text, "user");

      input.value = "";

      sendToAI(text);
    };

  }

  if (input) {

    input.addEventListener("keydown", e => {

      if (e.key === "Enter") sendBtn.click();

    });

  }

  suggestionBtns.forEach(btn => {

    btn.onclick = () => {

      addMessage(btn.innerText, "user");

      sendToAI(btn.innerText);

    };

  });

  if (closeBtn) {

    closeBtn.onclick = () => window.history.back();

  }

});
