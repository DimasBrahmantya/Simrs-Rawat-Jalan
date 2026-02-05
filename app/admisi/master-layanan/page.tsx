"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { Stethoscope, Layers, CalendarClock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Layout } from "../../components/Layout";

export default function MasterLayananPage() {
  const [polis, setPolis] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const poliForm = useForm<{ name: string; code: string }>({
    defaultValues: { name: "", code: "" },
  });
  const doctorForm = useForm<{ name: string; poliId: string }>({
    defaultValues: { name: "", poliId: "" },
  });
  const scheduleForm = useForm<{
    doctorId: string;
    day: string;
    startTime: string;
    endTime: string;
  }>({
    defaultValues: { doctorId: "", day: "", startTime: "", endTime: "" },
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, s] = await Promise.all([
        fetch("/api/polis").then((r) => r.json()),
        fetch("/api/doctors").then((r) => r.json()),
        fetch("/api/doctor-schedules").then((r) => r.json()),
      ]);
      setPolis(p);
      setDoctors(d);
      setSchedules(s);
    } catch (error) {
      console.error("Error reloading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePoli = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus poli ini?")) {
      try {
        await fetch(`/api/polis/${id}`, { method: "DELETE" });
        reload();
      } catch (error) {
        console.error("Error deleting poli:", error);
      }
    }
  };

  const deleteDoctor = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus dokter ini?")) {
      try {
        await fetch(`/api/doctors/${id}`, { method: "DELETE" });
        reload();
      } catch (error) {
        console.error("Error deleting doctor:", error);
      }
    }
  };

  const deleteSchedule = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        await fetch(`/api/doctor-schedules/${id}`, { method: "DELETE" });
        reload();
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-6xl mx-auto rounded-2xl border shadow-lg overflow-hidden p-0">
        {/* HEADER */}
        <CardHeader className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-5">
          <CardTitle className="text-2xl font-bold">Master Layanan</CardTitle>
          <CardDescription className="text-white/80">
            Kelola Poli, Dokter, dan Jadwal dengan mudah
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          {/* ===== POLI ===== */}
          <section className="space-y-4 border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg flex gap-2 items-center text-sky-700">
              <Layers className="w-6 h-6" /> Master Poli
            </h3>

            <form
              onSubmit={poliForm.handleSubmit(async (d) => {
                try {
                  await fetch("/api/polis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(d),
                  });
                  poliForm.reset();
                  reload();
                } catch (error) {
                  console.error("Error adding poli:", error);
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...poliForm.register("name", { required: "Nama poli wajib diisi" })}
                  placeholder="Nama Poli"
                  className="border-gray-300 focus:border-sky-500"
                />
                <Input
                  {...poliForm.register("code", { required: "Kode poli wajib diisi" })}
                  placeholder="Kode (U/G/A)"
                  className="border-gray-300 focus:border-sky-500"
                />
              </div>
              <Button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" /> Tambah Poli
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Daftar Poli:</h4>
              {polis.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {polis.map((p) => (
                    <div key={p._id} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {p.name} ({p.code})
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePoli(p._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada poli.</p>
              )}
            </div>
          </section>

          {/* ===== DOKTER ===== */}
          <section className="space-y-4 border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg flex gap-2 items-center text-sky-700">
              <Stethoscope className="w-6 h-6" /> Master Dokter
            </h3>

            <form
              onSubmit={doctorForm.handleSubmit(async (d) => {
                try {
                  await fetch("/api/doctors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(d),
                  });
                  doctorForm.reset();
                  reload();
                } catch (error) {
                  console.error("Error adding doctor:", error);
                }
              })}
              className="space-y-4"
            >
              <Input
                {...doctorForm.register("name", { required: "Nama dokter wajib diisi" })}
                placeholder="Nama Dokter"
                className="border-gray-300 focus:border-sky-500"
              />

              <Controller
                control={doctorForm.control}
                name="poliId"
                rules={{ required: "Poli wajib dipilih" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-gray-300 focus:border-sky-500">
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
                )}
              />

              <Button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" /> Tambah Dokter
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Daftar Dokter:</h4>
              {doctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {doctors.map((d) => (
                    <div key={d._id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Poli: {d.poliId?.name || "Tidak ditemukan"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDoctor(d._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada dokter.</p>
              )}
            </div>
          </section>

          {/* ===== JADWAL ===== */}
          <section className="space-y-4 border rounded-xl p-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg flex gap-2 items-center text-sky-700">
              <CalendarClock className="w-6 h-6" /> Jadwal Dokter
            </h3>

            <form
              onSubmit={scheduleForm.handleSubmit(async (d) => {
                try {
                  await fetch("/api/doctor-schedules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(d),
                  });
                  scheduleForm.reset();
                  reload();
                } catch (error) {
                  console.error("Error adding schedule:", error);
                }
              })}
              className="space-y-4"
            >
              <Controller
                control={scheduleForm.control}
                name="doctorId"
                rules={{ required: "Dokter wajib dipilih" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-gray-300 focus:border-sky-500">
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
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  {...scheduleForm.register("day", { required: "Hari wajib diisi" })}
                  placeholder="Hari (e.g., Senin)"
                  className="border-gray-300 focus:border-sky-500"
                />
                <Input
                  {...scheduleForm.register("startTime", { required: "Waktu mulai wajib diisi" })}
                  placeholder="Waktu Mulai (e.g., 08:00)"
                  className="border-gray-300 focus:border-sky-500"
                />
                <Input
                  {...scheduleForm.register("endTime", { required: "Waktu selesai wajib diisi" })}
                  placeholder="Waktu Selesai (e.g., 12:00)"
                  className="border-gray-300 focus:border-sky-500"
                />
              </div>

              <Button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2"
                disabled={loading}
              >
                <Plus className="w-4 h-4" /> Tambah Jadwal
              </Button>
            </form>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Daftar Jadwal:</h4>
              {schedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map((s) => (
                    <div key={s._id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          Dokter: {s.doctorId?.name || "Tidak ditemukan"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Hari: {s.day} | Waktu: {s.startTime} - {s.endTime}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(s._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada jadwal.</p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
}