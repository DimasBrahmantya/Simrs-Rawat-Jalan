import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/app/models/Doctor";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const poliId = searchParams.get("poliId");

    const query = poliId ? { poliId, active: true } : { active: true };

    const doctors = await Doctor.find(query)
      .populate("poliId", "name")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(doctors);
  } catch (err) {
    console.error("GET /api/doctors", err);
    return NextResponse.json(
      { message: "Gagal mengambil data dokter" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, poliId } = body;

    if (!name || !poliId) {
      return NextResponse.json(
        { message: "Nama dokter dan poli wajib diisi" },
        { status: 400 }
      );
    }

    await connectDB();

    const doctor = await Doctor.create({
      name,
      poliId,
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (err) {
    console.error("POST /api/doctors", err);
    return NextResponse.json(
      { message: "Gagal menambah dokter" },
      { status: 500 }
    );
  }
}