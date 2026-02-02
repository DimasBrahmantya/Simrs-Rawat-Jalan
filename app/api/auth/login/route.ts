import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return NextResponse.json({ message: "Password salah" }, { status: 401 });
  }

  const res = NextResponse.json({
    id: user._id,
    name: user.name,
    role: user.role,
  });

  res.cookies.set("auth", "admin", {
    httpOnly: true,
    path: "/",
  });

  return res;
}
