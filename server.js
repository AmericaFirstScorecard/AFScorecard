// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const app = express();

// --- config ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me"; // set this in Render

// --- basic middleware ---
app.use(cors()); // safe since frontend is same origin, but fine to keep
app.use(express.json({ limit: "5mb" })); // allow image data URLs in JSON

// static files (frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// in-memory "database"
let members = [
  {
    id: crypto.randomUUID(),
    name: "Sample Senator",
    chamber: "Senate",
    state: "TX",
    party: "R",
    lifetimeScore: 92,
    currentScore: 95,
    imageData: null
  },
  {
    id: crypto.randomUUID(),
    name: "Sample Representative",
    chamber: "House",
    state: "FL",
    party: "R",
    lifetimeScore: 88,
    currentScore: 90,
    imageData: null
  }
];

// simple in-memory token store
const adminTokens = new Set();

// --- helpers ---
function getTokenFromReq(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}

function requireAdmin(req, res, next) {
  const token = getTokenFromReq(req);
  if (token && adminTokens.has(token)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// --- routes ---

// login -> returns token if password matches ADMIN_PASSWORD
app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = crypto.randomUUID();
  adminTokens.add(token);
  res.json({ token });
});

// get all members (public)
app.get("/api/members", (req, res) => {
  res.json(members);
});

// add member (admin only)
app.post("/api/members", requireAdmin, (req, res) => {
  const {
    name = "New Member",
    chamber = "House",
    state = "",
    party = "",
    lifetimeScore = 0,
    currentScore = 0,
    imageData = null
  } = req.body || {};

  const member = {
    id: crypto.randomUUID(),
    name,
    chamber,
    state,
    party,
    lifetimeScore,
    currentScore,
    imageData
  };

  members.unshift(member);
  res.status(201).json(member);
});

// update member (admin only, partial update)
app.put("/api/members/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  const allowedFields = [
    "name",
    "chamber",
    "state",
    "party",
    "lifetimeScore",
    "currentScore",
    "imageData"
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (key in req.body) {
      updates[key] = req.body[key];
    }
  }

  members[idx] = { ...members[idx], ...updates };
  res.json(members[idx]);
});

// delete member (admin only)
app.delete("/api/members/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Not found" });
  }
  const [removed] = members.splice(idx, 1);
  res.json(removed);
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("AFScorecard server listening on port", PORT);
});
