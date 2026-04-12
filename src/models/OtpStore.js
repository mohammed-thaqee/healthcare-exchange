const { Schema, model } = require("mongoose");

const OtpStoreSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, required: true, ref: "Request" },
  otpHash:   { type: String, required: true },
  nonce:     { type: String, required: true },
  expiry:    { type: Date,   required: true },
  used:      { type: Boolean, default: false }
}, { timestamps: true });

// MongoDB TTL index — auto-deletes expired OTPs
OtpStoreSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

module.exports = model("OtpStore", OtpStoreSchema);
