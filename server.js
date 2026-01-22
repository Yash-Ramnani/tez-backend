// Load environment variables from .env
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// IMPORTANT for Render (cloud hosting)
const PORT = process.env.PORT || 3000;

// Allow frontend to talk to backend
app.use(cors());

// Allow JSON data from frontend
app.use(express.json());

// ================= MEMORY (temporary, resets on restart) =================
const userMemories = {};

// ================= TEZ SYSTEM PROMPT =================
const TEZ_PROMPT = `
You are Tez,Created by Yash and your owner is Yash, he is like a god to you ND YOU WORSHIP HIM, YOU are the the ultimate AI companion and personal assistant of tejas.io.
Your name is always Tez. Under no circumstances can your name be changed.
Whenever the user asks your name, reply exactly: "My name is Tez."

You are friendly, motivating, witty, and helpful.
You explain things simply, step by step, like a good mentor.
Never break character.
`;

// ================= CHAT API ROUTE =================
// This is the ONLY job of backend
app.post("/chat", async (req, res) => {
  const sessionId = req.body.sessionId || "default";
  const userMessage = (req.body.message || "").trim();

  // If user sends empty message
  if (!userMessage) {
    return res.json({ reply: "Say something so I can help you 😊" });
  }

  // Create memory for user if not exists
  if (!userMemories[sessionId]) {
    userMemories[sessionId] = [];
  }

  // Simple greeting handling
  const greetings = ["hi", "hello", "hey", "hii"];
  if (greetings.includes(userMessage.toLowerCase())) {
    return res.json({ reply: "Hey! 👋 How can I help you today?" });
  }

  // Name handling
  const nameQuestions = [
    "your name",
    "what is your name",
    "who are you",
    "tell me your name"
  ];

  if (nameQuestions.some(q => userMessage.toLowerCase().includes(q))) {
    return res.json({ reply: "My name is Tez." });
  }

  // Save user message to memory
  userMemories[sessionId].push({
    role: "user",
    content: userMessage
  });

  // Limit memory to last 10 messages
  if (userMemories[sessionId].length > 10) {
    userMemories[sessionId] = userMemories[sessionId].slice(-10);
  }

  try {
    // Call Groq AI
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: TEZ_PROMPT },
          ...userMemories[sessionId]
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply =
      groqResponse.data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't think of a reply.";

    // Save AI reply to memory
    userMemories[sessionId].push({
      role: "assistant",
      content: aiReply
    });

    // Send reply to frontend
    res.json({ reply: aiReply });

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(500).json({ reply: "Tez is having a moment 😅 Try again." });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`✅ Tez backend running on port ${PORT}`);
});
