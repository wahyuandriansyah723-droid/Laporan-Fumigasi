export type JobType = 'FUMIGASI' | 'SPRAYING_FOGGING';

export type QCRecommendation = 'OK' | 'BELUM_OK' | 'FUMIGASI_ULANG' | 'SPRAYING_ULANG' | 'PENDING';

export type QCApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface FumigationJobReport {
  id: string;
  jobNo: string; // e.g. SPK-FUM-2026-081, SPK-FOG-2026-092
  jobType: JobType;
  title: string;
  clientName: string;
  location: string;

  // FORMAT BERITA ACARA PENGENDALIAN HAMA (PLT-WRH-FM 01-09 - PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung)
  formCode?: string; // default 'PLT-WRH-FM 01-09'
  companyName?: string; // default 'PT. JAPFA COMFEED INDONESIA Tbk'
  unitName?: string; // default 'Unit Lampung'
  documentTitle?: string; // default 'BERITA ACARA PENGENDALIAN HAMA'
  requestDate?: string; // 1. Tanggal Permintaan
  rawMaterialName: string; // 2. Nama Bahan Baku (e.g. Jagung Pipil, Soybean Meal, Beras, Wheat Pollard)
  rawMaterialBatch?: string; // 3. Batch (e.g. BATCH-JPF-2026-088)
  tonnage?: string; // 4. Tonase (e.g. 1.250 Ton)
  warehouseKavling?: string; // 5. Gudang/ Kavling (e.g. Gudang 03 / Kavling K-04)
  fumigantName?: string; // 6. Nama Fumigan (e.g. Quickphos 56 TB / Phostoxin)
  fumigantQuantityStr?: string; // 7. Jumlah Fumigan (e.g. 150 Flask / 150.000 Tablet)
  controlType?: string; // 8. Jenis Pengendalian (e.g. Fumigasi (Gassing) Cover Sheet)
  executionDay?: string; // Hari dilakukan (e.g. Senin)
  closingDate: string; // Tanggal dilakukan / Tanggal tutup
  openingDay?: string; // Hari dibuka plastik cover sheet (e.g. Kamis)
  openingDate: string; // Tanggal dibuka plastik cover sheet / aerasi

  // Tanda Tangan & Personil
  fumigationOperatorTitle?: string; // 'Fimigation Opr'
  warehouseSupervisorName?: string; // 'RM WH Supervisor' (e.g. Agus Pranoto / Sutrisno)
  qcSupervisorName?: string; // 'QC Supervisor' (e.g. Ratna Dewi, S.Si)

  targetObject: string; // e.g. "Palka Kapal MV Samudera Perkasa 02 (4.500 Ton Beras)", "Silo Jagung"
  targetPest?: string; // e.g. "Sitophilus oryzae, Tribolium castaneum"
  executionDate: string; // YYYY-MM-DD
  aerationDate?: string; // YYYY-MM-DD
  operatorName: string; // Teknisi/Operator yang melaksanakan
  operatorNip?: string;

  // Obat Kimia yang dikeluarkan & digunakan (terhubung ke inventaris gudang)
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
