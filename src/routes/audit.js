const Request    = require("../models/Request");
const blockchain = require("../services/blockchain");

module.exports = async function auditLogs(req, res) {
  try {
    const requests = await Request.find({
      $or: [
        { requestingHospital: req.hospital.name },
        { respondingHospital: req.hospital.name }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    // Optionally fetch a specific on-chain log by index
    let chainLog = null;
    if (req.query.logIndex !== undefined) {
      try {
        chainLog = await blockchain.getLog(parseInt(req.query.logIndex));
      } catch (e) {
        chainLog = { error: "Could not fetch from chain: " + e.message };
      }
    }

    res.json({
      success: true,
      total:   requests.length,
      requests: requests.map(r => ({
        id:                 r._id,
        requestingHospital: r.requestingHospital,
        respondingHospital: r.respondingHospital,
        patientId:          r.patientId,
        dataType:           r.dataType,
        status:             r.status,
        txHashes:           r.blockchainTxHashes,
        createdAt:          r.createdAt
      })),
      chainLog
    });

  } catch (err) {
    console.error("audit-logs:", err);
    res.status(500).json({ error: err.message });
  }
};
