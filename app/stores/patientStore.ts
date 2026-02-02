"use client";
import { create } from "zustand";
import { Doctor } from "../types/patient";

function getNextDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

export const doctors: Doctor[] = [
  { id: "1", name: "dr. Ahmad Fauzi, Sp.PD", poli: "Poli Umum", availableDates: getNextDays(7) },
  { id: "2", name: "dr. Siti Rahmawati", poli: "Poli Umum", availableDates: getNextDays(5) },
  { id: "3", name: "drg. Budi Santoso", poli: "Poli Gigi", availableDates: getNextDays(6) },
  { id: "4", name: "drg. Maya Indah", poli: "Poli Gigi", availableDates: getNextDays(4) },
  { id: "5", name: "dr. Dewi Kartika, Sp.A", poli: "Poli Anak", availableDates: getNextDays(7) },
];

interface AppStore {
  doctors: Doctor[];
  getAvailablePolis: () => string[];
  getDoctorsByPoli: (poli: string) => Doctor[];
}

export const useAppStore = create<AppStore>((_, get) => ({
  doctors,

  getAvailablePolis: () => {
    return [...new Set(get().doctors.map((d) => d.poli))];
  },

  getDoctorsByPoli: (poli: string) => {
    return get().doctors.filter((d) => d.poli === poli);
  },
}));
