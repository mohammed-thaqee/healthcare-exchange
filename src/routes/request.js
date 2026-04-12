const Patient    = require("../models/Patient");
const Request    = require("../models/Request");
const { hashPatientId } = require("../services/crypto");
const blockchain        = require("../services/blockchain");

module.exports = async function requestData(req, res) {
  try {
    const { patientId, respondingHospital, dataType, timestamp } = req.body;

    if (!patientId || !respondingHospital || !dataType) {
      return res.status(400).json({ error: "patientId, respondingHospital, dataType are required" });
    }

    // Replay-attack guard: reject requests older than 5 minutes
    if (!timestamp || Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) {
      return res.status(400).json({ error: "timestamp missing or outside 5-minute window" });
    }

    const patient = await Patient.findOne({ patientId, hospital: respondingHospital });
    if (!patient) {
      return res.status(404).json({ error: `Patient ${patientId} not found at ${respondingHospital}` });
    }

    const request = await Request.create({
      requestingHospital: req.hospital.name,
      respondingHospital,
      patientId,
      patientEmail: patient.email,
      dataType,
      status: "PENDING",
      requestTimestamp: Number(timestamp)
    });

    // Hash patient ID before it ever touches the blockchain
    const patientIdHash = hashPatientId(patientId);

    let txHash = "BLOCKCHAIN_SKIPPED_IN_DEV";
    try {
      txHash = await blockchain.logRequest(
        patientIdHash,
        req.hospital.name,
        respondingHospital,
        request._id.toString()
      );
    } catch (e) {
      console.warn("⚠️  Blockchain log failed (non-fatal):", e.message);
    }

    request.blockchainTxHashes.push(txHash);
    await request.save();

    res.json({
      success: true,
      requestId: request._id,
      txHash,
      patientEmail: patient.email,
      message: "Request created. Call /send-otp next."
    });

  } catch (err) {
    console.error("request-data:", err);
    res.status(500).json({ error: err.message });
  }
};
