import React, { useState, useEffect } from 'react';
import {
  RawMaterialRecommendation,
  TreatmentExecutionRecord,
  TreatmentExecutionType,
} from '../types/recommendations';
import { InventoryItem } from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  CheckCircle2,
  X,
  Calendar,
  Beaker,
  Building2,
  Scale,
  UserCheck,
  Send,
  AlertCircle,
  FileCheck2,
  Flame,
  Bug,
  Sparkles,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface TreatmentExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RawMaterialRecommendation | null;
  items: InventoryItem[];
  currentUser: AuthUser;
  onConfirmExecution: (
    recommendationId: string,
    executionRecord: TreatmentExecutionRecord,
    stockDeduction?: { itemId: string; quantity: number }
  ) => void;
}

export const TreatmentExecutionModal: React.FC<TreatmentExecutionModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  items,
  currentUser,
  onConfirmExecution,
}) => {
  const [treatmentType, setTreatmentType] = useState<TreatmentExecutionType>('FUMIGASI');
  const [executionDate, setExecutionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Obat yang digunakan
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [usedMedicineName, setUsedMedicineName] = useState<string>('');
  const [usedMedicineQuantity, setUsedMedicineQuantity] = useState<string>('');
  const [usedMedicineUnit, setUsedMedicineUnit] = useState<string>('Tablet');
  const [deductStock, setDeductStock] = useState<boolean>(true);

  // Gudang & Jumlah Tonase Bahan Baku
  const [warehouseLocation, setWarehouseLocation] = useState<string>('');
  const [treatedTonnage, setTreatedTonnage] = useState<string>('');
  const [tonnageUnit, setTonnageUnit] = useState<string>('Ton');

  // Pelaksana & Catatan
  const [executedBy, setExecutedBy] = useState<string>(currentUser.name);
  const [executionNotes, setExecutionNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const medicineItems = items.filter(
    (i) => i.category === 'FUMIGASI' || i.category === 'SPRAYING_FOGGING'
  );

  // Pre-fill on open from recommendation
  useEffect(() => {
    if (isOpen && recommendation) {
      setExecutionDate(new Date().toISOString().slice(0, 10));
      setWarehouseLocation(recommendation.location);
      setTreatedTonnage(String(recommendation.quantity));
      setTonnageUnit(recommendation.quantityUnit || 'Ton');
      setExecutedBy(currentUser.name);
      setErrorMessage('');

      // Guess treatment type
      if (recommendation.recommendedMedicineName.toLowerCase().includes('spray')) {
        setTreatmentType('SPRAYING');
      } else if (recommendation.recommendedMedicineName.toLowerCase().includes('fog')) {
        setTreatmentType('FOGGING');
      } else {
        setTreatmentType('FUMIGASI');
      }

      // Pre-fill medicine
      const matched = items.find(
        (i) =>
          i.id === recommendation.recommendedMedicineId ||
          i.name.toLowerCase() === recommendation.recommendedMedicineName.toLowerCase() ||
          i.name.toLowerCase().includes('fumiphos') ||
          i.name.toLowerCase().includes('phostoxin')
      );

      if (matched) {
        setSelectedMedicineId(matched.id);
        setUsedMedicineName(matched.name);
        setUsedMedicineUnit(matched.unit);
      } else {
        setSelectedMedicineId('');
        setUsedMedicineName(recommendation.recommendedMedicineName);
        setUsedMedicineUnit(recommendation.medicineUnit || 'Tablet');
      }

      setUsedMedicineQuantity(
        recommendation.estimatedMedicineQty
          ? String(recommendation.estimatedMedicineQty)
          : '1000'
      );

      setExecutionNotes(
        `Perlakuan ${recommendation.commodityName} (Lot ${recommendation.batchOrLotNo}) telah selesai dikerjakan sesuai dosis rekomendasi QC.`
      );
    }
  }, [isOpen, recommendation, currentUser.name, items]);

  if (!isOpen || !recommendation) return null;

  const currentMedicineItem = items.find((i) => i.id === selectedMedicineId);
  const parsedTonnage = parseFloat(treatedTonnage) || 0;
  const parsedMedQty = parseFloat(usedMedicineQuantity) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!executionDate) {
      setErrorMessage('Tanggal pengerjaan wajib diisi.');
      return;
    }
    if (!usedMedicineName.trim()) {
      setErrorMessage('Nama obat yang digunakan wajib diisi.');
      return;
    }
    if (!warehouseLocation.trim()) {
      setErrorMessage('Gudang / lokasi penyimpanan bahan baku wajib diisi.');
      return;
    }
    if (!parsedTonnage || parsedTonnage <= 0) {
      setErrorMessage('Jumlah tonase bahan baku yang dikerjakan wajib valid.');
      return;
    }

    const executionRecord: TreatmentExecutionRecord = {
      treatmentType,
      executionDate,
      usedMedicineId: selectedMedicineId || undefined,
      usedMedicineName: usedMedicineName.trim(),
      usedMedicineQuantity: parsedMedQty > 0 ? parsedMedQty : undefined,
      usedMedicineUnit: usedMedicineUnit.trim(),
      warehouseLocation: warehouseLocation.trim(),
      treatedTonnage: parsedTonnage,
      tonnageUnit: tonnageUnit.trim(),
      executedBy: executedBy.trim() || currentUser.name,
      executionNotes: executionNotes.trim() || undefined,
      completedAt: new Date().toISOString(),
    };

    const stockDeduction =
      deductStock && selectedMedicineId && parsedMedQty > 0
        ? {
            itemId: selectedMedicineId,
            quantity: parsedMedQty,
          }
        : undefined;

    onConfirmExecution(recommendation.id, executionRecord, stockDeduction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Konfirmasi Pengerjaan Selesai
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {recommendation.recommendationNo}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Input data realisasi bahwa rekomendasi bahan baku ini <strong>sudah dilakukan Fumigasi, Spraying, atau Fogging</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commodity Target Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Bahan Baku / Komoditas Target:</div>
            <div className="font-bold text-white text-sm">
              {recommendation.commodityName} <span className="font-mono text-amber-400 text-xs">(Lot: {recommendation.batchOrLotNo})</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Hama Target: <strong className="text-rose-300">{recommendation.targetPests}</strong>
            </div>
          </div>
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
            Target QC: {formatNumberID(recommendation.quantity)} {recommendation.quantityUnit}
          </span>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="execution-form" className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Input 1: Perintah Jenis Pengerjaan (Fumigasi / Spraying / Fogging) */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              1. Perintah Jenis Pengerjaan yang Telah Dilakukan <span className="text-rose-400">*</span>:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTreatmentType('FUMIGASI')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  treatmentType === 'FUMIGASI'
                    ? 'bg-purple-600/25 border-purple-500 text-white font-bold ring-1 ring-purple-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Beaker className="w-4 h-4 text-purple-400" />
                <span className="text-xs">Fumigasi Gas</span>
                <span className="text-[10px] text-slate-400 font-normal">Sungkup / Silo PH3/CH3Br</span>
              </button>

              <button
                type="button"
                onClick={() => setTreatmentType('SPRAYING')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  treatmentType === 'SPRAYING'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Bug className="w-4 h-4 text-emerald-400" />
                <span className="text-xs">Spraying Permukaan</span>
                <span className="text-[10px] text-slate-400 font-normal">Residual Insektisida</span>
              </button>

              <button
                type="button"
                onClick={() => setTreatmentType('FOGGING')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  treatmentType === 'FOGGING'
                    ? 'bg-amber-600/25 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs">Thermal Fogging</span>
                <span className="text-[10px] text-slate-400 font-normal">Pengasapan Ruang Terbuka</span>
              </button>
            </div>
          </div>

          {/* Input 2: Tanggal Pengerjaan & Gudang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Tanggal Pengerjaan <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="date"
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Gudang / Lokasi Penyimpanan <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                placeholder="Contoh: Gudang Utama A - Silo 03, Bay 02"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Input 3: Jumlah Tonase Bahan Baku */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Jumlah Tonase Bahan Baku yang Dikerjakan <span className="text-rose-400">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="number"
                  step="any"
                  value={treatedTonnage}
                  onChange={(e) => setTreatedTonnage(e.target.value)}
                  placeholder="Contoh: 450"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select
                  value={tonnageUnit}
                  onChange={(e) => setTonnageUnit(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Ton">Ton</option>
                  <option value="Kg">Kg</option>
                  <option value="Karung (Sak)">Karung (Sak)</option>
                  <option value="Pallet">Pallet</option>
                  <option value="m³">m³ (Kubik)</option>
                </select>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              *Pastikan jumlah tonase sesuai dengan volume bahan baku yang dijangkau oleh gas fumigan / insektisida.
            </div>
          </div>

          {/* Input 4: Obat yang Digunakan */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5" />
              <span>Obat Kimia yang Digunakan &amp; Realisasi Pemakaian</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Obat dari Inventaris Gudang
                </label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => {
                    setSelectedMedicineId(e.target.value);
                    const found = items.find((i) => i.id === e.target.value);
                    if (found) {
                      setUsedMedicineName(found.name);
                      setUsedMedicineUnit(found.unit);
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Input Manual / Pilih dari Stok --</option>
                  {medicineItems.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} (Tersedia: {formatNumberID(med.currentStock)} {med.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Obat yang Digunakan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={usedMedicineName}
                  onChange={(e) => setUsedMedicineName(e.target.value)}
                  placeholder="Contoh: Fumiphos 56 TB (PH3)"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Jumlah Obat Keluar
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={usedMedicineQuantity}
                    onChange={(e) => setUsedMedicineQuantity(e.target.value)}
                    placeholder="Contoh: 1350"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Satuan Obat
                  </label>
                  <input
                    type="text"
                    value={usedMedicineUnit}
                    onChange={(e) => setUsedMedicineUnit(e.target.value)}
                    placeholder="Tablet / Kg"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <span>Otomatis potong stok obat di inventaris gudang</span>
                </label>
              </div>
            </div>
          </div>

          {/* Input 5: Operator Pelaksana & Catatan Lapangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Operator / Teknisi Pelaksana</span>
              </label>
              <input
                type="text"
                value={executedBy}
                onChange={(e) => setExecutedBy(e.target.value)}
                placeholder="Nama teknisi / tim pelaksana"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Catatan Hasil Pengerjaan Lapangan
              </label>
              <textarea
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                rows={2}
                placeholder="Contoh: Fumigasi sungkup terpal PVC rapat 180 mikron, sand snake ganda, konsentrasi gas awal 600 ppm, perimeter aman."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>

          <button
            type="submit"
            form="execution-form"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan Status: Sudah Dilakukan {treatmentType}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
