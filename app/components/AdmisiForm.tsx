"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  User,
  CreditCard,
  Stethoscope,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Patient } from "../types/patient";
import { Layout } from "./Layout";
 
/* ================= VALIDATION ================= */

const schema = z.object({
  ktpNumber: z.string().length(16),
  poliId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduleId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AdmisiForm() {
  const [patient, setPatient] = useState<any>(null);
  const [polis, setPolis] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ktpNumber: "",
      poliId: "",
      doctorId: "",
      scheduleId: "",
    },
  });

  const poliId = watch("poliId");
  const doctorId = watch("doctorId");

  /* ================= LOAD POLI ================= */
  useEffect(() => {
    fetch("/api/polis")
      .then((r) => r.json())
      .then(setPolis);
  }, []);

  /* ================= CARI PASIEN ================= */
  const handleSearchPatient = async () => {
    const ktp = watch("ktpNumber");
    if (ktp.length !== 16) return;

    setLoadingPatient(true);
    setPatient(null);

    const res = await fetch(`/api/patients/by-ktp?ktp=${ktp}`);
    const data = await res.json();

    setPatient(data || null);
    setLoadingPatient(false);
  };

  /* ================= LOAD DOKTER ================= */
  useEffect(() => {
    if (!poliId) return;

    setDoctors([]);
    setValue("doctorId", "");
    setValue("scheduleId", "");

    fetch(`/api/doctors?poliId=${poliId}`)
      .then((r) => r.json())
      .then(setDoctors);
  }, [poliId]);

  /* ================= LOAD JADWAL ================= */
  useEffect(() => {
    if (!doctorId) return;

    setSchedules([]);
    setValue("scheduleId", "");

    fetch(`/api/doctor-schedules?doctorId=${doctorId}&date=${today}`)
      .then((r) => r.json())
      .then(setSchedules);
  }, [doctorId, today]);

  /* ================= SUBMIT VISIT ================= */
  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);

    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        visitDate: today,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setSubmitError(err.message || "Gagal membuat kunjungan");
      return;
    }

    const result = await res.json();
    setRegisteredPatient(result);
    setShowSuccessDialog(true);
    reset();
    setPatient(null);
  };

  /* ================= PRINT ================= */
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout >
      <div className="w-full px-6 md:px-10">
        <Card className="w-full max-w-5xl rounded-2xl border bg-background shadow-md overflow-hidden border-t-0 p-0">
          <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-5 ">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Admisi Pasien Rawat Jalan
                </CardTitle>
                <CardDescription className="text-white/80">
                  {format(new Date(), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6 px-6 pb-6">
            {/* KTP */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> NIK
              </Label>
              <div className="flex gap-2">
                <Input
                  {...register("ktpNumber")}
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="16 digit NIK"
                  className="h-11 rounded-lg font-mono tracking-wider"
                />
                <Button
                  type="button"
                  onClick={handleSearchPatient}
                  disabled={loadingPatient}
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Cari
                </Button>
              </div>
            </div>

            {/* DATA PASIEN */}
            {patient && (
              <div className="rounded-xl border p-4 bg-muted/30">
                <p className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" /> {patient.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {patient.address}
                </p>
              </div>
            )}

            {/* POLI */}
            <div className="space-y-2">
              <Label>Poli</Label>
              <Select
                value={poliId}
                onValueChange={(v) => setValue("poliId", v)}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Pilih Poli" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                  {polis.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DOKTER */}
            <div className="space-y-2">
              <Label>Pilih Dokter</Label>
              <Select
                value={doctorId}
                onValueChange={(v) => setValue("doctorId", v)}
                disabled={!poliId}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Pilih Dokter" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                  {doctors.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* JADWAL */}
            <div className="space-y-2">
              <Label>Jadwal Praktik</Label>
              <Select
                onValueChange={(v) => setValue("scheduleId", v)}
                disabled={!doctorId}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Pilih Jadwal" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                  {schedules.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.day} — {s.startTime} - {s.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !patient}
              className="w-full h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 transition"
            >
              Daftarkan Kunjungan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ================= SUCCESS DIALOG ================= */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="rounded-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-emerald-600 text-2xl flex items-center justify-center gap-2">
              <CheckCircle2 /> Kunjungan Berhasil
            </DialogTitle>
            <DialogDescription className="text-center">
              Simpan nomor antrian Anda
            </DialogDescription>
          </DialogHeader>

          {registeredPatient && (
            <div className="space-y-4" ref={printRef}>
              <div className="text-center p-6 rounded-xl border bg-emerald-50">
                <p className="text-sm text-muted-foreground">Nomor Antrian</p>
                <p className="text-5xl font-bold text-emerald-600">
                  {registeredPatient.queueDisplay}
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <strong>Nama:</strong> {registeredPatient.name}
                </p>
                <p>
                  <strong>Poli:</strong> {registeredPatient.poli}
                </p>
                <p>
                  <strong>Dokter:</strong> {registeredPatient.doctorName}
                </p>
                <p>
                  <strong>Tanggal:</strong> {registeredPatient.registrationDate}
                </p>
              </div>
              <Button
                onClick={handlePrint}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-500"
              >
                Cetak Nomor Antrian
              </Button>
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-500"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}