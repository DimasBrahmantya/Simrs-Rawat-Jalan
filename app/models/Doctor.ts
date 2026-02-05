import { Schema, model, models } from "mongoose";

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true },
    poliId: { type: Schema.Types.ObjectId, ref: "Poli" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Doctor || model("Doctor", DoctorSchema);
