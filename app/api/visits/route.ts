// api/visits/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Visit from "@/app/models/Visit";
import Patient from "@/app/models/Patient";
import Poli from "@/app/models/Poli";

const poliPrefix: Record<string, string> = {
  "Poli Umum": "U",
  "Poli Gigi": "G",
  "Poli Anak": "A",
};

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const today = new Date().toISOString().split("T")[0];

  // Cari patient berdasarkan ktpNumber
  const patient = await Patient.findOne({ ktpNumber: body.ktpNumber });
  if (!patient) {
    return NextResponse.json(
      { message: "Pasien tidak ditemukan" },
      { status: 404 }
    );
  }

  // Cari poli berdasarkan poliId
  const poli = await Poli.findById(body.poliId);
  if (!poli) {
    return NextResponse.json(
      { message: "Poli tidak ditemukan" },
      { status: 404 }
    );
  }

  // Hitung queueNumber untuk hari ini di poli tersebut
  const countToday = await Visit.countDocuments({
    registrationDate: today,
    poliId: body.poliId,
  });

  const queueNumber = countToday + 1;
  const prefix = poliPrefix[poli.name] ?? "X";
  const queueDisplay = `${prefix}-${queueNumber.toString().padStart(3, "0")}`;

  const visit = await Visit.create({
    patientId: patient._id,
    poliId: body.poliId,
    doctorId: body.doctorId,
    registrationDate: today,
    queueNumber,
    queueDisplay,
    status: "waiting",
  });

  // Populate untuk return data yang mirip dengan Patient
  const populatedVisit = await Visit.findById(visit._id)
    .populate("patientId", "name")
    .populate("poliId", "name")
    .populate("doctorId", "name");

  return NextResponse.json({
    _id: populatedVisit._id,
    name: populatedVisit.patientId.name,
    poli: populatedVisit.poliId.name,
    doctorName: populatedVisit.doctorId.name,
    registrationDate: populatedVisit.registrationDate,
    queueDisplay: populatedVisit.queueDisplay,
    status: populatedVisit.status,
  }, { status: 201 });
}

export async function GET() {
  await connectDB();

  const visits = await Visit.find()
    .populate("patientId", "name")
    .populate("poliId", "name")
    .populate("doctorId", "name")
    .sort({ createdAt: -1 });

  return NextResponse.json(visits);
}