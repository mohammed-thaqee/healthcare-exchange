const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendOtpEmail(to, otp, requestingHospital, dataType) {
  await transporter.sendMail({
    from: `"Healthcare Exchange" <${process.env.GMAIL_USER}>`,
    to,
    subject: "[ACTION REQUIRED] Medical Data Consent — Your OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
          <h2 style="color:white;margin:0">🏥 Medical Data Sharing Request</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
          <p style="color:#374151;font-size:16px">
            <strong>${requestingHospital}</strong> is requesting access to your
            <strong>${dataType}</strong> records.
          </p>
          <p style="color:#374151">Share this OTP with the hospital staff to <strong>approve</strong> the request:</p>
          <div style="background:#1e40af;color:white;font-size:40px;font-weight:bold;
                      text-align:center;padding:24px;border-radius:8px;letter-spacing:14px;margin:20px 0">
            ${otp}
          </div>
          <p style="color:#ef4444">⏱ Expires in <strong>5 minutes</strong>.</p>
          <p style="color:#6b7280;font-size:13px">
            Do not share this code with anyone other than hospital staff.<br>
            This request is immutably logged on the Ethereum blockchain.<br>
            Your medical data is never stored on-chain.
          </p>
        </div>
      </div>`
  });
  console.log(`📧 OTP sent to ${to}`);
}

module.exports = { sendOtpEmail };
