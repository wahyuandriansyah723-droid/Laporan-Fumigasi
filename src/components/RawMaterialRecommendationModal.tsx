import React, { useState, useEffect } from 'react';
import { RawMaterialRecommendation, InfestationLevel } from '../types/recommendations';
import { InventoryItem } from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  FileCheck2,
  X,
  Bug,
  Building2,
  Calendar,
  Beaker,
  Fuel,
  Send,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Sparkles,
  Flame,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface RawMaterialRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  items: InventoryItem[];
  existingRecommendation?: RawMaterialRecommendation | null;
  initialTreatmentType?: 'FUMIGASI' | 'SPRAYING_FOGGING';
  onSaveRecommendation: (rec: RawMaterialRecommendation) => void;
}

export const RawMaterialRecommendationModal: React.FC<RawMaterialRecommendationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  items,
  existingRecommendation,
  initialTreatmentType,
  onSaveRecommendation,
}) => {
  const [treatmentType, setTreatmentType] = useState<'FUMIGASI' | 'SPRAYING_FOGGING' | 'KOMBINASI'>(
    existingRecommendation?.recommendedTreatmentType || initialTreatmentType || 'FUMIGASI'
  );
  const [commodityName, setCommodityName] = useState(
    existingRecommendation?.commodityName || ''
  );
  const [batchOrLotNo, setBatchOrLotNo] = useState(
    existingRecommendation?.batchOrLotNo || ''
  );
  const [quantity, setQuantity] = useState(
    existingRecommendation ? String(existingRecommendation.quantity) : ''
  );
  const [quantityUnit, setQuantityUnit] = useState(
    existingRecommendation?.quantityUnit || 'Ton'
  );
  const [location, setLocation] = useState(
    existingRecommendation?.location || ''
  );
  const [storageCondition, setStorageCondition] = useState(
    existingRecommendation?.storageCondition || ''
  );

  // Hasil Inspeksi Hama
  const [targetPests, setTargetPests] = useState(
    existingRecommendation?.targetPests || ''
  );
  const [infestationLevel, setInfestationLevel] = useState<InfestationLevel>(
    existingRecommendation?.infestationLevel || 'SEDANG'
  );
  const [inspectionDate, setInspectionDate] = useState(
    existingRecommendation?.inspectionDate || new Date().toISOString().slice(0, 10)
  );
  const [targetDeadline, setTargetDeadline] = useState(
    existingRecommendation?.targetFumigationDeadline ||
      new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );

  // Rekomendasi Bahan Kimia & BBM
  const medicineItems = items.filter(
    (i) => i.category === 'FUMIGASI' || i.category === 'SPRAYING_FOGGING'
  );
  const fuelItems = items.filter((i) => i.category === 'BBM');

  const [selectedMedicineId, setSelectedMedicineId] = useState(
    existingRecommendation?.recommendedMedicineId || ''
  );
  const [customMedicineName, setCustomMedicineName] = useState(
    existingRecommendation?.recommendedMedicineName || ''
  );
  const [dosage, setDosage] = useState(
    existingRecommendation?.recommendedDosage || '3 Tablet / Ton komoditas (Target 500 ppm)'
  );
  const [estMedicineQty, setEstMedicineQty] = useState(
    existingRecommendation ? String(existingRecommendation.estimatedMedicineQty) : ''
  );
  const [medicineUnit, setMedicineUnit] = useState(
    existingRecommendation?.medicineUnit || 'Tablet'
  );

  const [selectedFuelId, setSelectedFuelId] = useState(
    existingRecommendation?.recommendedFuelId || ''
  );
  const [customFuelName, setCustomFuelName] = useState(
    existingRecommendation?.recommendedFuelName || 'Solar B35 (Genset & Blower)'
  );
  const [estFuelQty, setEstFuelQty] = useState(
    existingRecommendation?.estimatedFuelQty ? String(existingRecommendation.estimatedFuelQty) : '20'
  );

  const [aerationHours, setAerationHours] = useState(
    existingRecommendation ? String(existingRecommendation.minimumAerationHours) : '72'
  );
  const [safetyNotes, setSafetyNotes] = useState(
    existingRecommendation?.safetyNotes ||
      'Wajib pasang perimeter gas beracun 15 meter, monitor sensor kebocoran PH3, dan gunakan masker canister kuning.'
  );

  useEffect(() => {
    if (isOpen) {
      if (existingRecommendation) {
        setTreatmentType(existingRecommendation.recommendedTreatmentType || 'FUMIGASI');
        setCommodityName(existingRecommendation.commodityName);
        setBatchOrLotNo(existingRecommendation.batchOrLotNo);
        setQuantity(String(existingRecommendation.quantity));
        setQuantityUnit(existingRecommendation.quantityUnit || 'Ton');
        setLocation(existingRecommendation.location);
        setStorageCondition(existingRecommendation.storageCondition || '');
        setTargetPests(existingRecommendation.targetPests);
        setInfestationLevel(existingRecommendation.infestationLevel || 'SEDANG');
        setInspectionDate(existingRecommendation.inspectionDate);
        setTargetDeadline(existingRecommendation.targetFumigationDeadline);
        setSelectedMedicineId(existingRecommendation.recommendedMedicineId || '');
        setCustomMedicineName(existingRecommendation.recommendedMedicineName || '');
        setDosage(existingRecommendation.recommendedDosage || '');
        setEstMedicineQty(String(existingRecommendation.estimatedMedicineQty || ''));
        setMedicineUnit(existingRecommendation.medicineUnit || 'Tablet');
        setSelectedFuelId(existingRecommendation.recommendedFuelId || '');
        setCustomFuelName(existingRecommendation.recommendedFuelName || '');
        setEstFuelQty(existingRecommendation.estimatedFuelQty ? String(existingRecommendation.estimatedFuelQty) : '');
        setAerationHours(String(existingRecommendation.minimumAerationHours || 72));
        setSafetyNotes(existingRecommendation.safetyNotes || '');
      } else {
        const type = initialTreatmentType || 'FUMIGASI';
        setTreatmentType(type);
        setCommodityName('');
        setBatchOrLotNo('');
        setQuantity('');
        setQuantityUnit('Ton');
        setLocation('');
        setStorageCondition('');
        setTargetPests('');
        setInfestationLevel('SEDANG');
        setInspectionDate(new Date().toISOString().slice(0, 10));
        setTargetDeadline(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
        setSelectedMedicineId('');
        setSelectedFuelId('');

        if (type === 'FUMIGASI') {
          setDosage('3 Tablet / Ton komoditas (Target 500 ppm)');
          setCustomMedicineName('Fumiphos 56 TB (PH3)');
          setMedicineUnit('Tablet');
          setCustomFuelName('');
          setEstFuelQty('');
          setAerationHours('72');
          setSafetyNotes('Wajib pasang perimeter gas beracun 15 meter, monitor sensor kebocoran PH3, dan gunakan masker canister kuning.');
        } else {
          setDosage('50 ml / 10 Liter Solar (Dosis Pengasapan 100 m²)');
          setCustomMedicineName('Actellic 500 EC / Malathion 57 EC');
          setMedicineUnit('Liter');
          setCustomFuelName('Solar B35 (Pelarut Mesin Fogger / ULV)');
          setEstFuelQty('20');
          setAerationHours('12');
          setSafetyNotes('Gunakan masker respirator gas uap organik. Kosongkan area gudang selama proses pengasapan hingga ventilasi 6 jam selesai.');
        }
      }
    }
  }, [isOpen, existingRecommendation, initialTreatmentType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodityName || !batchOrLotNo || !quantity || !location || !targetPests) {
      alert('Mohon lengkapi data bahan baku, lot, lokasi, dan temuan hama.');
      return;
    }

    const selectedMed = medicineItems.find((i) => i.id === selectedMedicineId);
    const selectedFuel = fuelItems.find((i) => i.id === selectedFuelId);
    const isFumigasi = treatmentType === 'FUMIGASI';

    const recData: RawMaterialRecommendation = {
      id: existingRecommendation ? existingRecommendation.id : `rec-bb-${Date.now()}`,
      recommendationNo: existingRecommendation
        ? existingRecommendation.recommendationNo
        : `REC-BB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      commodityName: commodityName.trim(),
      batchOrLotNo: batchOrLotNo.trim(),
      quantity: parseFloat(quantity) || 0,
      quantityUnit: quantityUnit.trim(),
      location: location.trim(),
      storageCondition: storageCondition.trim() || undefined,
      targetPests: targetPests.trim(),
      infestationLevel,
      inspectionDate,
      targetFumigationDeadline: targetDeadline,
      recommendedTreatmentType: treatmentType,
      recommendedMedicineId: selectedMed?.id || undefined,
      recommendedMedicineName: selectedMed?.name || customMedicineName.trim() || (isFumigasi ? 'Fumiphos 56 TB (PH3)' : 'Actellic 500 EC'),
      recommendedDosage: dosage.trim(),
      estimatedMedicineQty: parseFloat(estMedicineQty) || 0,
      medicineUnit: selectedMed?.unit || medicineUnit.trim(),
      // Fumigasi: tidak ada BBM mesin
      recommendedFuelId: !isFumigasi && selectedFuel ? selectedFuel.id : undefined,
      recommendedFuelName: !isFumigasi ? (selectedFuel?.name || customFuelName.trim() || undefined) : undefined,
      estimatedFuelQty: !isFumigasi && estFuelQty ? parseFloat(estFuelQty) : undefined,
      fuelUnit: !isFumigasi ? 'Liter' : undefined,
      minimumAerationHours: parseInt(aerationHours, 10) || 48,
      safetyNotes: safetyNotes.trim(),
      inspectorName: currentUser.name,
      inspectorNip: currentUser.nip,
      createdAt: existingRecommendation ? existingRecommendation.createdAt : new Date().toISOString(),
      status: existingRecommendation ? existingRecommendation.status : 'TERKIRIM',
      linkedSpkNo: existingRecommendation?.linkedSpkNo,
      linkedJobReportId: existingRecommendation?.linkedJobReportId,
      processedByOperator: existingRecommendation?.processedByOperator,
      processedAt: existingRecommendation?.processedAt,
    };

    onSaveRecommendation(recData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {existingRecommendation
                    ? `Edit Rekomendasi ${existingRecommendation.recommendationNo}`
                    : treatmentType === 'FUMIGASI'
                    ? 'Rekomendasi Fumigasi Bahan Baku Baru (QC)'
                    : 'Rekomendasi Spraying & Fogging Bahan Baku Baru (QC)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  QC &rarr; OPERATOR &amp; ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rekomendasi inspeksi komoditas yang terhubung langsung ke Operator untuk dieksekusi dan Admin untuk diaudit.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="raw-rec-form" className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Section 1: Data Bahan Baku / Komoditas */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>1. Identitas Bahan Baku &amp; Lokasi Penyimpanan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Komoditas / Bahan Baku <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={commodityName}
                  onChange={(e) => setCommodityName(e.target.value)}
                  placeholder="Contoh: Beras Premium IR-64, Biji Jagung Pipil, Biji Kopi"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nomor Batch / Lot Bahan Baku <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={batchOrLotNo}
                  onChange={(e) => setBatchOrLotNo(e.target.value)}
                  placeholder="Contoh: LOT-BRS-2026-B04"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Jumlah / Tonase <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Contoh: 500"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Satuan
                  </label>
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Ton">Ton</option>
                    <option value="Karung (Sak)">Karung (Sak)</option>
                    <option value="Pallet">Pallet</option>
                    <option value="m³ (Volume)">m³ (Volume)</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Lokasi / Silo / Gudang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Silo 04 Gudang A, Depo Barat Kontainer 02"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Kondisi Penumpukan / Penyimpanan
                </label>
                <input
                  type="text"
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                  placeholder="Contoh: Tumpukan 20 layer terpal tertutup, Curah dalam silo sirkulasi"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Temuan Hasil Inspeksi QC */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bug className="w-4 h-4" />
              <span>2. Temuan Hasil Inspeksi Hama oleh QC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Jenis Hama Target yang Ditemukan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={targetPests}
                  onChange={(e) => setTargetPests(e.target.value)}
                  placeholder="Contoh: Sitophilus oryzae (Kutu Beras), Tribolium castaneum, Rhyzopertha"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tingkat Infestasi Hama <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['RINGAN', 'SEDANG', 'BERAT_KRITIS'] as InfestationLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setInfestationLevel(level)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[10px] border transition-all cursor-pointer ${
                        infestationLevel === level
                          ? level === 'BERAT_KRITIS'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : level === 'SEDANG'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {level === 'BERAT_KRITIS' ? 'BERAT / KRITIS' : level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tanggal Inspeksi
                  </label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Batas Waktu
                  </label>
                  <input
                    type="date"
                    value={targetDeadline}
                    onChange={(e) => setTargetDeadline(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pilihan Perintah Perlakuan QC: Fumigasi vs Spraying & Fogging */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Pilihan Perintah Perlakuan dari QC:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTreatmentType('FUMIGASI');
                  setDosage('3 Tablet / Ton komoditas (Target 500 ppm)');
                  setCustomMedicineName('Fumiphos 56 TB (PH3)');
                  setMedicineUnit('Tablet');
                  setCustomFuelName('Solar B35 (Genset & Blower)');
                  setAerationHours('72');
                  setSafetyNotes('Wajib pasang perimeter gas beracun 15 meter, monitor sensor kebocoran PH3, dan gunakan masker canister kuning.');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  treatmentType === 'FUMIGASI'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Fumigasi Karantina</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Sungkup gas PH3/Fosfin komoditas tertutup rapat.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTreatmentType('SPRAYING_FOGGING');
                  setDosage('50 ml / 10 Liter Solar (Dosis Pengasapan 100 m²)');
                  setCustomMedicineName('Actellic 500 EC / Malathion 57 EC');
                  setMedicineUnit('Liter');
                  setCustomFuelName('Solar B35 (Pelarut Mesin Fogger / ULV)');
                  setAerationHours('12');
                  setSafetyNotes('Gunakan masker respirator gas uap organik. Kosongkan area gudang selama proses pengasapan hingga ventilasi 6 jam selesai.');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  treatmentType === 'SPRAYING_FOGGING'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                  <Bug className="w-3.5 h-3.5" />
                  <span>Spraying &amp; Fogging</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Pengasapan thermal fogging ruang gudang &amp; spraying permukaan.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTreatmentType('KOMBINASI');
                  setDosage('Fumigasi: 3 Tab/Ton + Fogging Ruang: 50 ml/10L Solar');
                  setCustomMedicineName('Fumiphos 56 TB + Actellic 500 EC');
                  setMedicineUnit('Paket');
                  setCustomFuelName('Solar B35 (Fogger & Blower)');
                  setAerationHours('72');
                  setSafetyNotes('Lakukan fumigasi sungkup terlebih dahulu, dilanjutkan space fogging di koridor dan sekeliling gudang.');
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  treatmentType === 'KOMBINASI'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kombinasi Terpadu</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Fumigasi sungkup gas + pengasapan fogging keliling gudang.</p>
              </button>
            </div>
          </div>

          {/* Section 3: Rekomendasi Bahan Kimia, Dosis & BBM */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Beaker className="w-4 h-4" />
              <span>
                3. Rekomendasi Obat{' '}
                {treatmentType === 'SPRAYING_FOGGING'
                  ? 'Spraying & Fogging & BBM Pelarut Mesin'
                  : treatmentType === 'KOMBINASI'
                  ? 'Fumigasi, Fogging & BBM Mesin'
                  : 'Fumigasi Sungkup (Bebas BBM Mesin)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Bahan Kimia dari Stok Gudang (Opsional)
                </label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => {
                    setSelectedMedicineId(e.target.value);
                    const selected = medicineItems.find((i) => i.id === e.target.value);
                    if (selected) {
                      setCustomMedicineName(selected.name);
                      setMedicineUnit(selected.unit);
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Rekomendasi Manual / Pilih dari Stok --</option>
                  {medicineItems.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} (Stok: {formatNumberID(med.currentStock)} {med.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Obat Kimia Rekomendasi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={customMedicineName}
                  onChange={(e) => setCustomMedicineName(e.target.value)}
                  placeholder="Contoh: Fumiphos 56 TB (Aluminium Phosphide)"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dosis Rekomendasi Resmi QC
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Contoh: 3 Tablet per Ton (Konsentrasi 500 ppm)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Estimasi Jumlah Obat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={estMedicineQty}
                    onChange={(e) => setEstMedicineQty(e.target.value)}
                    placeholder="Contoh: 1500"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Satuan Obat
                  </label>
                  <input
                    type="text"
                    value={medicineUnit}
                    onChange={(e) => setMedicineUnit(e.target.value)}
                    placeholder="Tablet / Kaleng / Kg"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {treatmentType !== 'FUMIGASI' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    BBM Pelarut Mesin Fogger / ULV (Liter)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customFuelName}
                      onChange={(e) => setCustomFuelName(e.target.value)}
                      placeholder="Solar B35"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                    <input
                      type="number"
                      value={estFuelQty}
                      onChange={(e) => setEstFuelQty(e.target.value)}
                      placeholder="Liter"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Fumigasi menggunakan sungkup gas kedap udara — <strong>tidak menggunakan BBM mesin</strong>.</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Minimal Waktu Aerasi Bebas Gas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={aerationHours}
                    onChange={(e) => setAerationHours(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                  <span className="text-slate-400">Jam (Standar Barantan)</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Catatan K3, Batas Perimeter &amp; Instruksi Khusus
                </label>
                <textarea
                  value={safetyNotes}
                  onChange={(e) => setSafetyNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-slate-400 text-[11px] font-mono hidden sm:block">
            Inspektur: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.roleTitle})
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="raw-rec-form"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Rekomendasi ke Operator &amp; Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
