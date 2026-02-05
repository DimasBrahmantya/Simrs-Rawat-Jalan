import { Schema, model, models } from "mongoose";

const PoliSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // Poli Umum
    code: { type: String, required: true }, // U, G, A
  },
  { timestamps: true }
);

export default models.Poli || model("Poli", PoliSchema);
