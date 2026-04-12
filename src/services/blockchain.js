const { ethers } = require("ethers");
const path = require("path");
const fs   = require("fs");
require("dotenv").config();

let _contract = null;

function getContract() {
  if (_contract) return _contract;

  const missing = ["SEPOLIA_RPC_URL", "PRIVATE_KEY", "CONTRACT_ADDRESS"]
    .filter(k => !process.env[k] || process.env[k].trim() === "");

  if (missing.length) {
    throw new Error(`Missing in .env: ${missing.join(", ")}`);
  }

  const abiPath = path.join(__dirname, "../../artifacts/contracts/AuditLogger.sol/AuditLogger.json");
  if (!fs.existsSync(abiPath)) {
    throw new Error("ABI not found. Run:  npx hardhat compile");
  }

  const { abi } = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  _contract      = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, signer);
  return _contract;
}

async function logRequest(patientIdHash, reqHospital, resHospital, requestId) {
  const tx = await getContract().logRequest(patientIdHash, reqHospital, resHospital, requestId);
  await tx.wait();
  console.log(`⛓  REQUEST_INITIATED | tx: ${tx.hash}`);
  return tx.hash;
}

async function logConsent(patientIdHash, reqHospital, resHospital, granted, requestId) {
  const tx = await getContract().logConsent(patientIdHash, reqHospital, resHospital, granted, requestId);
  await tx.wait();
  console.log(`⛓  ${granted ? "CONSENT_GRANTED" : "CONSENT_DENIED"} | tx: ${tx.hash}`);
  return tx.hash;
}

async function logDataTransfer(patientIdHash, reqHospital, resHospital, requestId) {
  const tx = await getContract().logDataTransfer(patientIdHash, reqHospital, resHospital, requestId);
  await tx.wait();
  console.log(`⛓  DATA_SHARED | tx: ${tx.hash}`);
  return tx.hash;
}

async function getLog(index) {
  const log = await getContract().getLog(index);
  const actions = ["REQUEST_INITIATED", "CONSENT_GRANTED", "CONSENT_DENIED", "DATA_SHARED"];
  return {
    patientIdHash:      log.patientIdHash,
    requestingHospital: log.requestingHospital,
    respondingHospital: log.respondingHospital,
    timestamp:          new Date(Number(log.timestamp) * 1000).toISOString(),
    action:             actions[Number(log.action)],
    requestId:          log.requestId
  };
}

module.exports = { logRequest, logConsent, logDataTransfer, getLog };
