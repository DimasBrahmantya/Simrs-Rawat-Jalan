import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Poli from "@/app/models/Poli";

export async function GET() {
  try {
    await connectDB();

    const polis = await Poli.find().sort({ name: 1 }).lean();

    return NextResponse.json(polis);
  } catch (err) {
    console.error("GET /api/polis", err);
    return NextResponse.json(
      { message: "Gagal mengambil data poli" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { message: "Nama dan kode poli wajib diisi" },
        { status: 400 }
      );
    }

    await connectDB();

    const poli = await Poli.create({ name, code });

    return NextResponse.json(poli, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Poli sudah ada" },
        { status: 409 }
      );
    }

    console.error("POST /api/polis", err);
    return NextResponse.json(
      { message: "Gagal menambah poli" },
      { status: 500 }
    );
  }
}
