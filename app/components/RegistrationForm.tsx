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

import { Patient, RegistrationFormData } from "../types/patient";
import { doctors } from "../stores/patientStore";

/* ================= VALIDATION ================= */
const registrationSchema = z.object({
  name: z.string().min(3).max(100),
  ktpNumber: z
    .string()
    .length(16)
    .regex(/^\d{16}$/),
  birthDate: z.string().min(1),
  address: z.string().min(10).max(500),
  doctorId: z.string().min(1),
});

type FormValues = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(
    null,
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      ktpNumber: "",
      birthDate: "",
      address: "",
      doctorId: "",
    },
  });

  const selectedDoctorId = watch("doctorId");
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    setValue("ktpNumber", value, { shouldValidate: true });
  };

  const isDoctorAvailable = (doctor: (typeof doctors)[0]) =>
    today && doctor.availableDates.includes(today);

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        doctorName: selectedDoctor?.name,
        poli: selectedDoctor?.poli,
      }),
    });

    const result = await res.json();

    // ❌ KTP DUPLIKAT
    if (!res.ok) {
      setSubmitError(result.message || "Pendaftaran gagal");
      return;
    }

    // ✅ SUKSES
    setRegisteredPatient(result);
    setShowSuccessDialog(true);
    reset();
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const ktp = watch("ktpNumber");

    if (ktp?.length === 16) {
      fetch(`/api/patients/by-ktp?ktp=${ktp}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setValue("name", data.name);
            setValue("address", data.address);

            // ===== SYNC TANGGAL LAHIR =====
            if (data.birthDate) {
              // asumsi format "dd-MM-yyyy"
              const [day, month, year] = data.birthDate.split("-");
              const parsedDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
              );

              setSelectedDate(parsedDate);
              setValue("birthDate", data.birthDate);
            }
          }
        });
    }
  }, [watch("ktpNumber")]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;

    window.location.reload(); // restore React state
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto rounded-2xl border bg-background shadow-md overflow-hidden p-0">
        {/* ================= HEADER ================= */}
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

        {/* ================= CONTENT ================= */}
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

              {/* Dokter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Pilih Dokter
                </Label>
                <Select
                  value={selectedDoctorId}
                  onValueChange={(v) =>
                    setValue("doctorId", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Pilih dokter yang tersedia" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg rounded-lg z-50">
                    {doctors.map((doctor) => {
                      const available = isDoctorAvailable(doctor);
                      return (
                        <SelectItem
                          key={doctor.id}
                          value={doctor.id}
                          disabled={!available}
                          className="py-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{doctor.name}</span>
                            <span
                              className={cn(
                                "text-xs",
                                available
                                  ? "text-emerald-600"
                                  : "text-muted-foreground",
                              )}
                            >
                              {doctor.poli} —{" "}
                              {available
                                ? "Tersedia hari ini"
                                : "Tidak tersedia"}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Poli */}
              {selectedDoctor && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Poli Tujuan</Label>
                  <div className="h-11 px-4 flex items-center rounded-lg border border-dashed bg-muted/40">
                    <span className="font-medium">{selectedDoctor.poli}</span>
                  </div>
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
