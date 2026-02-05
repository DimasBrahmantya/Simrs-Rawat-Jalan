import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DoctorSchedule from "@/app/models/DoctorSchedule";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    const query = doctorId ? { doctorId } : {};

    const schedules = await DoctorSchedule.find(query)
      .populate("doctorId", "name")
      .sort({ day: 1, startTime: 1 })
      .lean();

    return NextResponse.json(schedules);
  } catch (err) {
    console.error("GET /api/doctor-schedules", err);
    return NextResponse.json(
      { message: "Gagal mengambil jadwal dokter" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doctorId, day, startTime, endTime } = body;

    if (!doctorId || !day || !startTime || !endTime) {
      return NextResponse.json(
        { message: "Semua field jadwal wajib diisi" },
        { status: 400 }
      );
    }

    await connectDB();

    const schedule = await DoctorSchedule.create({
      doctorId,
      day,
      startTime,
      endTime,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    console.error("POST /api/doctor-schedules", err);
    return NextResponse.json(
      { message: "Gagal menambah jadwal dokter" },
      { status: 500 }
    );
  }
}