// api/visits/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Visit from "@/app/models/Visit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Ubah ke Promise
) {
  const { id } = await params; // Await params

  console.log("PATCH /api/visits/[id] called with id:", id);

  await connectDB();

  const { action } = await req.json();
  console.log("Action:", action);

  let update: any = {};
  if (action === "call") {
    update.status = "called";
  } else if (action === "complete") {
    update.status = "completed";
  } else {
    return NextResponse.json({ message: "Action invalid" }, { status: 400 });
  }

  const visit = await Visit.findByIdAndUpdate(id, update, { new: true })
    .populate("patientId", "name")
    .populate("poliId", "name")
    .populate("doctorId", "name");

  if (!visit) {
    console.log("Visit not found for id:", id);
    return NextResponse.json({ message: "Visit not found" }, { status: 404 });
  }

  console.log("Visit updated:", visit);
  return NextResponse.json(visit);
}