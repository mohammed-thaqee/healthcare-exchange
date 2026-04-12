require("dotenv").config();
const mongoose = require("mongoose");
const Patient  = require("../src/models/Patient");

// ─────────────────────────────────────────────────────────────────────────────
//  CHANGE THIS to your own email address.
//  This is where the OTP consent email will arrive during the demo.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_EMAIL = "elysiumalbedo@gmail.com";
// ─────────────────────────────────────────────────────────────────────────────

const patients = [
  {
    patientId: "PAT-001",
    name:      "Arjun Mehta",
    email:     DEMO_EMAIL,
    dateOfBirth: "1985-06-15",
    bloodType: "O+",
    hospital:  "Hospital B",
    medicalData: {
      diagnoses:   ["Type 2 Diabetes", "Hypertension"],
      medications: ["Metformin 500mg", "Amlodipine 5mg"],
      allergies:   ["Penicillin"],
      labResults: {
        hba1c:          "7.2%",
        fastingGlucose: "126 mg/dL",
        cholesterol:    "185 mg/dL",
        bp:             "138/88 mmHg",
        reportDate:     "2024-11-20"
      },
      imaging: ["Chest X-Ray clear (2024-08)", "ECG normal sinus rhythm (2024-11)"]
    }
  },
  {
    patientId: "PAT-002",
    name:      "Priya Sharma",
    email:     DEMO_EMAIL,
    dateOfBirth: "1990-03-22",
    bloodType: "B+",
    hospital:  "Hospital B",
    medicalData: {
      diagnoses:   ["Asthma (mild persistent)"],
      medications: ["Salbutamol inhaler PRN", "Budesonide 200mcg daily"],
      allergies:   ["Aspirin"],
      labResults: {
        spirometry:  "FEV1 78% predicted",
        eosinophils: "450/uL",
        reportDate:  "2024-10-10"
      },
      imaging: ["CT Thorax: mild air trapping bilaterally (2024-10)"]
    }
  }
];

async function seed() {
  if (DEMO_EMAIL === "your-email@gmail.com") {
    console.error("\n❌  Open scripts/seed.js and change DEMO_EMAIL to your real email address first.\n");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Patient.deleteMany({});
  const docs = await Patient.insertMany(patients);

  console.log(`\n✅ Seeded ${docs.length} patients:`);
  docs.forEach(p => console.log(`   ${p.patientId} — ${p.name} (${p.hospital})`));
  console.log(`\n📧 OTP emails will go to: ${DEMO_EMAIL}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
