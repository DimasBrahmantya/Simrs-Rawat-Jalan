import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/app/models/Patient";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const ktp = searchParams.get("ktp");

  if (!ktp) {
    return NextResponse.json({ message: "KTP required" }, { status: 400 });
  }

  // ambil data TERAKHIR pasien dengan KTP tsb
  const patient = await Patient.findOne({ ktpNumber: ktp }).sort({
    createdAt: -1,
  });

  if (!patient) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    name: patient.name,
    birthDate: patient.birthDate,
    address: patient.address,
  });
}
