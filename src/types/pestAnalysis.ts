import { InfestationLevel } from './recommendations';

export type QuarterPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface MonthlyTreatmentStep {
  monthIndex: 1 | 2 | 3;
  monthName: string; // e.g. "Bulan ke-1 (Oktober)", "Bulan ke-1"
  treatmentTitle: string; // e.g. "Sanitasi Total & Deteksi Dini", "Space Thermal Fogging", "Fumigasi Kedap Gas Total"
  treatmentType: 'FUMIGASI' | 'SPRAYING' | 'FOGGING' | 'SANITASI_MONITORING' | 'KOMBINASI';
  actionSummary: string; // Ringkasan langkah teknis lapangan
  protocolSteps: string[]; // SOP tahapan mingguan
  recommendedMedicineId?: string;
  recommendedMedicineName: string; // e.g. "Quickphos 56 TB", "Actellic 500 EC"
  activeIngredients?: string; // e.g. "Aluminium Phosphide 56%", "Pirimiphos-methyl 500 g/L"
  dosageGuideline: string; // e.g. "3-5 Tablet per Ton bahan baku" atau "10-20 mL / Liter pelarut"
  estimatedQuantity?: number;
  medicineUnit?: string;
  targetFocus: string; // e.g. "Imago serangga terbang & celah perimeter", "Tumpukan curah & larva tersembunyi"
  safetyRequirements: string; // e.g. "Masker Canister B3 Phosphine, Evakuasi radius 15m"
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface QuarterlyPestPlan {
  id: string;
  year: number; // e.g. 2026
  quarter: QuarterPeriod; // Q1, Q2, Q3, Q4
  quarterLabel: string; // e.g. "Triwulan IV (Okt - Des 2026)"
  infestationLevel: InfestationLevel; // RINGAN | SEDANG | BERAT_KRITIS
  commodityTarget: string; // e.g. "Beras Premium IR-64 & Biji Jagung Pipil"
  locationTarget: string; // e.g. "Gudang Utama A & Silo Vertikal"
  identifiedPests: string[]; // e.g. ["Sitophilus oryzae", "Tribolium castaneum"]
  riskScore: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'KRITIS';
  monthlyTreatments: MonthlyTreatmentStep[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  linkedSpkNumbers?: string[];
}

export interface PestIntensityCategoryStats {
  level: InfestationLevel;
  label: string;
  count: number;
  percentage: number;
  standardThreshold: string;
  description: string;
  recommendedActionSummary: string;
  primaryPests: string[];
  affectedCommodities: string[];
}
