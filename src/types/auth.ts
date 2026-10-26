export type UserRole = 'ADMIN' | 'OPERATOR' | 'QC';

export interface UserPermissions {
  canManageInventory: boolean;      // Tambah / Ubah data barang
  canDeleteItems: boolean;          // Hapus barang dari inventaris
  canCreateTransactions: boolean;   // Input transaksi masuk & keluar
  canAuditStockOpname: boolean;     // Hitung fisik stok opname
  canApplyStockOpname: boolean;     // Terapkan penyesuaian stok opname ke database
  canManageMasterData: boolean;     // Tambah / ubah master data
  canManageSettings: boolean;       // Konfigurasi sistem & reset database
  canPrintLabels: boolean;          // Cetak label barcode & QR code
  canPrintSuratJalan: boolean;      // Cetak surat jalan pengeluaran
  canVerifyQC: boolean;             // Inspeksi kualitas barang, batch & sertifikat CoA
  canDeleteTransactions: boolean;   // Hapus / batalkan riwayat transaksi
  canInputJobReports: boolean;      // Input pekerjaan spraying, fogging & fumigasi (Operator & Admin)
  canEvaluateQCJobs: boolean;       // Berikan rekomendasi (OK / Belum OK / Fumigasi Ulang) & Approve (QC & Admin)
  canCrossCheckAll: boolean;        // Kroscek semua data, mutasi vs pekerjaan vs stok vs QC (Admin)
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  nip: string;
  email: string;
  phone: string;
  avatarColor: string;
  permissions: UserPermissions;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}
