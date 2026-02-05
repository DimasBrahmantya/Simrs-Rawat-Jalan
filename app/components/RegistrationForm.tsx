"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon,
  User,
  CreditCard,
  MapPin,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

/* ================= VALIDATION ================= */
const registrationSchema = z.object({
  name: z.string().regex(/^[A-Za-z\s]+$/, "Nama hanya boleh huruf").min(3),
  ktpNumber: z.string().length(16).regex(/^\d{16}$/),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(10).max(500),
  poliId: z.string().min(1, "Poli wajib dipilih"),
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  scheduleId: z.string().min(1, "Jadwal wajib dipilih"),
  phoneNumber: z.string().regex(/^08\d{8,11}$/, "Nomor HP tidak valid"),
});

type FormValues = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const [polis, setPolis] = useState<any[]>([]);
  const [doctorsByPoli, setDoctorsByPoli] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [today, setToday] = useState("");

  /* ================= INIT ================= */
  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));

    fetch("/api/polis")
      .then((res) => res.json())
      .then(setPolis);
  }, []);

  /* ================= FORM ================= */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
  });

  const selectedPoliId = watch("poliId");
  const selectedDoctorId = watch("doctorId");
  const ktp = watch("ktpNumber");

  /* ================= POLI → DOKTER ================= */
  useEffect(() => {
    if (!selectedPoliId) return;

    fetch(`/api/doctors?poliId=${selectedPoliId}`)
      .then((res) => res.json())
      .then(setDoctorsByPoli);

    setValue("doctorId", "");
    setValue("scheduleId", "");
    setSchedules([]);
  }, [selectedPoliId, setValue]);

  /* ================= DOKTER → JADWAL ================= */
  useEffect(() => {
    if (!selectedDoctorId) return;

    fetch(`/api/doctor-schedules?doctorId=${selectedDoctorId}`)
      .then((res) => res.json())
      .then((data) => {
        // Filter jadwal berdasarkan hari pendaftaran (hari ini)
        const currentDay = format(new Date(), "EEEE", { locale: idLocale }); // e.g., "Senin"
        const filteredSchedules = data.filter((s: any) => s.day === currentDay);
        setSchedules(filteredSchedules);
      });

    setValue("scheduleId", "");
  }, [selectedDoctorId, setValue]);

  /* ================= KTP AUTOFILL ================= */
  useEffect(() => {
    if (ktp?.length !== 16) return;

    fetch(`/api/patients/by-ktp?ktp=${ktp}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        setValue("name", data.name);
        setValue("address", data.address);
        setValue("phoneNumber", data.phoneNumber);

        if (data.birthDate) {
          const [day, month, year] = data.birthDate.split("-");
          const parsedDate = new Date(+year, +month - 1, +day);

          setSelectedDate(parsedDate);
          setValue("birthDate", data.birthDate);
        }
      });
  }, [ktp, setValue]);

  /* ================= HANDLERS ================= */
  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    setValue("ktpNumber", value, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);

    // Cek jika tidak ada jadwal untuk dokter yang dipilih
    if (schedules.length === 0) {
      setSubmitError("Tidak ada jadwal untuk dokter ini pada hari ini. Silakan pilih dokter lain.");
      return;
    }

    const selectedPoli = polis.find((p) => p._id === data.poliId);
    const selectedDoctor = doctorsByPoli.find(
      (d) => d._id === data.doctorId,
    );

    // Buat patient baru
    const patientRes = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        poli: selectedPoli?.name,
        doctorName: selectedDoctor?.name,
      }),
    });

    const patientResult = await patientRes.json();

    if (!patientRes.ok) {
      setSubmitError(patientResult.message || "Pendaftaran gagal");
      return;
    }

    // Buat visit untuk patient yang baru dibuat
    const visitRes = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ktpNumber: data.ktpNumber,
        poliId: data.poliId,
        doctorId: data.doctorId,
        scheduleId: data.scheduleId,
      }),
    });

    const visitResult = await visitRes.json();

    if (!visitRes.ok) {
      setSubmitError(visitResult.message || "Kunjungan gagal dibuat");
      return;
    }

    // Gunakan data dari visit untuk dialog
    setRegisteredPatient({
      ...visitResult,
      name: visitResult.name,
      poli: visitResult.poli,
      doctorName: visitResult.doctorName,
      registrationDate: visitResult.registrationDate,
      queueDisplay: visitResult.queueDisplay,
    });
    setShowSuccessDialog(true);
    reset();
    setSelectedDate(undefined);
  };

  /* ================= PRINT ================= */
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto rounded-2xl border bg-background shadow-md overflow-hidden p-0">
        {/* ================= HEADER ================= */
        <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-5 ">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Form Pendaftaran Pasien
              </CardTitle>
              {today && (
                <CardDescription className="text-white/80">
                  Rawat Jalan —{" "}
                  {format(new Date(), "EEEE, dd MMMM yyyy", {
                    locale: idLocale,
                  })}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        /* ================= CONTENT ================= */}
        <CardContent className="px-6 pb-6 pt-4 bg-muted/0">
          <div className="bg-background rounded-xl px-6 pb-6 pt-4 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nama */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Nama Lengkap
                </Label>
                <Input
                  {...register("name")}
                  placeholder="Masukkan nama sesuai KTP"
                  className="h-11 rounded-lg"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* KTP */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> No KTP (NIK)
                </Label>
                <Input
                  {...register("ktpNumber")}
                  inputMode="numeric"
                  placeholder="16 digit angka"
                  className="h-11 font-mono tracking-wider rounded-lg"
                  onChange={handleKtpChange}
                />
                {submitError && (
                  <p className="text-sm text-destructive font-medium">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Format: 16 digit angka
                  </span>
                  <span
                    className={cn(
                      watch("ktpNumber")?.length === 16
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {watch("ktpNumber")?.length || 0}/16
                  </span>
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Tanggal
                  Lahir
                </Label>
                <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start rounded-lg",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "dd-MM-yyyy")
                        : "Pilih tanggal lahir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="w-auto rounded-xl border bg-white shadow-2xl z-50"
                  >
                    <Calendar
                      className="bg-white scale-95"
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date)
                          setValue("birthDate", format(date, "dd-MM-yyyy"), {
                            shouldValidate: true,
                          });
                        setBirthDateOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* No HP */}
              <div className="space-y-2">
                <Label>Nomor HP</Label>
                <Input
                  {...register("phoneNumber")}
                  placeholder="08xxxxxxxxxx"
                  className="h-11 rounded-lg"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Alamat */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Alamat
                </Label>
                <Textarea
                  {...register("address")}
                  placeholder="Alamat lengkap sesuai KTP"
                  className="min-h-24 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Pilih Poli</Label>
                <Select onValueChange={(v) => setValue("poliId", v)}>
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Pilih poli" />
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

              {selectedPoliId && (
                <div className="space-y-2">
                  <Label>Pilih Dokter</Label>
                  <Select onValueChange={(v) => setValue("doctorId", v)}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Pilih dokter" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                      {doctorsByPoli.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDoctorId && (
                <div className="space-y-2">
                  <Label>Jadwal Dokter</Label>
                  {schedules.length > 0 ? (
                    <Select onValueChange={(v) => setValue("scheduleId", v)}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Pilih jadwal" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                        {schedules.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.day} ({s.startTime} - {s.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada jadwal untuk dokter ini pada hari ini.
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Daftar & Ambil Nomor Antrian
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ================= SUCCESS DIALOG ================= */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="rounded-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-emerald-600 text-2xl flex items-center justify-center gap-2">
              <CheckCircle2 /> Pendaftaran Berhasil
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
    </>
  );
}