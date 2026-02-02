import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/app/models/Patient";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  // ✅ WAJIB await params
  const { id } = await context.params;

  const { action } = await req.json();

  if (action !== "call" && action !== "complete") {
    return NextResponse.json(
      { message: "Invalid action" },
      { status: 400 }
    );
  }

  const currentPatient = await Patient.findById(id);
  if (!currentPatient) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // ================= CALL =================
  if (action === "call") {
    // tutup pasien lain yang sedang dipanggil (poli + tanggal sama)
    await Patient.updateMany(
      {
        _id: { $ne: currentPatient._id },
        poli: currentPatient.poli,
        registrationDate: currentPatient.registrationDate,
        status: "called",
      },
      { status: "completed" }
    );

    currentPatient.status = "called";
    await currentPatient.save();
  }

  // ================= COMPLETE =================
  if (action === "complete") {
    currentPatient.status = "completed";
    await currentPatient.save();
  }

  return NextResponse.json(currentPatient);
}
