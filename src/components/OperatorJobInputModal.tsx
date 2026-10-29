import React, { useState, useEffect } from 'react';
import { InventoryItem, MasterOperator, MasterProjectDestination, SystemSettings } from '../types/inventory';
import { FumigationJobReport, JobType } from '../types/jobs';
import { AuthUser } from '../types/auth';
import { RawMaterialRecommendation } from '../types/recommendations';
import {
  FileCheck2,
  X,
  Flame,
  Bug,
  Building2,
  MapPin,
  Calendar,
  Beaker,
  Fuel,
  Send,
  AlertCircle,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface OperatorJobInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser: AuthUser;
  operators?: MasterOperator[];
  destinations?: MasterProjectDestination[];
  settings?: SystemSettings;
  initialJobType?: JobType;
  initialRecommendation?: RawMaterialRecommendation | null;
  onSaveJobAndDeductStock: (
    jobReport: FumigationJobReport,
    medicineDeduction: { itemId: string; qty: number; batchNo?: string },
    fuelDeduction?: { itemId: string; qty: number; batchNo?: string },
    linkedRecommendationId?: string
  ) => void;
}

export const OperatorJobInputModal: React.FC<OperatorJobInputModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  operators = [],
  destinations = [],
  settings,
  initialJobType,
  initialRecommendation,
  onSaveJobAndDeductStock,
}) => {
  const [jobType, setJobType] = useState<JobType>(initialJobType || 'FUMIGASI');
  const [jobNo, setJobNo] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Spesifikasi Wajib Laporan Fumigasi: Bahan Baku, Tanggal Tutup & Buka
  const [rawMaterialName, setRawMaterialName] = useState<string>('');
  const [closingDate, setClosingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [openingDate, setOpeningDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });

  const [targetObject, setTargetObject] = useState<string>('');
  const [targetPest, setTargetPest] = useState<string>('');
  const [executionDate, setExecutionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [aerationDate, setAerationDate] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>(currentUser.name);

  // Material usage states
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [medicineQty, setMedicineQty] = useState<string>('');
  const [medicineBatchNo, setMedicineBatchNo] = useState<string>('');

  const [selectedFuelId, setSelectedFuelId] = useState<string>('');
  const [fuelQty, setFuelQty] = useState<string>('');
  const [fuelBatchNo, setFuelBatchNo] = useState<string>('');

  // Technical fields
  const [gasConcentrationPpm, setGasConcentrationPpm] = useState<string>('500');
  const [exposureHours, setExposureHours] = useState<string>('120');
  const [tarpCondition, setTarpCondition] = useState<string>('Sungkup terpal PVC kedap gas, sand snake terpasang rapat');
  const [notes, setNotes] = useState<string>('');

  // Error validation
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter available medicines & fuels from inventory
  const availableMedicines = items.filter((i) =>
    jobType === 'FUMIGASI' ? i.category === 'FUMIGASI' : i.category === 'SPRAYING_FOGGING'
  );
  const availableFuels = items.filter((i) => i.category === 'BBM');

  // Auto-generate SPK number or prefill from recommendation
  useEffect(() => {
    if (isOpen) {
      const activeType = initialRecommendation ? 'FUMIGASI' : (initialJobType || jobType);
      setJobType(activeType);
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2);
      const randomNum = Math.floor(100 + Math.random() * 900);
      const prefix = activeType === 'FUMIGASI' ? 'SPK-FUM' : 'SPK-FOG';
      setJobNo(`${prefix}-${dateCode}-${randomNum}`);
      setOperatorName(currentUser.name);
      setErrorMessage('');

      if (initialRecommendation) {
        setJobType('FUMIGASI');
        setTitle(`Fumigasi ${initialRecommendation.commodityName} (${initialRecommendation.batchOrLotNo})`);
        setClientName('Bagian Pergudangan & Silo Bahan Baku');
        setLocation(initialRecommendation.location);
        setRawMaterialName(initialRecommendation.commodityName);
        setClosingDate(new Date().toISOString().slice(0, 10));
        setOpeningDate(initialRecommendation.targetFumigationDeadline || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
        setTargetObject(`${initialRecommendation.commodityName} - ${initialRecommendation.quantity} ${initialRecommendation.quantityUnit}`);
        setTargetPest(initialRecommendation.targetPests);
        setNotes(`Eksekusi Rekomendasi QC ${initialRecommendation.recommendationNo}. Catatan K3: ${initialRecommendation.safetyNotes}`);

        const matchedMed = items.find(
          (i) =>
            i.id === initialRecommendation.recommendedMedicineId ||
            i.name.toLowerCase().includes('fumiphos') ||
            i.name.toLowerCase().includes('phostoxin') ||
            i.category === 'FUMIGASI'
        );
        if (matchedMed) {
          setSelectedMedicineId(matchedMed.id);
          if (matchedMed.batches && matchedMed.batches.length > 0) {
            setMedicineBatchNo(matchedMed.batches[0].batchNo);
          }
        }
        setMedicineQty(String(initialRecommendation.estimatedMedicineQty || 1000));

        if (activeType === 'FUMIGASI') {
          setSelectedFuelId('');
          setFuelQty('');
          setFuelBatchNo('');
        } else {
          const matchedFuel = items.find((i) => i.id === initialRecommendation.recommendedFuelId) || items.find((i) => i.category === 'BBM');
          if (matchedFuel) {
            setSelectedFuelId(matchedFuel.id);
            if (matchedFuel.batches && matchedFuel.batches.length > 0) {
              setFuelBatchNo(matchedFuel.batches[0].batchNo);
            }
          }
          setFuelQty(String(initialRecommendation.estimatedFuelQty || 20));
        }
      } else {
        if (!rawMaterialName) {
          setRawMaterialName(jobType === 'FUMIGASI' ? 'Beras Putih Premium' : 'Stok Komoditas & Dinding Perimeter Gudang');
        }
        if (!closingDate) {
          setClosingDate(new Date().toISOString().slice(0, 10));
        }
        if (!openingDate) {
          const d = new Date();
          d.setDate(d.getDate() + (jobType === 'FUMIGASI' ? 5 : 0));
          setOpeningDate(d.toISOString().slice(0, 10));
        }
        // Auto select first medicine if not selected
        if (availableMedicines.length > 0 && !selectedMedicineId) {
          setSelectedMedicineId(availableMedicines[0].id);
          if (availableMedicines[0].batches && availableMedicines[0].batches.length > 0) {
            setMedicineBatchNo(availableMedicines[0].batches[0].batchNo);
          }
        }

        // Auto select default fuel only if not Fumigasi
        if (activeType !== 'FUMIGASI') {
          if (availableFuels.length > 0 && !selectedFuelId) {
            setSelectedFuelId(availableFuels[0].id);
            if (availableFuels[0].batches && availableFuels[0].batches.length > 0) {
              setFuelBatchNo(availableFuels[0].batches[0].batchNo);
            }
          }
        } else {
          setSelectedFuelId('');
          setFuelQty('');
          setFuelBatchNo('');
        }
      }
    }
  }, [isOpen, jobType, currentUser.name, initialRecommendation]);

  // Adjust defaults when jobType changes
  const handleTypeChange = (newType: JobType) => {
    setJobType(newType);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const prefix = newType === 'FUMIGASI' ? 'SPK-FUM' : 'SPK-FOG';
    setJobNo(`${prefix}-${dateCode}-${randomNum}`);

    if (newType === 'FUMIGASI') {
      setTitle('Fumigasi Palka Kapal / Silo Komoditas');
      setExposureHours('120');
      setGasConcentrationPpm('500');
      setTarpCondition('Sungkup terpal PVC kedap gas, sand snake terpasang rapat');
      // Fumigasi tidak memerlukan BBM mesin sama sekali
      setSelectedFuelId('');
      setFuelQty('');
      setFuelBatchNo('');
    } else {
      setTitle('Thermal Fogging & Spraying Pengendalian Vektor');
      setExposureHours('4');
      setGasConcentrationPpm('');
      setTarpCondition('Area terbuka perimeter luar dan saluran air gudang');
      if (availableFuels.length > 0 && !selectedFuelId) {
        setSelectedFuelId(availableFuels[0].id);
        if (availableFuels[0].batches && availableFuels[0].batches.length > 0) {
          setFuelBatchNo(availableFuels[0].batches[0].batchNo);
        }
      }
    }

    const meds = items.filter((i) =>
      newType === 'FUMIGASI' ? i.category === 'FUMIGASI' : i.category === 'SPRAYING_FOGGING'
    );
    if (meds.length > 0) {
      setSelectedMedicineId(meds[0].id);
      if (meds[0].batches && meds[0].batches.length > 0) {
        setMedicineBatchNo(meds[0].batches[0].batchNo);
      }
    }
  };

  if (!isOpen) return null;

  const currentMedicineItem = items.find((i) => i.id === selectedMedicineId);
  const currentFuelItem = items.find((i) => i.id === selectedFuelId);
  const parsedMedicineQty = parseFloat(medicineQty) || 0;
  const parsedFuelQty = parseFloat(fuelQty) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Judul / nama pekerjaan wajib diisi.');
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage('Nama klien / pemilik komoditas wajib diisi.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Lokasi pekerjaan wajib diisi.');
      return;
    }
    if (!targetObject.trim()) {
      setErrorMessage('Target komoditas / objek pekerjaan wajib diisi.');
      return;
    }
    if (!currentMedicineItem) {
      setErrorMessage('Pilih obat kimia yang digunakan.');
      return;
    }
    if (parsedMedicineQty <= 0) {
      setErrorMessage('Jumlah pemakaian obat kimia harus lebih dari 0.');
      return;
    }
    if (parsedMedicineQty > currentMedicineItem.currentStock) {
      setErrorMessage(
        `Stok obat ${currentMedicineItem.name} tidak mencukupi (Tersedia: ${currentMedicineItem.currentStock} ${currentMedicineItem.unit}, diminta: ${parsedMedicineQty}).`
      );
      return;
    }

    const isFumigasi = jobType === 'FUMIGASI';

    // BBM checks only apply for Spraying & Fogging
    if (!isFumigasi && currentFuelItem && parsedFuelQty > 0 && parsedFuelQty > currentFuelItem.currentStock) {
      setErrorMessage(
        `Stok BBM ${currentFuelItem.name} tidak mencukupi (Tersedia: ${currentFuelItem.currentStock} ${currentFuelItem.unit}, diminta: ${parsedFuelQty}).`
      );
      return;
    }

    // Build the Job Report
    const report: FumigationJobReport = {
      id: `job-${Date.now()}`,
      jobNo,
      jobType,
      title: title.trim(),
      clientName: clientName.trim(),
      location: location.trim(),
      rawMaterialName: rawMaterialName.trim() || targetObject.trim() || 'Bahan Baku Komoditas',
      closingDate: closingDate || executionDate,
      openingDate: openingDate || aerationDate || closingDate,
      targetObject: targetObject.trim() || rawMaterialName.trim(),
      targetPest: targetPest.trim() || undefined,
      executionDate: closingDate || executionDate,
      aerationDate: openingDate || aerationDate || undefined,
      operatorName: operatorName.trim() || currentUser.name,
      operatorNip: currentUser.nip,
      medicineItemId: currentMedicineItem.id,
      medicineSku: currentMedicineItem.sku,
      medicineName: currentMedicineItem.name,
      medicineBatchNo: medicineBatchNo || (currentMedicineItem.batches?.[0]?.batchNo ?? 'BATCH-STD'),
      medicineQuantity: parsedMedicineQty,
      medicineUnit: currentMedicineItem.unit,
      // Fumigasi: explicitly omit fuel
      fuelItemId: !isFumigasi && currentFuelItem && parsedFuelQty > 0 ? currentFuelItem.id : undefined,
      fuelSku: !isFumigasi && currentFuelItem && parsedFuelQty > 0 ? currentFuelItem.sku : undefined,
      fuelName: !isFumigasi && currentFuelItem && parsedFuelQty > 0 ? currentFuelItem.name : undefined,
      fuelQuantity: !isFumigasi && parsedFuelQty > 0 ? parsedFuelQty : undefined,
      fuelUnit: !isFumigasi && currentFuelItem ? currentFuelItem.unit : undefined,
      gasConcentrationPpm: gasConcentrationPpm ? parseFloat(gasConcentrationPpm) : undefined,
      exposureHours: exposureHours ? parseFloat(exposureHours) : undefined,
      tarpCondition: tarpCondition.trim() || undefined,
      notes: notes.trim() || undefined,
      qcRecommendation: 'PENDING',
      qcApprovalStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const medicineDeduction = {
      itemId: currentMedicineItem.id,
      qty: parsedMedicineQty,
      batchNo: medicineBatchNo,
    };

    const fuelDeduction =
      !isFumigasi && currentFuelItem && parsedFuelQty > 0
        ? {
            itemId: currentFuelItem.id,
            qty: parsedFuelQty,
            batchNo: fuelBatchNo,
          }
        : undefined;

    onSaveJobAndDeductStock(report, medicineDeduction, fuelDeduction, initialRecommendation?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Input Pekerjaan Spraying, Fogging &amp; Fumigasi
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Operator Lapangan
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pencatatan SPK pekerjaan lapangan terintegrasi dengan pemotongan stok obat &amp; BBM keluar gudang.
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

        {/* Initial Recommendation Linked Banner */}
        {initialRecommendation && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                <strong>Terhubung ke Rekomendasi QC:</strong> {initialRecommendation.recommendationNo} &bull; {initialRecommendation.commodityName} (Lot {initialRecommendation.batchOrLotNo})
              </span>
            </div>
            <span className="shrink-0 font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              OTOMATIS TERISI
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Toggle Jenis Pekerjaan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Jenis Pekerjaan Lapangan:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('FUMIGASI')}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  jobType === 'FUMIGASI'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Fumigasi Gas</div>
                  <div className="text-[11px] text-slate-400">Kapal, Silo, Gudang, Palka, Kontainer ISPM-15</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('SPRAYING_FOGGING')}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  jobType === 'SPRAYING_FOGGING'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Bug className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Spraying &amp; Fogging</div>
                  <div className="text-[11px] text-slate-400">Pengendalian Nyamuk, Lalat, Vektor Pabrik &amp; Gudang</div>
                </div>
              </button>
            </div>
          </div>

          {/* SPK No & Judul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">No. SPK / Job Order</label>
              <input
                type="text"
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Nama / Judul Pekerjaan</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fumigasi Palka Kapal MV Meratus Jaya 02"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* DATA UTAMA LAPORAN FUMIGASI: BAHAN BAKU, TGL BUKA & TUTUP */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Data Pokok Laporan: Nama Bahan Baku, Tanggal Tutup &amp; Buka
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                STANDAR ISPM-15
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. NAMA BAHAN BAKU */}
              <div className="sm:col-span-3">
                <label className="block text-emerald-300 font-bold mb-1">
                  🌾 Nama Bahan Baku / Komoditas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={rawMaterialName}
                  onChange={(e) => {
                    setRawMaterialName(e.target.value);
                    if (!targetObject) setTargetObject(e.target.value);
                  }}
                  placeholder="Contoh: Beras Ramos Super 4.500 Ton, Jagung Pipil Pakan Ternak, Kopi Robusta, Pallet Kayu"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500/50 text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>

              {/* 2. TANGGAL TUTUP */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                  <span>🔒 Tanggal Tutup</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => {
                    setClosingDate(e.target.value);
                    setExecutionDate(e.target.value);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Sungkup ditutup &amp; gas dimasukkan</span>
              </div>

              {/* 3. TANGGAL BUKA */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1">
                  <span>🔓 Tanggal Buka</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={openingDate}
                  onChange={(e) => {
                    setOpeningDate(e.target.value);
                    setAerationDate(e.target.value);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Buka sungkup terpal &amp; aerasi gas</span>
              </div>

              {/* Target Hama */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Hama Sasaran
                </label>
                <input
                  type="text"
                  value={targetPest}
                  onChange={(e) => setTargetPest(e.target.value)}
                  placeholder="e.g. Sitophilus oryzae, Tribolium"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Hama gudang sasaran</span>
              </div>
            </div>
          </div>

          {/* Klien & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Klien / Perusahaan Pemilik</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. PT Pelayaran Nusantara"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Lokasi Gudang / Dermaga / Silo</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dermaga 102 Pelabuhan Tg. Priok"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* SECTION: PEMAKAIAN OBAT KIMIA (OUT GUDANG) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Beaker className="w-4 h-4" />
                2. Pemakaian Obat Kimia (Otomatis Potong Stok Keluar)
              </span>
              {currentMedicineItem && (
                <span className="font-mono text-slate-300">
                  Stok Tersedia: <strong className="text-emerald-400">{currentMedicineItem.currentStock} {currentMedicineItem.unit}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Pilih Bahan Kimia / Obat</label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => {
                    setSelectedMedicineId(e.target.value);
                    const item = items.find((i) => i.id === e.target.value);
                    if (item && item.batches && item.batches.length > 0) {
                      setMedicineBatchNo(item.batches[0].batchNo);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  {availableMedicines.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.sku}] {item.name} - Stok: {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Jumlah Pemakaian ({currentMedicineItem?.unit || 'Qty'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={medicineQty}
                  onChange={(e) => setMedicineQty(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Batch selector for medicine */}
            {currentMedicineItem && currentMedicineItem.batches && currentMedicineItem.batches.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Batch Terpilih:</span>
                <select
                  value={medicineBatchNo}
                  onChange={(e) => setMedicineBatchNo(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono"
                >
                  {currentMedicineItem.batches.map((b) => (
                    <option key={b.id} value={b.batchNo}>
                      {b.batchNo} (Qty: {b.quantity} {currentMedicineItem.unit} {b.expiredDate ? `· Exp: ${b.expiredDate}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SECTION: PEMAKAIAN BBM (OUT GUDANG) - HANYA UNTUK SPRAYING & FOGGING (FUMIGASI TIDAK ADA BBM MESIN) */}
          {jobType === 'SPRAYING_FOGGING' ? (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Fuel className="w-4 h-4" />
                  3. Pemakaian BBM &amp; Pelarut Mesin Fogger (Otomatis Potong Stok)
                </span>
                {currentFuelItem && (
                  <span className="font-mono text-slate-300">
                    Stok Tersedia: <strong className="text-emerald-400">{currentFuelItem.currentStock} {currentFuelItem.unit}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Pilih Jenis BBM / Pelarut Mesin</label>
                  <select
                    value={selectedFuelId}
                    onChange={(e) => {
                      setSelectedFuelId(e.target.value);
                      const fuel = items.find((i) => i.id === e.target.value);
                      if (fuel && fuel.batches && fuel.batches.length > 0) {
                        setFuelBatchNo(fuel.batches[0].batchNo);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">-- Tidak Menggunakan BBM Tambahan --</option>
                    {availableFuels.map((fuel) => (
                      <option key={fuel.id} value={fuel.id}>
                        [{fuel.sku}] {fuel.name} - Sisa: {fuel.currentStock} {fuel.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Jumlah Liter Keluar
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={fuelQty}
                    onChange={(e) => setFuelQty(e.target.value)}
                    placeholder="0 (Liter)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Pekerjaan <strong>Fumigasi Karantina</strong> menggunakan sungkup kedap gas — <strong>tidak memerlukan BBM mesin</strong>.</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                BEBAS BBM
              </span>
            </div>
          )}

          {/* PARAMETER TEKNIS LAPANGAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {jobType === 'FUMIGASI' && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Konsentrasi Gas (ppm)</label>
                <input
                  type="number"
                  value={gasConcentrationPpm}
                  onChange={(e) => setGasConcentrationPpm(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            )}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Durasi Paparan (Jam)</label>
              <input
                type="number"
                value={exposureHours}
                onChange={(e) => setExposureHours(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
            <div className={jobType === 'FUMIGASI' ? '' : 'sm:col-span-2'}>
              <label className="block text-slate-400 font-medium mb-1">Teknisi / Operator Pelaksana</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Kondisi Sungkup / Area Pelaksanaan</label>
            <input
              type="text"
              value={tarpCondition}
              onChange={(e) => setTarpCondition(e.target.value)}
              placeholder="e.g. Sungkup terpal rangkap 2, sand snake rapat, blower aktif"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Catatan Tambahan Teknisi</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kondisi cuaca, kendala palka kapal, atau instruksi keselamatan kerja..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 text-[11px] text-blue-300 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              Laporan ini akan langsung masuk ke antrean Tim QC untuk evaluasi rekomendasi (OK / Belum OK / Fumigasi Ulang) dan status Approve.
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Simpan Pekerjaan &amp; Keluarkan Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
