import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies(); // 🔥 WAJIB await
  const auth = cookieStore.get("auth");

  if (auth?.value === "admin") {
    return NextResponse.json({ role: "admin" });
  }

  return NextResponse.json(
    { role: "guest" },
    { status: 401 }
  );
}
