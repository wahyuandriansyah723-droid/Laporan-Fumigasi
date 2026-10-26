export type JobType = 'FUMIGASI' | 'SPRAYING_FOGGING';

export type QCRecommendation = 'OK' | 'BELUM_OK' | 'FUMIGASI_ULANG' | 'PENDING';

export type QCApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface FumigationJobReport {
  id: string;
  jobNo: string; // e.g. SPK-FUM-2026-081, SPK-FOG-2026-092
  jobType: JobType;
  title: string;
  clientName: string;
  location: string;
  targetObject: string; // e.g. "Palka Kapal MV Samudera Perkasa 02 (4.500 Ton Beras)", "Silo Jagung"
  targetPest?: string; // e.g. "Sitophilus oryzae, Tribolium castaneum"
  executionDate: string; // YYYY-MM-DD
  aerationDate?: string; // YYYY-MM-DD
  operatorName: string; // Teknisi/Operator yang melaksanakan
  operatorNip?: string;

  // Obat Kimia yang dikeluarkan & digunakan
  medicineItemId?: string;
  medicineSku?: string;
  medicineName: string;
  medicineBatchNo?: string;
  medicineQuantity: number;
  medicineUnit: string;

  // BBM / Pelarut yang dikeluarkan & digunakan
  fuelItemId?: string;
  fuelSku?: string;
  fuelName?: string;
  fuelQuantity?: number;
  fuelUnit?: string;

  // Parameter Teknis Lapangan
  gasConcentrationPpm?: number; // e.g. 500 ppm
  exposureHours?: number; // e.g. 120 jam (5 hari)
  tarpCondition?: string; // e.g. "Terpal PVC 180 Mikron Kedap Gas, Sand Snake Rapat"
  notes?: string;

  // Evaluasi, Rekomendasi & Approval QC
  qcRecommendation: QCRecommendation; // 'OK' | 'BELUM_OK' | 'FUMIGASI_ULANG' | 'PENDING'
  qcApprovalStatus: QCApprovalStatus; // 'APPROVED' | 'PENDING' | 'REJECTED'
  qcInspector?: string; // e.g. "Ratna Dewi, S.Si"
  qcVerifiedAt?: string; // ISO timestamp
  qcRecommendationNotes?: string; // Catatan rekomendasi inspektur QC
  
  createdAt: string;
}
