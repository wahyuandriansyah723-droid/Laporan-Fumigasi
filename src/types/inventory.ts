export type Category = 'BBM' | 'FUMIGASI' | 'SPRAYING_FOGGING' | 'PERLENGKAPAN';

export type HazardClass = 'FLAMMABLE' | 'TOXIC' | 'CORROSIVE' | 'CAUTION' | 'SAFE';

export interface BatchItem {
  id: string;
  batchNo: string;
  expiredDate?: string; // YYYY-MM-DD
  quantity: number;
  receivedDate: string;
  supplier?: string;
  qcStatus?: 'RELEASED' | 'QUARANTINE' | 'REJECTED';
  coaNumber?: string; // Certificate of Analysis No
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: Category;
  subCategory: string;
  currentStock: number;
  unit: string;
  minimumStockThreshold: number; // Ambang batas stok minimum untuk proactive restocking alert
  minStockAlert?: number; // legacy compatibility
  location: string;
  pricePerUnit: number;
  // Specific fields for BBM (Fuels)
  isFuel?: boolean;
  tankCapacity?: number; // e.g. 5000 Liters
  density?: number; // e.g. 0.84 for Solar
  // Specific fields for Chemicals (Fumigasi & Spraying)
  activeIngredients?: string;
  hazardClass: HazardClass;
  msdsSummary?: string;
  targetPest?: string;
  dosageRecommendation?: string;
  // Batches
  batches: BatchItem[];
  // Metadata
  description?: string;
  lastUpdated: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockTransaction {
  id: string;
  timestamp: string; // ISO string
  type: TransactionType;
  itemId: string;
  sku: string;
  itemName: string;
  category: Category;
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  referenceNo: string; // e.g. SJ-2026/09/012, PO-7712, SPK-FUM-44
  projectOrLocation: string; // e.g. "Fumigasi Kapal MV Samudera 01", "Gudang Bulog", "Operasional Fogging Area Timur"
  operator: string; // Nama Petugas / Teknisi
  batchNo?: string;
  notes?: string;
  qcStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  qcInspector?: string;
  qcVerifiedAt?: string;
  qcNotes?: string;
}

export interface StockOpnameEntry {
  itemId: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes: string;
  audited: boolean;
}

// ================= MASTER DATA INTERFACES =================

export interface MasterSupplier {
  id: string;
  code: string;
  name: string;
  category: Category | 'ALL';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber?: string; // Izin Edar / Kementan / Pertamina
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface MasterLocation {
  id: string;
  code: string;
  name: string;
  zone: string; // e.g. "Bunker B3", "Yard Tangki", "Rak A"
  type: 'TANK' | 'BUNKER' | 'RACK' | 'DRUM_STATION' | 'GENERAL';
  capacity?: string;
  hazmatApproved: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface MasterOperator {
  id: string;
  nip: string;
  name: string;
  role: 'GUDANG' | 'FUMIGATOR' | 'SPRAYER' | 'HSE_OFFICER' | 'MANAGER';
  licenseNo?: string; // e.g. "LIS-BARANTAN-FUM-2024-08"
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MasterProjectDestination {
  id: string;
  code: string;
  name: string;
  clientName: string;
  locationAddress: string;
  activityType: 'FUMIGASI_KAPAL' | 'FUMIGASI_GUDANG' | 'SPRAYING_FOGGING' | 'BBM_ARMADA' | 'UMUM';
  status: 'ACTIVE' | 'COMPLETED';
}

export interface MasterUnit {
  id: string;
  name: string;
  symbol: string;
  category: 'VOLUME' | 'WEIGHT' | 'QUANTITY' | 'PACKAGE';
  description?: string;
}

// ================= NEW MASTER DATA: JENIS OBAT, BBM & INVENTARIS =================

export interface MasterChemicalMedicine {
  id: string;
  code: string; // e.g. OBT-PH3-01, OBT-CH3BR-02
  name: string; // e.g. Quickphos 56 TB (Aluminium Phosphide)
  category: 'FUMIGASI' | 'SPRAYING_FOGGING';
  medicineType: 'TABLET_PH3' | 'GAS_CYLINDER' | 'THERMAL_FOGGING' | 'COLD_ULV' | 'LARVASIDA' | 'RODENTISIDA';
  activeIngredient: string; // e.g. Aluminium Phosphide 56%
  targetPest: string; // e.g. Kutu Beras (Sitophilus oryzae), Tribolium castaneum
  dosageRecommendation: string; // e.g. 2 - 3 tablet/m³ (Paparan min 5 hari)
  hazardClass: HazardClass;
  registrationNumber: string; // e.g. RI.01080120031892 (Kementan) / Barantan
  defaultUnit: string; // e.g. Flask, Tbg 50kg, Btl 1L, Jrg 5L
  standardPrice: number;
  packagingSpec: string; // e.g. Aluminium Flask 1 Kg (334 tablet)
  storageRequirement?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface MasterFuelType {
  id: string;
  code: string; // e.g. BBM-SLR-B35, BBM-PTX-92, BBM-DEX-01
  name: string; // e.g. Solar B35 Industri (Biosolar FAME 35%)
  fuelCategory: 'SOLAR_DIESEL' | 'BENSIN_GASOLINE' | 'PELUMAS_OLI' | 'PELARUT_SOLVENT';
  specification: string; // e.g. Cetane Number min. 51, FAME 35%
  octaneOrCetane: string; // e.g. CN 51, RON 92, SAE 30
  density: number; // e.g. 0.84 kg/L
  flashPoint: string; // e.g. > 52°C
  defaultTankLocation: string; // e.g. Tangki Utama T-01 (Yard Barat)
  defaultUnit: string; // e.g. Liter
  standardPricePerLiter: number;
  minimumAlertThreshold: number; // in Liters, e.g. 500
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface MasterEquipmentInventory {
  id: string;
  code: string; // e.g. EQP-FOG-01, EQP-BLW-02, EQP-DET-03
  name: string; // e.g. Mesin Thermal Fogger Swingfog SN-50
  equipmentType: 'MESIN_FOGGER' | 'BLOWER_AERASI' | 'DETEKTOR_GAS' | 'APD_SAFETY' | 'TERPAL_FUMIGASI' | 'ALAT_SAMPLING';
  brandModel: string; // e.g. Swingtec Germany / SN-50 PE
  serialNumberOrCert: string; // e.g. SN-DE-88291 / CE Mark
  defaultLocation: string; // e.g. Rak B2 - Workshop
  defaultUnit: string; // e.g. Unit, Set, Roll, Pcs
  standardPrice: number;
  maintenanceIntervalDays: number; // in Days, e.g. 30
  calibrationRequired: boolean;
  standardLifespanMonths?: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  notes?: string;
}

export interface MasterCategoryConfig {
  id: Category;
  name: string;
  description: string;
  defaultHazard: HazardClass;
  icon: string;
  subCategories: string[];
}

// ================= SYSTEM SETTINGS INTERFACE =================

export interface SystemSettings {
  // Profil Perusahaan & Gudang
  companyName: string;
  warehouseName: string;
  companyAddress: string;
  phone: string;
  email: string;
  licenseNumber: string; // e.g. "REG-BARANTAN-ISPM15-081/ID-042"
  warehouseManager: string;
  hseOfficer: string;

  // Ambang Batas & Keamanan
  defaultMinThreshold: number;
  fuelWarningPercentage: number; // e.g. 20%
  expiryWarningDays: number; // e.g. 60 days
  enableAudioVisualAlerts: boolean;
  strictBatchAndExpiryRequired: boolean;

  // Penomoran Dokumen Otomatis
  prefixSuratJalanOut: string; // default "SJ-OUT"
  prefixSuratJalanIn: string; // default "SJ-IN"
  prefixStockOpname: string; // default "SO-ADJ"
  prefixSkuBbm: string;
  prefixSkuFumigasi: string;
  prefixSkuSpraying: string;
  prefixSkuPerlengkapan: string;

  // Dokumen Cetak & Format Surat Jalan
  paperSize: 'A4' | 'CONTINUOUS_3PLY' | 'THERMAL_80MM';
  showCompanyHeaderOnPrint: boolean;
  showIspmComplianceNote: boolean;
  notesFooterSuratJalan: string;
}
