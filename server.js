/**
 * GECA AI Assistant – Final Backend
 * ----------------------------------
 * - Serves frontend + backend together
 * - ZERO CORS issues
 * - Secure API key
 */

import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// ✅ Serve frontend files
app.use(express.static("public"));

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const systemPrompt = `
You are a friendly senior GECA engineering student.
Help juniors plan SGPA and CGPA realistically.

Rules:
- No judgement
- Simple Indian college tone
- Honest feasibility
- No lectures
- Never say "as an AI model"

Student Context:
${JSON.stringify(context, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
app.get("/test-ai", async (req, res) => {
    try {
      const r = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: "Say hello" }]
      });
      res.send(r.choices[0].message.content);
    } catch (e) {
      console.error(e);
      res.status(500).send("OpenAI failed");
    }
  });
  
