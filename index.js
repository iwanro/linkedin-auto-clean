// index.js (Node.js backend)
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));

const PLANS = { free: 25, vip: Infinity };
let usage = {};

app.post("/v1/rate", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { text } = req.body;
  const uid = token ? jwt.verify(token, "secret").email : "guest";

  usage[uid] = usage[uid] || 0;
  const limit = token ? PLANS.vip : PLANS.free;

  if (usage[uid] >= limit) return res.status(403).json({ score: 0, remaining: 0 });

  const aiRes = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Rate importance of: ${text}`,
    max_tokens: 5
  });

  const score = parseInt(aiRes.data.choices[0].text.match(/\d+/)?.[0] || "0");
  usage[uid]++;
  res.json({ score, remaining: limit - usage[uid] });
});

app.get("/v1/plan", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  let plan = "free", remaining = 25;
  if (token) {
    const { email } = jwt.verify(token, "secret");
    plan = "vip";
    remaining = Infinity;
  }
  res.json({ plan, remaining });
});

app.get("/v1/billing/checkout", (req, res) => {
  const jwtToken = jwt.sign({ email: "user@example.com" }, "secret", { expiresIn: "30d" });
  res.json({ jwt: jwtToken });
});

app.listen(3000, () => console.log("Backend listening on port 3000"));
