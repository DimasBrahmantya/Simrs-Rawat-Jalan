"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  FileText,
  Phone,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Calendar as CalendarIcon,
  User,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

import { cn } from "@/lib/utils";
import { PatientStatus } from "@/app/types/patient";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= STATUS CONFIG ================= */
const statusConfig: Record<
  PatientStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  waiting: {
    label: "Menunggu",
    className: "bg-waiting text-waiting-foreground",
    icon: <Clock className="w-3 h-3" />,
  },
  called: {
    label: "Dipanggil",
    className: "bg-called text-called-foreground animate-pulse-soft",
    icon: <Phone className="w-3 h-3" />,
  },
  completed: {
    label: "Selesai",
    className: "bg-completed text-completed-foreground",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

export function MonitoringDashboard() {
  const [visits, setVisits] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filterPoli, setFilterPoli] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterMonth, setFilterMonth] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);

  /* ================= FETCH DB ================= */
  useEffect(() => {
    const fetchVisits = async () => {
      const res = await fetch("/api/visits", { cache: "no-store" });
      const data = await res.json();
      setVisits(data);
    };
    const fetchDoctors = async () => {
      const res = await fetch("/api/doctors", { cache: "no-store" });
      const data = await res.json();
      setDoctors(data);
    };
    fetchVisits();
    fetchDoctors();
  }, []);

  /* ================= FILTER DOCTOR ================= */
  const filteredDoctors = useMemo(() => {
    if (filterPoli === "all") return doctors;
    return doctors.filter((d) => d.poliId?.name === filterPoli);
  }, [filterPoli, doctors]);

  /* ================= FILTER VISIT ================= */
  const filteredVisits = useMemo(() => {
    return visits
      .filter((v) => {
        const date = new Date(v.registrationDate);
        const matchMonth =
          date.getMonth() === filterMonth.getMonth() &&
          date.getFullYear() === filterMonth.getFullYear();

        const matchPoli = filterPoli === "all" || v.poliId?.name === filterPoli;
        const matchDoctor =
          filterDoctor === "all" || v.doctorId?._id === filterDoctor;

        return matchMonth && matchPoli && matchDoctor;
      })
      .sort(
        (a, b) =>
          new Date(b.registrationDate).getTime() -
          new Date(a.registrationDate).getTime(),
      );
  }, [visits, filterMonth, filterPoli, filterDoctor]);

  /* ================= UPDATE STATUS ================= */
  const handleCall = async (visitId: string) => {
    console.log("handleCall called with visitId:", visitId); // Tambahkan ini
    console.log("Type of visitId:", typeof visitId); // Tambahkan ini

    if (!visitId || visitId.length !== 24) {
      // ObjectId MongoDB biasanya 24 karakter
      console.error("Invalid visitId:", visitId);
      return;
    }

    // Set semua visit lain di poli yang sama dengan status "called" menjadi "completed"
    const visitToCall = visits.find((v) => v._id === visitId);
    console.log("visitToCall:", visitToCall); // Tambahkan ini
    if (visitToCall) {
      const poliId = visitToCall.poliId._id;
      console.log("poliId:", poliId); // Tambahkan ini
      const calledInPoli = visits.filter(
        (v) =>
          v.poliId._id === poliId && v.status === "called" && v._id !== visitId,
      );
      console.log("calledInPoli to complete:", calledInPoli); // Tambahkan ini
      for (const v of calledInPoli) {
        console.log("Completing visit:", v._id); // Tambahkan ini
        const completeRes = await fetch(`/api/visits/${v._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete" }),
        });
        console.log("Complete response status:", completeRes.status); // Tambahkan ini
      }
    }

    // Panggil visit yang dipilih
    console.log("Calling visit:", visitId); // Tambahkan ini
    const res = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call" }),
    });

    console.log("Call response status:", res.status); // Tambahkan ini
    if (res.ok) {
      console.log("Call successful, reloading visits"); // Tambahkan ini
      // reload ulang dari DB biar konsisten
      const refreshed = await fetch("/api/visits", { cache: "no-store" });
      setVisits(await refreshed.json());
    } else {
      console.error("Call failed, response:", await res.text()); // Tambahkan ini
    }
  };
  const handleComplete = async (visitId: string) => {
    const res = await fetch(`/api/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });

    if (res.ok) {
      const refreshed = await fetch("/api/visits", { cache: "no-store" });
      setVisits(await refreshed.json());
    }
  };

  /* ================= PDF ================= */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rekapitulasi Kunjungan Pasien", 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Periode: ${format(filterMonth, "MMMM yyyy", { locale: idLocale })}`,
      14,
      28,
    );

    autoTable(doc, {
      startY: 36,
      head: [["No", "Nama", "Antrian", "Poli", "Dokter", "Tanggal", "Status"]],
      body: filteredVisits.map((v, i) => [
        i + 1,
        v.patientId?.name || "N/A",
        v.queueDisplay,
        v.poliId?.name || "N/A",
        v.doctorId?.name || "N/A",
        format(new Date(v.registrationDate), "dd/MM/yyyy"),
        statusConfig[v.status as PatientStatus].label,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] },
    });

    doc.save(`rekap-kunjungan-${format(filterMonth, "yyyy-MM")}.pdf`);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const polis = useMemo(
    () => [...new Set(visits.map((v) => v.poliId?.name).filter(Boolean))],
    [visits],
  );
  if (!mounted) return null;

  return (
    <Card className="w-full rounded-2xl border bg-background shadow-md p-0">
      <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Monitoring Kunjungan
              </CardTitle>
              <CardDescription className="text-white/80">
                Rekap & pengelolaan kunjungan pasien rawat jalan
              </CardDescription>
            </div>
          </div>

          <Button onClick={generatePDF} variant="secondary" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-4">
        <div className="bg-background rounded-xl px-6 pb-6 pt-4 space-y-6">
          {/* FILTER */}
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />

            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
                  {format(filterMonth, "MMMM yyyy", { locale: idLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={filterMonth}
                  onSelect={(d) => {
                    if (d) setFilterMonth(d);
                    setDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Select
              value={filterPoli}
              onValueChange={(v) => {
                setFilterPoli(v);
                setFilterDoctor("all");
              }}
            >
              <SelectTrigger className="h-11 w-[180px] rounded-lg">
                <SelectValue placeholder="Semua Poli" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Semua Poli</SelectItem>
                {polis.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDoctor} onValueChange={setFilterDoctor}>
              <SelectTrigger className="h-11 w-[220px] rounded-lg">
                <SelectValue placeholder="Semua Dokter" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Semua Dokter</SelectItem>
                {filteredDoctors.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TABLE */}
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Antrian</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Poli</TableHead>
                  <TableHead>Dokter</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={7} className="h-24 text-center">
                      <User className="mx-auto mb-2" />
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-bold relative pointer-events-auto">
                        {v.queueDisplay}
                      </TableCell>
                      <TableCell>{v.patientId?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {v.poliId?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{v.doctorId?.name || "N/A"}</TableCell>
                      <TableCell>
                        {format(new Date(v.registrationDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "gap-1",
                            statusConfig[v.status as PatientStatus].className,
                          )}
                        >
                          {statusConfig[v.status as PatientStatus].icon}
                          {statusConfig[v.status as PatientStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right relative z-20 pointer-events-auto">
                        {v.status === "waiting" && (
                          <Button
                            size="sm"
                            onClick={() => handleCall(v._id)}
                            className="cursor-pointer pointer-events-auto"
                          >
                            Panggil
                          </Button>
                        )}
                        {v.status === "called" && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(v._id)}
                            className="cursor-pointer pointer-events-auto"
                          >
                            Selesai
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
