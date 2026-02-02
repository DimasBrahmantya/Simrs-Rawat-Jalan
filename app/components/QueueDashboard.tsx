"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Monitor,
  Phone,
  CheckCircle2,
  Clock,
  Users,
  Stethoscope,
} from "lucide-react";

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
import { cn } from "@/lib/utils";


import { Patient, PatientStatus } from "@/app/types/patient";

/* ================= STATUS CONFIG ================= */

const statusConfig: Record<
  PatientStatus,
  {
    label: string;
    className: string;
    bgClass: string;
    icon: React.ReactNode;
  }
> = {
  waiting: {
    label: "Menunggu",
    className: "text-waiting border-waiting",
    bgClass: "bg-waiting/10 border-waiting/30",
    icon: <Clock className="w-5 h-5" />,
  },
  called: {
    label: "Dipanggil",
    className: "text-called border-called",
    bgClass: "bg-called/10 border-called/30 animate-pulse-soft",
    icon: <Phone className="w-5 h-5" />,
  },
  completed: {
    label: "Selesai",
    className: "text-completed border-completed",
    bgClass: "bg-completed/10 border-completed/30",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
};

export function QueueDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterPoli, setFilterPoli] = useState("all");

  const today = new Date().toISOString().split("T")[0];

  /* ================= FETCH DB ================= */
  useEffect(() => {
  const fetchQueue = async () => {
    const res = await fetch("/api/queue", { cache: "no-store" });
    const data = await res.json();
    setPatients(data);
  };

  fetchQueue(); // load awal

  const interval = setInterval(fetchQueue, 2000); // ⏱ polling 2 detik

  return () => clearInterval(interval);
}, []);


  const todayPatients = useMemo(() => {
    return patients
      .filter((p) => p.registrationDate === today)
      .filter((p) => filterPoli === "all" || p.poli === filterPoli)
      .sort((a, b) => {
        const priority: Record<PatientStatus, number> = {
          called: 0,
          waiting: 1,
          completed: 2,
        };
        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return a.queueNumber - b.queueNumber;
      });
  }, [patients, today, filterPoli]);

  const [lastSpokenId, setLastSpokenId] = useState<string | null>(null);
  const calledPatient = todayPatients.find((p) => p.status === "called");
  useEffect(() => {
  if (!calledPatient) return;

  if (calledPatient._id === lastSpokenId) return;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // stop suara sebelumnya

    const text = `
      Nomor antrian ${calledPatient.queueDisplay},
      atas nama ${calledPatient.name},
      silakan menuju ${calledPatient.poli}
    `;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9; // kecepatan
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
    setLastSpokenId(calledPatient._id);
  };

  // workaround browser (Safari / Chrome)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
}, [calledPatient, lastSpokenId]);


  const stats = {
    waiting: todayPatients.filter((p) => p.status === "waiting").length,
    called: todayPatients.filter((p) => p.status === "called").length,
    completed: todayPatients.filter((p) => p.status === "completed").length,
    total: todayPatients.length,
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const polis = useMemo(
  () => [...new Set(patients.map((p) => p.poli))],
  [patients]
);
  if (!mounted) return null;

  return (
    /* ================= WRAPPER (SPACING KONSISTEN) ================= */
    <div className="px-2 sm:px-4 space-y-6">
      {/* ================= HEADER ================= */}
      <Card className="overflow-hidden border shadow-md p-0">
        <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Monitor className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold">
                  Dashboard Antrian
                </CardTitle>
                <CardDescription className="text-white/80">
                  {format(new Date(), "EEEE, dd MMMM yyyy", {
                    locale: idLocale,
                  })}
                </CardDescription>
              </div>
            </div>

            <Select value={filterPoli} onValueChange={setFilterPoli}>
              <SelectTrigger className="w-[200px] bg-white/20 border-white/30 text-white">
                <Stethoscope className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Semua Poli" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Semua Poli</SelectItem>
                {polis.map((poli) => (
                  <SelectItem key={poli} value={poli}>
                    {poli}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Hari Ini" value={stats.total} />
        <StatCard
          icon={Clock}
          label="Menunggu"
          value={stats.waiting}
          color="text-waiting"
        />
        <StatCard
          icon={Phone}
          label="Dipanggil"
          value={stats.called}
          color="text-called"
        />
        <StatCard
          icon={CheckCircle2}
          label="Selesai"
          value={stats.completed}
          color="text-completed"
        />
      </div>

      {/* ================= CALLED ================= */}
      {calledPatient && (
        <Card className="border-2 border-called shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-called mb-4">
              <Phone className="w-6 h-6 animate-bounce-soft" />
              <span className="text-lg font-semibold uppercase">
                Sedang Dipanggil
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-7xl font-bold text-primary">
                  {calledPatient.queueDisplay}
                </p>
                <p className="text-2xl">{calledPatient.name}</p>
              </div>

              <div className="text-center md:text-right">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {calledPatient.poli}
                </Badge>
                <p className="text-muted-foreground">
                  {calledPatient.doctorName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ================= HELPER ================= */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <p className={cn("text-3xl font-bold", color)}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
