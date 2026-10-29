export type InfestationLevel = 'RINGAN' | 'SEDANG' | 'BERAT_KRITIS';

export type RecommendationStatus =
  | 'TERKIRIM' // Terkirim ke Admin & Operator (Menunggu Eksekusi)
  | 'DIPROSES' // Sedang diproses / dibuat SPK oleh Operator
  | 'SELESAI'  // Selesai difumigasi/spraying/fogging dan diverifikasi
  | 'DITOLAK'; // Dibatalkan / Tidak Disetujui

export type TreatmentExecutionType = 'FUMIGASI' | 'SPRAYING' | 'FOGGING';

export interface TreatmentExecutionRecord {
  treatmentType: TreatmentExecutionType; // 'FUMIGASI' | 'SPRAYING' | 'FOGGING'
  executionDate: string; // Tanggal pengerjaan (YYYY-MM-DD)
  usedMedicineId?: string;
  usedMedicineName: string; // Obat yang digunakan
  usedMedicineQuantity?: number;
  usedMedicineUnit?: string;
  warehouseLocation: string; // Gudang / Silo / Lokasi penyimpanan bahan baku
  treatedTonnage: number; // Jumlah tonase bahan baku yang dikerjakan
  tonnageUnit: string; // Ton (default) atau Karung, Pallet, dll
  executedBy: string; // Operator / teknisi yang mengerjakan
  executionNotes?: string;
  completedAt: string; // ISO timestamp
}

export interface RawMaterialRecommendation {
  id: string;
  recommendationNo: string; // e.g. "REC-BB-2026-001"
  commodityName: string; // e.g. "Beras Premium IR-64", "Biji Jagung Pakan Pipil", "Biji Kopi Arabika Gayo Ekspor"
  batchOrLotNo: string; // e.g. "LOT-BRS-2026-X1"
  quantity: number; // e.g. 500
  quantityUnit: string; // Ton, Karung (Sak), Pallet, m³
  location: string; // e.g. "Gudang B - Silo 04", "Depo Kontainer Blok C", "Palka Kapal MV Samudera 02"
  storageCondition?: string; // e.g. "Tumpukan 20 layer terpal tertutup", "Curah dalam Silo"

  // Temuan Hasil Inspeksi QC
  targetPests: string; // e.g. "Sitophilus oryzae (Kutu Beras), Tribolium castaneum"
  infestationLevel: InfestationLevel; // RINGAN | SEDANG | BERAT_KRITIS
  inspectionDate: string; // YYYY-MM-DD
  targetFumigationDeadline: string; // YYYY-MM-DD (Batas waktu eksekusi sebelum hama meluas)

  // Rekomendasi Teknis Bahan & Dosis dari QC
  recommendedTreatmentType?: 'FUMIGASI' | 'SPRAYING_FOGGING' | 'KOMBINASI'; // Perintah perlakuan dari QC
  recommendedMedicineId?: string;
  recommendedMedicineName: string; // e.g. "Fumiphos 56 TB (Aluminium Phosphide)", "Methyl Bromide 98%"
  recommendedDosage: string; // e.g. "3 tablet per Ton (Target konsentrasi gas 500 ppm)"
  estimatedMedicineQty: number; // e.g. 1500
  medicineUnit: string; // Tablet, Kaleng, Kg
  recommendedFuelId?: string;
  recommendedFuelName?: string; // e.g. "Solar B35 (Mesin Blower & Genset)"
  estimatedFuelQty?: number; // e.g. 25
  fuelUnit?: string; // Liter
  minimumAerationHours: number; // e.g. 72 Jam (3 Hari)
  safetyNotes: string; // Catatan K3 & Karantina ISPM-15

  // Metadata Pembuat & Hubungan ke SPK
  inspectorName: string; // e.g. "Ratna Dewi, S.Si (QC)"
  inspectorNip?: string;
  createdAt: string; // ISO string
  status: RecommendationStatus; // TERKIRIM | DIPROSES | SELESAI | DITOLAK
  linkedSpkNo?: string; // No SPK yang mengeksekusi rekomendasi ini
  linkedJobReportId?: string;
  processedByOperator?: string;
  processedAt?: string;
  adminNotes?: string;

  // Catatan Pelaksanaan: Sudah dilakukan Fumigasi/Spraying/Fogging
  treatmentExecutionRecord?: TreatmentExecutionRecord;
}
