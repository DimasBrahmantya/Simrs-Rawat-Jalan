import { Schema, model, models } from "mongoose";

const PatientSchema = new Schema(
  {
    name: String,
    ktpNumber: {
      type: String,
      required: true,
      index: true,
    },
    birthDate: String,
    address: String,
    doctorId: String,
    doctorName: String,
    poli: String,
    queueNumber: Number,
    queueDisplay: String,
    registrationDate: String,
    status: {
      type: String,
      enum: ["waiting", "called", "completed"],
      default: "waiting",
    },
    medicalRecordNumber: {
      type: String,
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default models.Patient || model("Patient", PatientSchema);
