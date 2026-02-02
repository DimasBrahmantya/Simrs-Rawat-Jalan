"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Login gagal");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm rounded-2xl overflow-hidden shadow-md p-0">
        {/* HEADER */}
        <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-5 py-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-3 bg-white/20 rounded-xl">
              <LogIn className="w-5 h-5" />
            </div>
            Login Admisi
          </CardTitle>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 rounded-lg font-semibold text-white
              bg-gradient-to-r from-sky-600 to-cyan-500
              hover:opacity-90 transition"
          >
            {loading ? "Masuk..." : "Login"}
          </Button>

          {/* LINK REGISTER */}
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-sky-600 font-medium hover:underline"
            >
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
