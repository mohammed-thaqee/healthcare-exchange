const { Schema, model } = require("mongoose");

const PatientSchema = new Schema({
  patientId:   { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  dateOfBirth: String,
  bloodType:   String,
  hospital:    { type: String, required: true },
  medicalData: {
    diagnoses:   [String],
    medications: [String],
    allergies:   [String],
    labResults:  Schema.Types.Mixed,
    imaging:     [String]
  }
}, { timestamps: true });

module.exports = model("Patient", PatientSchema);
