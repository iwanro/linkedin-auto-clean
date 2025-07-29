// index.js
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI.OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Configuri freemium & VIP
const FREE_LIMIT = 25;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const userData = {}; // { userId: { plan: 'free'|'vip', usage: number, lastUsage: timestamp } }

// Middleware verificare JWT
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (!userData[payload.sub]) userData[payload.sub] = { plan: "vip", usage: 0, lastUsage: Date.now() };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  }
  // fallback free user
  req.user = { sub: "free-user", plan: "free" };
  if (!userData["free-user"]) userData["free-user"] = { plan: "free", usage: 0, lastUsage: Date.now() };
  next();
}

// Reset usage weekly (simplified)
setInterval(() => {
  for (const userId in userData) {
    if (userData[userId].plan === "free") userData[userId].usage = 0;
  }
}, 7 * 24 * 3600 * 1000);

// POST /v1/rate
app.post("/v1/rate", authMiddleware, async (req, res) => {
  const user = userData[req.user.sub];
  if (user.plan === "free" && user.usage >= FREE_LIMIT) {
    return res.status(429).json({ error: "Free limit reached" });
  }

  const { text } = req.body;
  if (!text || typeof text !== "string") return res.status(400).json({ error: "Missing text" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Rate importance of: ${text}` }],
      max_tokens: 5,
    });
    const content = completion.choices[0].message.content;
    const score = parseInt(content.match(/\d+/)?.[0] || "0");

    if (user.plan === "free") user.usage++;

    res.json({ score, remaining: user.plan === "free" ? FREE_LIMIT - user.usage : -1 });
  } catch (e) {
    res.status(500).json({ error: "OpenAI error", details: e.message });
  }
});

// GET /v1/plan
app.get("/v1/plan", authMiddleware, (req, res) => {
  const user = userData[req.user.sub];
  res.json({
    plan: user.plan,
    remaining: user.plan === "free" ? FREE_LIMIT - user.usage : -1,
  });
});

// GET /billing/checkout (simplificat: doar emite JWT VIP)
app.get("/billing/checkout", (req, res) => {
  // în realitate faci integrare Stripe, aici demo simplu
  const userId = `user-${Date.now()}`;
  const token = jwt.sign({ sub: userId, plan: "vip" }, JWT_SECRET, { expiresIn: "30d" });
  userData[userId] = { plan: "vip", usage: 0, lastUsage: Date.now() };
  res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
