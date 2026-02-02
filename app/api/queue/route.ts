import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/app/models/Patient";

export async function GET() {
  await connectDB();

  const today = new Date().toISOString().split("T")[0];

  const patients = await Patient.find({
    registrationDate: today,
  }).sort({ queueNumber: 1 });

  return NextResponse.json(patients);
}
