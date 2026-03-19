const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const PORT = Number(process.env.PORT || 5000);

/* =========================
   CORS (STRICT + SAFE)
========================= */
const defaultAllowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:5173"
];

// Optional ENV override:
// ALLOWED_ORIGINS="http://localhost:5500,http://127.0.0.1:5500"
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = envOrigins.length ? envOrigins : defaultAllowedOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // Postman/curl
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("[CORS] Blocked origin:", origin);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Handle preflight
app.options("*", cors());

/* =========================
   BODY PARSERS
========================= */
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.get("/", (_req, res) => {
  res.send("GoYatra API running ");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/trips", require("./routes/trips.routes"));

/* =========================
   404 FALLBACK
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

/* =========================
   START SERVER (AFTER DB)
========================= */
(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[STARTUP] Server listening on port ${PORT}`);
      console.log("[STARTUP] Mounted routes: GET /, GET /api/health, /api/auth, /api/trips");
    });
  } catch (err) {
    console.error("[STARTUP] DataBase connect failed | Server not started | Try Again");
    console.error(err?.message || err);
    process.exit(1);
  }
})();