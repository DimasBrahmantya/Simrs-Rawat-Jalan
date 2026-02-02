import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/app/models/Patient";

const poliPrefix: Record<string, string> = {
  "Poli Umum": "U",
  "Poli Gigi": "G",
  "Poli Anak": "A",
};

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const today = new Date().toISOString().split("T")[0];

  // ambil data pasien TERAKHIR berdasarkan KTP
  const existingPatient = await Patient.findOne({
    ktpNumber: body.ktpNumber,
  }).sort({ createdAt: -1 });

  // ❌ KTP ada tapi nama beda
  if (existingPatient && existingPatient.name !== body.name) {
    return NextResponse.json(
      { message: "Nomor KTP sudah terdaftar dengan nama berbeda" },
      { status: 409 },
    );
  }

  // ================= QUEUE =================
  const countToday = await Patient.countDocuments({
    registrationDate: today,
    poli: body.poli,
  });

  const queueNumber = countToday + 1;

  const poliPrefix: Record<string, string> = {
    "Poli Umum": "U",
    "Poli Gigi": "G",
    "Poli Anak": "A",
  };

  const prefix = poliPrefix[body.poli] ?? "X";
  const queueDisplay = `${prefix}-${queueNumber.toString().padStart(3, "0")}`;

  const patient = await Patient.create({
    ...body,
    registrationDate: today,
    queueNumber,
    queueDisplay,
    status: "waiting",
  });

  return NextResponse.json(patient, { status: 201 });
}

export async function GET() {
  await connectDB();

  const patients = await Patient.find().sort({ createdAt: -1 });

  return NextResponse.json(patients);
}
