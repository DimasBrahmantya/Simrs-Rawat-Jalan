"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ClipboardList,
  Monitor,
  FileText,
  Building2,
  ClipboardCheck,
  Settings,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Pendaftaran", href: "/", icon: ClipboardList },
  { name: "Admisi", href: "/admisi", icon: ClipboardCheck },
  { name: "Monitoring", href: "/monitoring", icon: FileText },
  { name: "Dashboard Antrian", href: "/dashboard", icon: Monitor },
  { name: "Master Layanan", href: "/admisi/master-layanan", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 pl-2 md:pl-10">
            <div className="p-2 gradient-primary rounded-lg">
              <Building2 className="w-5 h-5 text-primary-foreground text-white/100" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg">SIMRS</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                Rawat Jalan
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navigation
              .filter((item) => (isAdmin ? true : item.href === "/"))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="ml-2 bg-red-600 hover:bg-red-700"
              >
                Logout
              </Button>
            )}
          </nav>

          {/* Mobile Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="container py-4 space-y-2">
              {navigation
                .filter((item) => (isAdmin ? true : item.href === "/"))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              {isAdmin && (
                <Button
                    variant="destructive"
                    className="w-full mt-2 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </Button>
                )}
              </nav>
            </div>
          )}
        </header>

        {/* Main */}
        <main className="container py-6 flex-1 px-2 sm:px-4">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-muted/30">
          <div className="container py-6 text-center text-sm text-muted-foreground">
            © 2026 Sistem Informasi Rumah Sakit – Rawat Jalan
          </div>
        </footer>
      </div>
    );
  }