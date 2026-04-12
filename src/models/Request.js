const { Schema, model } = require("mongoose");

const RequestSchema = new Schema({
  requestingHospital: { type: String, required: true },
  respondingHospital: { type: String, required: true },
  patientId:          { type: String, required: true },
  patientEmail:       { type: String, required: true },
  dataType: {
    type: String,
    enum: ["FULL", "LABS", "IMAGING", "PRESCRIPTIONS"],
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "CONSENT_GRANTED", "CONSENT_DENIED", "DATA_SHARED"],
    default: "PENDING"
  },
  requestTimestamp:   Number,
  blockchainTxHashes: { type: [String], default: [] }
}, { timestamps: true });

module.exports = model("Request", RequestSchema);
