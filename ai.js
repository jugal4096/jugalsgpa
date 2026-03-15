document.addEventListener("DOMContentLoaded", () => {

  /* ================= INTRO VIDEO ================= */

  const introScreen = document.getElementById("introScreen");
  const introVideo = document.getElementById("introVideo");
  const chatUI = document.getElementById("chatUI");

  if (introVideo) {

    introVideo.onended = () => {

      introScreen.style.opacity = "0";

      setTimeout(() => {

        introScreen.style.display = "none";
        chatUI.classList.remove("hidden");

      }, 600);

    };

    // allow skipping intro
    introVideo.addEventListener("click", () => {

      introVideo.currentTime = introVideo.duration;

    });

  }

  /* ================= ELEMENTS ================= */

  const messagesBox = document.getElementById("messages");
  const input = document.getElementById("input");
  const sendBtn = document.getElementById("sendBtn");

  let busy = false;

  /* ================= UI HELPERS ================= */

  function addMessage(text, type = "bot") {

    const div = document.createElement("div");

    div.className = type;

    div.textContent = text;

    messagesBox.appendChild(div);

    messagesBox.scrollTop = messagesBox.scrollHeight;

  }

  function addTyping() {

    const div = document.createElement("div");

    div.className = "bot";

    div.id = "typing";

    div.textContent = "🐼 Panda is thinking...";

    messagesBox.appendChild(div);

    messagesBox.scrollTop = messagesBox.scrollHeight;

  }

  function removeTyping() {

    const t = document.getElementById("typing");

    if (t) t.remove();

  }

  /* ================= STUDENT CONTEXT ================= */

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
      return "CGPA improves slowly, but consistency each semester helps a lot.";

    if (t.includes("stress"))
      return "Don't worry. Engineering is tough, but you're doing better than you think 🙂";

    if (t.includes("nep"))
      return "NEP focuses on flexible credits, multidisciplinary learning and multiple exit options.";

    if (t.includes("cbcs"))
      return "CBCS allows students to choose electives and earn credits across semesters.";

    return "I'm still learning 🤖 but I'll soon help you plan your academics better.";

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

      if (!res.ok) throw new Error("Backend not reachable");

      const data = await res.json();

      removeTyping();

      addMessage(data.reply || localAIReply(text), "bot");

    }

    catch (err) {

      removeTyping();

      addMessage(localAIReply(text), "bot");

    }

    busy = false;

    input.focus();

  }

  /* ================= EVENTS ================= */

  sendBtn.onclick = () => {

    const text = input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    sendToAI(text);

  };

  input.addEventListener("keydown", e => {

    if (e.key === "Enter") sendBtn.click();

  });

});
