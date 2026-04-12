require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── Database ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ── Routes ────────────────────────────────────────────────────────────────────
const auth    = require("./middleware/auth");
const consent = require("./routes/consent");

app.get ("/health",        (req, res) => res.json({ status: "ok", time: new Date() }));
app.post("/login",         require("./routes/auth"));
app.post("/request-data",  auth, require("./routes/request"));
app.post("/send-otp",      auth, consent.sendOtp);
app.post("/verify-otp",    auth, consent.verifyOtp);
app.post("/transfer-data", auth, require("./routes/transfer"));
app.get ("/audit-logs",    auth, require("./routes/audit"));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server → http://localhost:${PORT}`);
  console.log("Endpoints: POST /login  /request-data  /send-otp  /verify-otp  /transfer-data  GET /audit-logs");
});
