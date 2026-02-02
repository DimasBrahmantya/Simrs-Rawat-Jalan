export type PatientStatus = 'waiting' | 'called' | 'completed';

export interface Doctor {
  id: string;
  name: string;
  poli: string;
  availableDates: string[]; // Format: YYYY-MM-DD
}

export interface Patient {
  _id: string;
  name: string;
  ktpNumber: {
  type: String,
  required: true,
  unique: true,
  index: true,
},
  birthDate: string;
  address: string;
  doctorId: string;
  doctorName: string;
  poli: string;
  queueNumber: number;
  queueDisplay: string; // e.g., "A-001"
  registrationDate: string;
  status: PatientStatus;
  createdAt: String;
}

export interface RegistrationFormData {
  name: string;
  ktpNumber: string;
  birthDate: string;
  address: string;
  doctorId: string;
}
