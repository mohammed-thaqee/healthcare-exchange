const crypto = require("crypto");
require("dotenv").config();

const SALT = process.env.PATIENT_ID_SALT || "dev-salt-change-in-production";

/**
 * Deterministic salted HMAC-SHA256 of a patient ID.
 * Returns a 0x-prefixed 32-byte hex string (Solidity bytes32 compatible).
 * The raw patient ID is NEVER sent to the blockchain.
 */
function hashPatientId(patientId) {
  const hex = crypto.createHmac("sha256", SALT).update(patientId).digest("hex");
  return "0x" + hex;
}

/**
 * AES-256-GCM + RSA-OAEP hybrid encryption.
 *   1. Generate a random 256-bit AES key
 *   2. Encrypt plaintext with AES-GCM  → encryptedData + authTag
 *   3. Encrypt AES key with receiver's RSA public key → encryptedKey
 * Only the holder of the matching RSA private key can decrypt.
 */
function encryptAesRsa(plaintext, publicKeyPem) {
  const aesKey = crypto.randomBytes(32);
  const iv     = crypto.randomBytes(12);

  const cipher    = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    aesKey
  );

  return {
    encryptedData: encrypted.toString("base64"),
    authTag:       authTag.toString("base64"),
    encryptedKey:  encryptedKey.toString("base64"),
    iv:            iv.toString("base64")
  };
}

/**
 * Decrypt data received from /transfer-data.
 * Call this on the Hospital A client side with the RSA private key.
 */
function decryptAesRsa(encryptedData, authTag, encryptedKey, iv, privateKeyPem) {
  const aesKey = crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(encryptedKey, "base64")
  );

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "base64")),
    decipher.final()
  ]).toString("utf8");
}

module.exports = { hashPatientId, encryptAesRsa, decryptAesRsa };
