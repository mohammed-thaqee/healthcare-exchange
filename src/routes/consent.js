const crypto   = require("crypto");
const OtpStore = require("../models/OtpStore");
const Request  = require("../models/Request");
const { sendOtpEmail }  = require("../services/mailer");
const { hashPatientId } = require("../services/crypto");
const blockchain        = require("../services/blockchain");

// ── POST /send-otp ────────────────────────────────────────────────────────────
async function sendOtp(req, res) {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: "requestId is required" });

    const request = await Request.findById(requestId);
    if (!request)                         return res.status(404).json({ error: "Request not found" });
    if (request.status !== "PENDING")     return res.status(400).json({ error: `Request is already ${request.status}` });

    // Invalidate any previous unused OTPs for this request
    await OtpStore.updateMany({ requestId, used: false }, { $set: { used: true } });

    const otp     = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const nonce   = crypto.randomUUID();
    const expiry  = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OtpStore.create({ requestId, otpHash, nonce, expiry, used: false });
    await sendOtpEmail(request.patientEmail, otp, request.requestingHospital, request.dataType);

    res.json({
      success: true,
      nonce,
      sentTo:    request.patientEmail,
      expiresAt: expiry,
      message:   "OTP sent. Use nonce + OTP in /verify-otp."
    });

  } catch (err) {
    console.error("send-otp:", err);
    res.status(500).json({ error: err.message });
  }
}

// ── POST /verify-otp ──────────────────────────────────────────────────────────
async function verifyOtp(req, res) {
  try {
    const { requestId, otp, nonce, consent } = req.body;

    if (!requestId || !otp || !nonce || consent === undefined) {
      return res.status(400).json({ error: "requestId, otp, nonce, consent (boolean) are all required" });
    }

    const record = await OtpStore.findOne({ requestId, nonce, used: false });
    if (!record)                   return res.status(400).json({ error: "Invalid nonce or OTP already used" });
    if (new Date() > record.expiry) return res.status(400).json({ error: "OTP has expired. Call /send-otp again." });

    const hash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (hash !== record.otpHash)   return res.status(400).json({ error: "Incorrect OTP" });

    // Mark as used — prevents replay
    record.used = true;
    await record.save();

    const request   = await Request.findById(requestId);
    request.status  = consent ? "CONSENT_GRANTED" : "CONSENT_DENIED";
    await request.save();

    const patientIdHash = hashPatientId(request.patientId);

    let txHash = "BLOCKCHAIN_SKIPPED_IN_DEV";
    try {
      txHash = await blockchain.logConsent(
        patientIdHash,
        request.requestingHospital,
        request.respondingHospital,
        consent,
        requestId
      );
    } catch (e) {
      console.warn("⚠️  Blockchain consent log failed (non-fatal):", e.message);
    }

    request.blockchainTxHashes.push(txHash);
    await request.save();

    res.json({
      success: true,
      consent,
      status: request.status,
      txHash,
      message: consent
        ? "Consent granted. Call /transfer-data to receive encrypted data."
        : "Consent denied. Data will not be shared."
    });

  } catch (err) {
    console.error("verify-otp:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { sendOtp, verifyOtp };
