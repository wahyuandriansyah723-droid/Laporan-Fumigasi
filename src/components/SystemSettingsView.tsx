import React, { useState } from 'react';
import { SystemSettings } from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  Settings,
  Building,
  ShieldAlert,
  Hash,
  Printer,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Sliders,
  Lock,
} from 'lucide-react';

interface SystemSettingsViewProps {
  settings: SystemSettings;
  currentUser?: AuthUser;
  onSaveSettings: (newSettings: SystemSettings) => void;
  onExportFullBackup: () => void;
  onImportBackup: (jsonData: any) => void;
  onResetFactoryData: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onExportFullBackup,
  onImportBackup,
  onResetFactoryData,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleChange = (
    field: keyof SystemSettings,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportBackup(parsed);
        setImportError(null);
      } catch (err) {
        setImportError('File JSON tidak valid atau struktur data rusak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Pengaturan & Konfigurasi Sistem Gudang
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sesuaikan identitas operasional, ambang batas peringatan K3, penomoran dokumen otomatis, format cetak, dan pencadangan database.
            </p>
          </div>
        </div>

        {currentUser && !currentUser.permissions.canManageSettings ? (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700/80">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Mode Baca (Perlu Hak Admin)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        )}
      </div>

      {currentUser && !currentUser.permissions.canManageSettings && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Anda saat ini masuk sebagai <strong>{currentUser.name} ({currentUser.roleTitle})</strong>. Bagian pengaturan sistem, format surat jalan, dan pencadangan database hanya dapat diubah oleh Administrator Gudang.
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Konfigurasi sistem berhasil disimpan dan langsung diterapkan ke seluruh modul gudang!</span>
        </div>
      )}

      {importError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Profil Perusahaan & Gudang */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Building className="w-4 h-4 text-amber-400" />
            <span>1. Profil Identitas Perusahaan & Gudang Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nama Resmi Perusahaan
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nama Fasilitas Gudang / Depo
              </label>
              <input
                type="text"
                value={formData.warehouseName}
                onChange={(e) => handleChange('warehouseName', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">
                Alamat Lengkap Gudang
              </label>
              <textarea
                value={formData.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                rows={2}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nomor Telepon & Hotline Darurat
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Email Operasional Gudang
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Nomor Izin Karantina Barantan ISPM-15 / Kemenaker
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Kepala Gudang (Warehouse Manager)
                </label>
                <input
                  type="text"
                  value={formData.warehouseManager}
                  onChange={(e) => handleChange('warehouseManager', e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Petugas K3 B3 (HSE Officer)
                </label>
                <input
                  type="text"
                  value={formData.hseOfficer}
                  onChange={(e) => handleChange('hseOfficer', e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ambang Batas & Peringatan Proaktif */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>2. Ambang Batas Stok & Protokol Peringatan Proaktif</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Batas Minimum Default Item Baru
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.defaultMinThreshold}
                  onChange={(e) => handleChange('defaultMinThreshold', parseInt(e.target.value) || 10)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono font-bold"
                />
                <span className="text-slate-400 font-mono">Unit / Pcs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Nilai default saat menambah komoditas baru tanpa konfigurasi manual.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Peringatan Level Tangki BBM
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.fuelWarningPercentage}
                  onChange={(e) => handleChange('fuelWarningPercentage', parseInt(e.target.value) || 20)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono font-bold text-amber-400"
                />
                <span className="text-slate-400 font-mono">% Kapasitas Tangki</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Alarm visual tangki berbunyi saat kapasitas Solar/Pertamax berada di bawah level ini.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Peringatan Masa Kadaluarsa (ED)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={formData.expiryWarningDays}
                  onChange={(e) => handleChange('expiryWarningDays', parseInt(e.target.value) || 60)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono font-bold text-yellow-400"
                />
                <span className="text-slate-400 font-mono">Hari Sebelum ED</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Bahan aktif fumigan dan insektisida yang mendekati tanggal ini masuk notifikasi prioritas.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="enableAudioVisualAlerts"
                checked={formData.enableAudioVisualAlerts}
                onChange={(e) => handleChange('enableAudioVisualAlerts', e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-amber-500 cursor-pointer"
              />
              <div>
                <label htmlFor="enableAudioVisualAlerts" className="text-xs font-bold text-white cursor-pointer">
                  Aktifkan Banner Peringatan Restock Proaktif di Dashboard
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Secara proaktif memunculkan rekomendasi restock dan estimasi biaya di baris atas ketika stok menyentuh ambang batas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="strictBatchAndExpiryRequired"
                checked={formData.strictBatchAndExpiryRequired}
                onChange={(e) => handleChange('strictBatchAndExpiryRequired', e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-amber-500 cursor-pointer"
              />
              <div>
                <label htmlFor="strictBatchAndExpiryRequired" className="text-xs font-bold text-white cursor-pointer">
                  Mode Kepatuhan Ketat: Wajibkan Nomor Batch & Tanggal Expired pada Kimia HazMat
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Memastikan seluruh komoditas Phosphine, Methyl Bromide, dan cairan insektisida tercatat data batch-nya demi audit Barantan & ISO.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Format Penomoran Dokumen Otomatis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Hash className="w-4 h-4 text-blue-400" />
            <span>3. Standarisasi Format Penomoran Dokumen & SKU</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium font-mono">
                Prefix Surat Jalan Pengeluaran (OUT)
              </label>
              <input
                type="text"
                value={formData.prefixSuratJalanOut}
                onChange={(e) => handleChange('prefixSuratJalanOut', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-400 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Hasil: {formData.prefixSuratJalanOut}-20260923-102
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium font-mono">
                Prefix Bukti Penerimaan (IN)
              </label>
              <input
                type="text"
                value={formData.prefixSuratJalanIn}
                onChange={(e) => handleChange('prefixSuratJalanIn', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Hasil: {formData.prefixSuratJalanIn}-20260923-458
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium font-mono">
                Prefix Penyesuaian Stock Opname
              </label>
              <input
                type="text"
                value={formData.prefixStockOpname}
                onChange={(e) => handleChange('prefixStockOpname', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-purple-400 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Hasil: {formData.prefixStockOpname}-20260923-882
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Format Cetak Surat Jalan & Dokumen */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>4. Pengaturan Cetak Surat Jalan & Label Barcode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Format Ukuran Kertas Cetak Surat Jalan
              </label>
              <select
                value={formData.paperSize}
                onChange={(e) => handleChange('paperSize', e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white"
              >
                <option value="A4">A4 Standar (HVS / PDF Lembar Penuh)</option>
                <option value="CONTINUOUS_3PLY">Continuous Form Dot-Matrix (3-Ply Rangkap NCR)</option>
                <option value="THERMAL_80MM">Thermal Printer Kasir (80mm Struk Ringkas)</option>
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCompanyHeaderOnPrint"
                  checked={formData.showCompanyHeaderOnPrint}
                  onChange={(e) => handleChange('showCompanyHeaderOnPrint', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 cursor-pointer"
                />
                <label htmlFor="showCompanyHeaderOnPrint" className="text-slate-300 cursor-pointer">
                  Cetak Kop / Header Resmi Perusahaan di Surat Jalan
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showIspmComplianceNote"
                  checked={formData.showIspmComplianceNote}
                  onChange={(e) => handleChange('showIspmComplianceNote', e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 cursor-pointer"
                />
                <label htmlFor="showIspmComplianceNote" className="text-slate-300 cursor-pointer">
                  Sertakan Pernyataan Kepatuhan Standar Karantina ISPM-15 & Penanganan B3
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">
                Catatan Footer Standar pada Surat Jalan
              </label>
              <textarea
                value={formData.notesFooterSuratJalan}
                onChange={(e) => handleChange('notesFooterSuratJalan', e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Pencadangan & Pemulihan Database */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-purple-400" />
            <span>5. Pencadangan, Pemulihan & Reset Database Gudang</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Export Backup */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Pencadangan Penuh (Backup JSON)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Unduh seluruh database (Barang, Mutasi Transaksi, Master Data & Pengaturan) sebagai arsip cadangan aman.
                </p>
              </div>
              <button
                type="button"
                onClick={onExportFullBackup}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold transition-colors cursor-pointer text-center"
              >
                Unduh File Backup (.json)
              </button>
            </div>

            {/* Import Backup */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Pemulihan Data (Restore JSON)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Unggah file cadangan JSON untuk memulihkan seluruh data riwayat gudang.
                </p>
              </div>
              <label className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold transition-colors cursor-pointer text-center block">
                <span>Pilih File Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset Data */}
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
                  <RotateCcw className="w-4 h-4" />
                  Reset ke Data Sampel Awal
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kembalikan database inventaris, master data, dan riwayat mutasi ke konfigurasi demo bawaan.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetFactoryData}
                className="w-full py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold transition-colors cursor-pointer text-center"
              >
                Reset Database Pabrik
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Dock */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 font-mono">
            Versi Sistem: LOGIX-WMS v2.4 (Enterprise Edition)
          </span>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
