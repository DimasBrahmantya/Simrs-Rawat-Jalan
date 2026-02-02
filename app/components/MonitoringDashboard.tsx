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
import { doctors } from "@/app/stores/patientStore";
import { Patient, PatientStatus } from "@/app/types/patient";

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterPoli, setFilterPoli] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterMonth, setFilterMonth] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);

  /* ================= FETCH DB ================= */
  useEffect(() => {
    const fetchPatients = async () => {
      const res = await fetch("/api/patients", { cache: "no-store" });
      const data = await res.json();
      setPatients(data);
    };
    fetchPatients();
  }, []);

  /* ================= FILTER DOCTOR ================= */
  const filteredDoctors = useMemo(() => {
    if (filterPoli === "all") return doctors;
    return doctors.filter((d) => d.poli === filterPoli);
  }, [filterPoli]);

  /* ================= FILTER PATIENT ================= */
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const date = new Date(p.registrationDate);
        const matchMonth =
          date.getMonth() === filterMonth.getMonth() &&
          date.getFullYear() === filterMonth.getFullYear();

        const matchPoli = filterPoli === "all" || p.poli === filterPoli;
        const matchDoctor =
          filterDoctor === "all" || p.doctorId === filterDoctor;

        return matchMonth && matchPoli && matchDoctor;
      })
      .sort(
        (a, b) =>
          new Date(b.registrationDate).getTime() -
          new Date(a.registrationDate).getTime(),
      );
  }, [patients, filterMonth, filterPoli, filterDoctor]);

  /* ================= UPDATE STATUS ================= */
  const handleCall = async (patientId: string) => {
    const res = await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call" }),
    });

    const updated = await res.json();

    // reload ulang dari DB biar konsisten
    const refreshed = await fetch("/api/patients", { cache: "no-store" });
    setPatients(await refreshed.json());
  };

  const handleComplete = async (patientId: string) => {
    await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });

    const refreshed = await fetch("/api/patients", { cache: "no-store" });
    setPatients(await refreshed.json());
  };

  /* ================= PDF ================= */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rekapitulasi Pendaftaran Pasien", 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Periode: ${format(filterMonth, "MMMM yyyy", { locale: idLocale })}`,
      14,
      28,
    );

    autoTable(doc, {
      startY: 36,
      head: [["No", "Nama", "Antrian", "Poli", "Dokter", "Tanggal", "Status"]],
      body: filteredPatients.map((p, i) => [
        i + 1,
        p.name,
        p.queueDisplay,
        p.poli,
        p.doctorName,
        format(new Date(p.registrationDate), "dd/MM/yyyy"),
        statusConfig[p.status].label,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] },
    });

    doc.save(`rekap-pasien-${format(filterMonth, "yyyy-MM")}.pdf`);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const polis = useMemo(
    () => [...new Set(patients.map((p) => p.poli))],
    [patients],
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
                Monitoring Pendaftaran
              </CardTitle>
              <CardDescription className="text-white/80">
                Rekap & pengelolaan pasien rawat jalan
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
                  <SelectItem key={d.id} value={d.id}>
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
                {filteredPatients.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={7} className="h-24 text-center">
                      <User className="mx-auto mb-2" />
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-bold relative pointer-events-auto">
                        {p.queueDisplay}
                      </TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.poli}</Badge>
                      </TableCell>
                      <TableCell>{p.doctorName}</TableCell>
                      <TableCell>
                        {format(new Date(p.registrationDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "gap-1",
                            statusConfig[p.status].className,
                          )}
                        >
                          {statusConfig[p.status].icon}
                          {statusConfig[p.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right relative z-20 pointer-events-auto">
                        {p.status === "waiting" && (
                          <Button
                            size="sm"
                            onClick={() => handleCall(p._id)}
                            className="cursor-pointer pointer-events-auto"
                          >
                            Panggil
                          </Button>
                        )}
                        {p.status === "called" && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(p._id)}
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
