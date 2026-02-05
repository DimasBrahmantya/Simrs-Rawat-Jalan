import { Schema, model, models } from "mongoose";

const DoctorScheduleSchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    day: { type: String }, // Senin, Selasa
    startTime: String, // 08:00
    endTime: String,   // 12:00
  },
  { timestamps: true }
);

export default models.DoctorSchedule || model("DoctorSchedule", DoctorScheduleSchema);
