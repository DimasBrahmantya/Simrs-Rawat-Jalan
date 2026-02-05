import { Schema, model, models } from "mongoose";

const VisitSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
    poliId: { type: Schema.Types.ObjectId, ref: "Poli" },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    registrationDate: String,
    queueNumber: Number,
    queueDisplay: String,
    status: {
      type: String,
      enum: ["waiting", "called", "completed", "cancelled", "control"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

export default models.Visit || model("Visit", VisitSchema);
