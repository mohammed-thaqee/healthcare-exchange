const Patient    = require("../models/Patient");
const Request    = require("../models/Request");
const { hashPatientId, encryptAesRsa } = require("../services/crypto");
const blockchain = require("../services/blockchain");

module.exports = async function transferData(req, res) {
  try {
    const { requestId, hospitalPublicKey } = req.body;

    if (!requestId || !hospitalPublicKey) {
      return res.status(400).json({ error: "requestId and hospitalPublicKey are required" });
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.status !== "CONSENT_GRANTED") {
      return res.status(403).json({
        error: `Cannot transfer. Current status: ${request.status}. Must be CONSENT_GRANTED.`
      });
    }

    const patient = await Patient.findOne({ patientId: request.patientId });
    if (!patient) return res.status(404).json({ error: "Patient record not found" });

    // Select data subset based on requested dataType
    let payload;
    switch (request.dataType) {
      case "LABS":
        payload = { labResults: patient.medicalData.labResults, allergies: patient.medicalData.allergies };
        break;
      case "IMAGING":
        payload = { imaging: patient.medicalData.imaging };
        break;
      case "PRESCRIPTIONS":
        payload = { medications: patient.medicalData.medications, allergies: patient.medicalData.allergies };
        break;
      default: // FULL
        payload = patient.medicalData;
    }

    // Encrypt with AES-256-GCM, wrap key with Hospital A's RSA public key
    const encrypted = encryptAesRsa(
      JSON.stringify({ patientId: request.patientId, data: payload }),
      hospitalPublicKey
    );

    // Log DATA_SHARED on blockchain
    const patientIdHash = hashPatientId(request.patientId);
    let txHash = "BLOCKCHAIN_SKIPPED_IN_DEV";
    try {
      txHash = await blockchain.logDataTransfer(
        patientIdHash,
        request.requestingHospital,
        request.respondingHospital,
        requestId
      );
    } catch (e) {
      console.warn("⚠️  Blockchain transfer log failed (non-fatal):", e.message);
    }

    request.status = "DATA_SHARED";
    request.blockchainTxHashes.push(txHash);
    await request.save();

    res.json({
      success:       true,
      dataType:      request.dataType,
      encryptedData: encrypted.encryptedData,
      encryptedKey:  encrypted.encryptedKey,
      authTag:       encrypted.authTag,
      iv:            encrypted.iv,
      txHash,
      message: "Data encrypted and transferred. Decrypt with your RSA private key."
    });

  } catch (err) {
    console.error("transfer-data:", err);
    res.status(500).json({ error: err.message });
  }
};
