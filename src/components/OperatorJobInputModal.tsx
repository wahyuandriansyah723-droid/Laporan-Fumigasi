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
  Timer,
  Hourglass,
} from 'lucide-react';
import { formatNumberID, getDayNameIndo, getFumigationDurationInfo } from '../utils/formatters';

interface OperatorJobInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser: AuthUser;
  authUsers?: AuthUser[];
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
  authUsers = [],
  operators = [],
  destinations = [],
  settings,
  initialJobType,
  initialRecommendation,
  onSaveJobAndDeductStock,
}) => {
  // Interkoneksi Akun ID: Ambil daftar user Admin, QC, dan Operator yang terdaftar di sistem
  const registeredAdmins = authUsers.filter((u) => u.role === 'ADMIN');
  const registeredQCs = authUsers.filter((u) => u.role === 'QC');
  const registeredOperators = authUsers.filter((u) => u.role === 'OPERATOR');

  const [jobType, setJobType] = useState<JobType>(initialJobType || 'FUMIGASI');
  const [jobNo, setJobNo] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Spesifikasi Wajib Berita Acara Pengendalian Hama (PLT-WRH-FM 01-09) PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rawMaterialName, setRawMaterialName] = useState<string>('Jagung Pipil Pakan Ternak');
  const [rawMaterialBatch, setRawMaterialBatch] = useState<string>('BATCH-JPF-2026-088');
  const [tonnage, setTonnage] = useState<string>('1.250 Ton');
  const [warehouseKavling, setWarehouseKavling] = useState<string>('Gudang 03 / Kavling K-04');
  const [controlType, setControlType] = useState<string>('Fumigasi (Gassing) Cover Sheet');
  const [executionDay, setExecutionDay] = useState<string>('');
  const [openingDay, setOpeningDay] = useState<string>('');
  const [warehouseSupervisorName, setWarehouseSupervisorName] = useState<string>('Agus Pranoto');
  const [qcSupervisorName, setQcSupervisorName] = useState<string>('Ratna Dewi, S.Si');

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

  // Ref to track modal open state so useEffect only initializes once per opening
  const prevIsOpenRef = React.useRef(false);

  // Filter available medicines & fuels from inventory
  const availableMedicines = items.filter((i) =>
    jobType === 'FUMIGASI' ? i.category === 'FUMIGASI' : i.category === 'SPRAYING_FOGGING'
  );
  const availableFuels = items.filter((i) => i.category === 'BBM');

  // Auto-generate SPK number or prefill from recommendation ONCE when opening modal
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const activeType = initialRecommendation ? 'FUMIGASI' : (initialJobType || 'FUMIGASI');
      setJobType(activeType);
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2);
      const randomNum = Math.floor(100 + Math.random() * 900);
      const prefix = activeType === 'FUMIGASI' ? 'SPK-FUM' : 'SPK-FOG';
      setJobNo(`${prefix}-${dateCode}-${randomNum}`);
      setOperatorName(currentUser.name);
      const defaultAdmin = registeredAdmins[0]?.name || 'Agus Pranoto';
      const defaultQC = registeredQCs[0]?.name || 'Ratna Dewi, S.Si';
      setWarehouseSupervisorName(defaultAdmin);
      setQcSupervisorName(defaultQC);
      setErrorMessage('');

      if (initialRecommendation) {
        setJobType('FUMIGASI');
        setTitle(`Berita Acara Pengendalian Hama Fumigasi ${initialRecommendation.commodityName}`);
        setClientName('PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung');
        setLocation(initialRecommendation.location || 'Gudang 03 / Kavling K-04');
        setRawMaterialName(initialRecommendation.commodityName);
        setRequestDate(initialRecommendation.inspectionDate || new Date().toISOString().slice(0, 10));
        setRawMaterialBatch(initialRecommendation.batchOrLotNo || 'BATCH-JPF-2026-088');
        setTonnage(`${initialRecommendation.quantity} ${initialRecommendation.quantityUnit}`);
        setWarehouseKavling(initialRecommendation.location || 'Gudang 03 / Kavling K-04');
        setControlType('Fumigasi (Gassing) Cover Sheet');
        const cDate = new Date().toISOString().slice(0, 10);
        const oDate = initialRecommendation.targetFumigationDeadline || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
        setClosingDate(cDate);
        setOpeningDate(oDate);
        setExecutionDay(getDayNameIndo(cDate) || 'Senin');
        setOpeningDay(getDayNameIndo(oDate) || 'Kamis');
        setTargetObject(`${initialRecommendation.commodityName} - ${initialRecommendation.quantity} ${initialRecommendation.quantityUnit}`);
        setTargetPest(initialRecommendation.targetPests);
        setNotes(`Eksekusi Rekomendasi QC ${initialRecommendation.recommendationNo}. Catatan K3: ${initialRecommendation.safetyNotes}`);

        const matchedMed = items.find(
          (i) =>
            i.id === initialRecommendation.recommendedMedicineId ||
            i.name.toLowerCase().includes('fumiphos') ||
            i.name.toLowerCase().includes('phostoxin') ||
            i.name.toLowerCase().includes('quickphos') ||
            i.category === 'FUMIGASI'
        );
        if (matchedMed) {
          setSelectedMedicineId(matchedMed.id);
          if (matchedMed.batches && matchedMed.batches.length > 0) {
            setMedicineBatchNo(matchedMed.batches[0].batchNo);
          }
        }
        setMedicineQty(String(initialRecommendation.estimatedMedicineQty || 1000));
        setSelectedFuelId('');
        setFuelQty('');
        setFuelBatchNo('');
      } else if (activeType === 'FUMIGASI') {
        setClientName('PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung');
        setRawMaterialName('Jagung Pipil Pakan Ternak');
        setRawMaterialBatch('BATCH-JPF-2026-088');
        setTonnage('1.250 Ton');
        setWarehouseKavling('Gudang 03 / Kavling K-04');
        setControlType('Fumigasi (Gassing) Cover Sheet');
        setTitle('Berita Acara Pengendalian Hama Fumigasi Jagung Pipil');
        setLocation('Gudang 03 / Kavling K-04');
        const cDate = new Date().toISOString().slice(0, 10);
        const oDate = (() => {
          const d = new Date();
          d.setDate(d.getDate() + 5);
          return d.toISOString().slice(0, 10);
        })();
        setClosingDate(cDate);
        setOpeningDate(oDate);
        setExecutionDay(getDayNameIndo(cDate) || 'Senin');
        setOpeningDay(getDayNameIndo(oDate) || 'Kamis');
        setExposureHours('120');
        setGasConcentrationPpm('500');
        setTarpCondition('Sungkup terpal PVC kedap gas, sand snake terpasang rapat');
        setSelectedFuelId('');
        setFuelQty('');
        setFuelBatchNo('');

        const meds = items.filter((i) => i.category === 'FUMIGASI');
        if (meds.length > 0) {
          setSelectedMedicineId(meds[0].id);
          if (meds[0].batches && meds[0].batches.length > 0) {
            setMedicineBatchNo(meds[0].batches[0].batchNo);
          }
        }
      } else {
        setTitle('Thermal Fogging & Spraying Pengendalian Vektor');
        setClientName('PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung');
        setLocation('Area Perimeter Luar & Saluran Air Pabrik');
        setRawMaterialName('Dinding Perimeter Luar & Saluran Air Pabrik');
        setTargetPest('Nyamuk Culex, Aedes, dan Lalat Musca');
        const cDate = new Date().toISOString().slice(0, 10);
        setClosingDate(cDate);
        setOpeningDate(cDate);
        setExecutionDay(getDayNameIndo(cDate) || 'Senin');
        setOpeningDay(getDayNameIndo(cDate) || 'Senin');
        setExposureHours('4');
        setGasConcentrationPpm('');
        setTarpCondition('Area terbuka perimeter luar dan saluran air pabrik');

        const meds = items.filter((i) => i.category === 'SPRAYING_FOGGING');
        if (meds.length > 0) {
          setSelectedMedicineId(meds[0].id);
          if (meds[0].batches && meds[0].batches.length > 0) {
            setMedicineBatchNo(meds[0].batches[0].batchNo);
          }
        }

        const fuels = items.filter((i) => i.category === 'BBM');
        if (fuels.length > 0) {
          setSelectedFuelId(fuels[0].id);
          if (fuels[0].batches && fuels[0].batches.length > 0) {
            setFuelBatchNo(fuels[0].batches[0].batchNo);
          }
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialRecommendation, initialJobType]);

  // Adjust defaults when user explicitly changes jobType via toggle button
  const handleTypeChange = (newType: JobType) => {
    setJobType(newType);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const prefix = newType === 'FUMIGASI' ? 'SPK-FUM' : 'SPK-FOG';
    setJobNo(`${prefix}-${dateCode}-${randomNum}`);

    if (newType === 'FUMIGASI') {
      setTitle('Berita Acara Pengendalian Hama Fumigasi Jagung Pipil');
      setClientName('PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung');
      setLocation(warehouseKavling || 'Gudang 03 / Kavling K-04');
      setRawMaterialName('Jagung Pipil Pakan Ternak');
      setRawMaterialBatch('BATCH-JPF-2026-088');
      setTonnage('1.250 Ton');
      setWarehouseKavling('Gudang 03 / Kavling K-04');
      setControlType('Fumigasi (Gassing) Cover Sheet');
      setExecutionDay(getDayNameIndo(closingDate) || 'Senin');
      setOpeningDay(getDayNameIndo(openingDate) || 'Kamis');
      setExposureHours('120');
      setGasConcentrationPpm('500');
      setTarpCondition('Sungkup terpal PVC kedap gas, sand snake terpasang rapat');
      setSelectedFuelId('');
      setFuelQty('');
      setFuelBatchNo('');

      const meds = items.filter((i) => i.category === 'FUMIGASI');
      if (meds.length > 0) {
        setSelectedMedicineId(meds[0].id);
        if (meds[0].batches && meds[0].batches.length > 0) {
          setMedicineBatchNo(meds[0].batches[0].batchNo);
        }
      }
    } else {
      setTitle('Thermal Fogging & Spraying Pengendalian Vektor');
      setClientName('PT. JAPFA COMFEED INDONESIA Tbk - Unit Lampung');
      setLocation('Area Perimeter Luar & Saluran Air Pabrik');
      setRawMaterialName('Dinding Perimeter Luar & Saluran Air Pabrik');
      setTargetPest('Nyamuk Culex, Aedes, dan Lalat Musca');
      setExposureHours('4');
      setGasConcentrationPpm('');
      setTarpCondition('Area terbuka perimeter luar dan saluran air pabrik');

      const meds = items.filter((i) => i.category === 'SPRAYING_FOGGING');
      if (meds.length > 0) {
        setSelectedMedicineId(meds[0].id);
        if (meds[0].batches && meds[0].batches.length > 0) {
          setMedicineBatchNo(meds[0].batches[0].batchNo);
        }
      }

      const fuels = items.filter((i) => i.category === 'BBM');
      if (fuels.length > 0) {
        setSelectedFuelId(fuels[0].id);
        if (fuels[0].batches && fuels[0].batches.length > 0) {
          setFuelBatchNo(fuels[0].batches[0].batchNo);
        }
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
      clientName: isFumigasi ? 'PT. JAPFA COMFEED INDONESIA Tbk' : clientName.trim(),
      location: isFumigasi ? (warehouseKavling.trim() || location.trim()) : location.trim(),
      formCode: 'PLT-WRH-FM 01-09',
      companyName: 'PT. JAPFA COMFEED INDONESIA Tbk',
      unitName: 'Unit Lampung',
      documentTitle: 'BERITA ACARA PENGENDALIAN HAMA',
      requestDate: requestDate || closingDate,
      rawMaterialName: rawMaterialName.trim() || targetObject.trim() || 'Jagung Pipil Pakan Ternak',
      rawMaterialBatch: isFumigasi ? (rawMaterialBatch.trim() || undefined) : undefined,
      tonnage: isFumigasi ? (tonnage.trim() || undefined) : undefined,
      warehouseKavling: isFumigasi ? (warehouseKavling.trim() || location.trim() || undefined) : undefined,
      fumigantName: isFumigasi ? currentMedicineItem.name : undefined,
      fumigantQuantityStr: isFumigasi ? `${parsedMedicineQty} ${currentMedicineItem.unit}` : undefined,
      controlType: isFumigasi ? (controlType.trim() || 'Fumigasi (Gassing) Cover Sheet') : undefined,
      executionDay: isFumigasi ? (executionDay.trim() || getDayNameIndo(closingDate) || 'Senin') : undefined,
      closingDate: closingDate || executionDate,
      openingDay: isFumigasi ? (openingDay.trim() || getDayNameIndo(openingDate) || 'Kamis') : undefined,
      openingDate: openingDate || aerationDate || closingDate,
      fumigationOperatorTitle: 'Fimigation Opr',
      warehouseSupervisorName: isFumigasi ? (warehouseSupervisorName.trim() || 'RM WH Supervisor') : undefined,
      qcSupervisorName: isFumigasi ? (qcSupervisorName.trim() || 'QC Supervisor') : undefined,
      targetObject: targetObject.trim() || (isFumigasi ? `${rawMaterialName.trim()} - ${tonnage.trim()}` : rawMaterialName.trim()),
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
                  <div className="text-sm font-bold text-white">Fumigasi</div>
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

          {/* FUMIGASI FORM (BERITA ACARA JAPFA PLT-WRH-FM 01-09) vs SPRAYING & FOGGING WORKSHEET */}
          {jobType === 'FUMIGASI' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-indigo-500/50 space-y-4 shadow-xl">
              {/* Header Form JAPFA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-500/30 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center text-red-500 font-black text-base shadow-inner">
                    J
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-wide text-white flex items-center gap-2">
                      <span className="text-red-500">JAPFA</span>
                      <span>PT. JAPFA COMFEED INDONESIA Tbk</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Unit Lampung
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                    BERITA ACARA PENGENDALIAN HAMA
                  </h4>
                  <div className="text-[11px] font-mono font-bold text-slate-200 border border-slate-700 bg-slate-900 px-2.5 py-0.5 rounded mt-0.5 inline-block">
                    PLT-WRH-FM 01-09
                  </div>
                </div>
              </div>

              {/* Pembuka: Pada hari : ... Tanggal : ... telah dilakukan Pengendalian hama: */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex flex-wrap items-center gap-2">
                <span>Pada hari :</span>
                <input
                  type="text"
                  value={executionDay || getDayNameIndo(closingDate) || 'Senin'}
                  onChange={(e) => setExecutionDay(e.target.value)}
                  placeholder="Hari..."
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs w-28 text-center"
                />
                <span>Tanggal :</span>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => {
                    setClosingDate(e.target.value);
                    setExecutionDate(e.target.value);
                    setExecutionDay(getDayNameIndo(e.target.value));
                  }}
                  required
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                />
                <span className="text-slate-400 sm:ml-auto">telah dilakukan Pengendalian hama:</span>
              </div>

              {/* 8 Field Form Sesuai Dokumen JAPFA */}
              <div className="space-y-2 text-xs">
                {/* 1. Tanggal Permintaan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>1. Tanggal Permintaan</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 2. Nama Bahan Baku */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>2. Nama Bahan Baku</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8 space-y-1.5">
                    <input
                      type="text"
                      value={rawMaterialName}
                      onChange={(e) => {
                        setRawMaterialName(e.target.value);
                        if (!targetObject) setTargetObject(e.target.value);
                      }}
                      placeholder="Contoh: Jagung Pipil Pakan Ternak, Soybean Meal (SBM), Beras..."
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Jagung Pipil Pakan Ternak', 'Soybean Meal (SBM)', 'Wheat Pollard', 'Corn Gluten Meal (CGM)', 'Beras Premium'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setRawMaterialName(preset);
                            if (!targetObject) setTargetObject(preset);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>3. Batch</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={rawMaterialBatch}
                      onChange={(e) => setRawMaterialBatch(e.target.value)}
                      placeholder="Contoh: BATCH-JPF-2026-088"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 4. Tonase */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>4. Tonase</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={tonnage}
                      onChange={(e) => setTonnage(e.target.value)}
                      placeholder="Contoh: 1.250 Ton / 500 Ton"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 5. Gudang/ Kavling */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>5. Gudang/ Kavling</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={warehouseKavling}
                      onChange={(e) => {
                        setWarehouseKavling(e.target.value);
                        setLocation(e.target.value);
                      }}
                      placeholder="Contoh: Gudang 03 / Kavling K-04"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 6. Nama Fumigan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>6. Nama Fumigan</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
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
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      {availableMedicines.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stok: {item.currentStock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 7. Jumlah Fumigan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>7. Jumlah Fumigan</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8 flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={medicineQty}
                      onChange={(e) => setMedicineQty(e.target.value)}
                      placeholder="0"
                      required
                      className="w-36 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-mono text-slate-400">
                      {currentMedicineItem?.unit || 'Tablet / Flask'}
                    </span>
                    {currentMedicineItem && (
                      <span className="text-[11px] text-emerald-400 ml-auto font-mono">
                        Stok: {currentMedicineItem.currentStock} {currentMedicineItem.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* 8. Jenis Pengendalian */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="sm:col-span-4 font-semibold text-slate-300 flex items-center justify-between">
                    <span>8. Jenis Pengendalian</span>
                    <span className="text-slate-500 font-bold hidden sm:inline mr-2">=</span>
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={controlType}
                      onChange={(e) => setControlType(e.target.value)}
                      placeholder="Contoh: Fumigasi (Gassing) Cover Sheet"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buka Plastik Cover Sheet Notice */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs">
                <div className="font-semibold text-indigo-200 flex flex-wrap items-center gap-2">
                  <span>Fumigasi (Gassing) akan dibuka plastik cover sheet pada hari :</span>
                  <input
                    type="text"
                    value={openingDay || getDayNameIndo(openingDate) || 'Kamis'}
                    onChange={(e) => setOpeningDay(e.target.value)}
                    placeholder="Hari..."
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs w-28 text-center"
                  />
                  <span>tanggal :</span>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => {
                      setOpeningDate(e.target.value);
                      setAerationDate(e.target.value);
                      setOpeningDay(getDayNameIndo(e.target.value));
                    }}
                    required
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
                <p className="italic text-slate-400 text-[11px]">
                  Demikian berita acara ini kami buat untuk dapat dipergunakan sebagaimana mestinya
                </p>
              </div>

              {/* Lama Waktu Difumigasi (dari tanggal tutup sampai tanggal aktif) */}
              {(() => {
                const dur = getFumigationDurationInfo(closingDate, openingDate, Number(exposureHours) || 120);
                return (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                          <span>Lama Waktu Difumigasi:</span>
                          <span className="text-white font-mono font-bold text-xs">{dur.durationDays > 0 ? `${dur.durationDays} Hari` : '-'}</span>
                          <span className="text-[10px] text-amber-300 font-normal">({dur.durationHours} Jam Paparan)</span>
                        </div>
                        <div className="text-slate-300 text-[11px]">
                          Dari Tanggal Tutup (<span className="text-blue-300 font-mono">{closingDate}</span>) s/d Tanggal Aktif/Buka (<span className="text-amber-300 font-mono">{openingDate}</span>)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {dur.progressText}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* PARAMETER TEKNIS GAS KARANTINA & SUNGKUP */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Parameter Teknis Gas &amp; Sungkup Karantina:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    BEBAS BBM MESIN
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Target Konsentrasi Gas PH3 (ppm)</label>
                    <input
                      type="number"
                      value={gasConcentrationPpm}
                      onChange={(e) => setGasConcentrationPpm(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Durasi Waktu Paparan Gas (Jam)</label>
                    <input
                      type="number"
                      value={exposureHours}
                      onChange={(e) => setExposureHours(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Kondisi Sungkup Terpal &amp; Sand Snake</label>
                  <input
                    type="text"
                    value={tarpCondition}
                    onChange={(e) => setTarpCondition(e.target.value)}
                    placeholder="e.g. Sungkup terpal PVC rangkap 2, sand snake tertutup rapat tanpa kebocoran"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Tanda Tangan Form JAPFA */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Personil Penandatangan Berita Acara:
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Terhubung ID Akun (Admin, Operator, QC)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Dibuat Oleh: <strong className="text-blue-400">Fumigation Opr</strong>
                    </label>
                    <input
                      type="text"
                      list="operator-job-opr-list"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      required
                      placeholder="Nama Operator..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <datalist id="operator-job-opr-list">
                      {registeredOperators.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.username} ({u.nip || 'Operator'})
                        </option>
                      ))}
                      {operators.map((op) => (
                        <option key={op.id} value={op.name}>
                          {op.name} ({op.role})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Dibuat Oleh: <strong className="text-amber-400">RM WH Supervisor (Admin)</strong>
                    </label>
                    <input
                      type="text"
                      list="operator-job-wh-list"
                      value={warehouseSupervisorName}
                      onChange={(e) => setWarehouseSupervisorName(e.target.value)}
                      required
                      placeholder="Nama Supervisor WH..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500"
                    />
                    <datalist id="operator-job-wh-list">
                      {registeredAdmins.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.username} ({u.roleTitle || 'Admin Gudang'})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Mengetahui: <strong className="text-emerald-400">QC Supervisor</strong>
                    </label>
                    <input
                      type="text"
                      list="operator-job-qc-list"
                      value={qcSupervisorName}
                      onChange={(e) => setQcSupervisorName(e.target.value)}
                      required
                      placeholder="Nama QC Supervisor..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                    <datalist id="operator-job-qc-list">
                      {registeredQCs.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.username} ({u.nip || 'Quality Control'})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Batch Selector if exists */}
              {currentMedicineItem && currentMedicineItem.batches && currentMedicineItem.batches.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Batch Obat Kimia:</span>
                  <select
                    value={medicineBatchNo}
                    onChange={(e) => setMedicineBatchNo(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono text-xs"
                  >
                    {currentMedicineItem.batches.map((b) => (
                      <option key={b.id} value={b.batchNo}>
                        {b.batchNo} (Qty: {b.quantity} {currentMedicineItem.unit} {b.expiredDate ? `· Exp: ${b.expiredDate}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Catatan Tambahan Teknisi */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Catatan Tambahan Teknisi Fumigasi</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan kondisi komoditas, titik pelepasan tablet PH3, atau kendala lapangan..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>
          ) : (
            /* ================= LEMBAR KERJA KHUSUS SPRAYING & FOGGING ================= */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/50 space-y-4 shadow-xl">
              {/* Header Lembar Kerja Spraying & Fogging */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-500/30 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-base shadow-inner">
                    <Bug className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-wide text-white flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">LEMBAR KERJA SPRAYING &amp; FOGGING</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Pengendalian Hama &amp; Vektor Lingkungan Pabrik / Gudang
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] font-mono font-bold text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 rounded inline-block">
                    FORM PENGENDALIAN VEKTOR
                  </div>
                </div>
              </div>

              {/* Data Pokok Pekerjaan Spraying & Fogging */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  1. Data Sasaran &amp; Area Pelaksanaan
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-emerald-300 font-bold mb-1">
                      Area / Sasaran Pengendalian Vektor <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={rawMaterialName}
                      onChange={(e) => {
                        setRawMaterialName(e.target.value);
                        if (!targetObject) setTargetObject(e.target.value);
                      }}
                      placeholder="e.g. Saluran Air, Dinding Perimeter Luar, Gudang Silo"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-emerald-500/50 text-white font-medium focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        'Dinding Perimeter Luar Gudang',
                        'Saluran Air & Drainase Pabrik',
                        'Area Silo & Boiler Pabrik',
                        'Gudang Bahan Baku & Palet',
                        'Pekarangan & Area Terbuka Pabrik',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setRawMaterialName(preset);
                            setTargetObject(preset);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Tanggal Pelaksanaan (Mulai) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={closingDate}
                        onChange={(e) => {
                          setClosingDate(e.target.value);
                          setExecutionDate(e.target.value);
                        }}
                        required
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Tanggal Selesai Evaluasi (Aktif)
                      </label>
                      <input
                        type="date"
                        value={openingDate}
                        onChange={(e) => {
                          setOpeningDate(e.target.value);
                          setAerationDate(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Durasi Pengerjaan / Masa Aktif Spraying & Fogging */}
                  {(() => {
                    const dur = getFumigationDurationInfo(closingDate, openingDate, Number(exposureHours) || 24);
                    return (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                              Durasi Perlakuan s/d Tanggal Aktif:
                            </span>
                            <div className="text-slate-300 text-xs">
                              Rentang: <span className="text-white font-medium">{dur.rangeText}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/30 text-xs">
                            ⏱️ {dur.durationDays > 0 ? `${dur.durationDays} Hari` : '-'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-slate-200 border border-slate-700">
                            {dur.progressText}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Target Hama Sasaran</label>
                    <input
                      type="text"
                      value={targetPest}
                      onChange={(e) => setTargetPest(e.target.value)}
                      placeholder="e.g. Nyamuk Culex/Aedes, Lalat Musca, Kecoa, Kumbang"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Lokasi Gudang / Area Pabrik</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Area Pabrik Pakan Blok A"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* PEMAKAIAN INSEKTISIDA (POTONG STOK OBAT GUDANG) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Beaker className="w-4 h-4" />
                    2. Pemakaian Insektisida / Obat Kimia (Potong Stok Gudang)
                  </span>
                  {currentMedicineItem && (
                    <span className="font-mono text-slate-300 text-xs">
                      Stok: <strong className="text-emerald-400">{currentMedicineItem.currentStock} {currentMedicineItem.unit}</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">Pilih Insektisida</label>
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
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer text-xs"
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
                      Jumlah Dosis ({currentMedicineItem?.unit || 'Liter/Gram'})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={medicineQty}
                      onChange={(e) => setMedicineQty(e.target.value)}
                      placeholder="0"
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                    />
                  </div>
                </div>

                {/* Batch selector for medicine */}
                {currentMedicineItem && currentMedicineItem.batches && currentMedicineItem.batches.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Batch Terpilih:</span>
                    <select
                      value={medicineBatchNo}
                      onChange={(e) => setMedicineBatchNo(e.target.value)}
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-400 font-mono text-xs"
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

              {/* PEMAKAIAN BBM & PELARUT MESIN FOGGER (POTONG STOK TANGKI/DRUM) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <Fuel className="w-4 h-4" />
                    3. Pemakaian BBM &amp; Pelarut Mesin Fogger (Potong Stok BBM)
                  </span>
                  {currentFuelItem && (
                    <span className="font-mono text-slate-300 text-xs">
                      Stok: <strong className="text-emerald-400">{currentFuelItem.currentStock} {currentFuelItem.unit}</strong>
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
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-xs"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* PARAMETER OPERASIONAL SPRAYING & FOGGING */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  4. Parameter Operasional &amp; Operator Pelaksana
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Durasi Operasional Mesin (Jam)</label>
                    <input
                      type="number"
                      value={exposureHours}
                      onChange={(e) => setExposureHours(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span>Teknisi / Operator Pelaksana</span>
                      <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Terhubung ID Operator
                      </span>
                    </label>
                    <input
                      type="text"
                      list="operator-job-opr-list"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      required
                      placeholder="Pilih atau ketik Operator..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Kondisi Area &amp; Cuaca Lapangan</label>
                  <input
                    type="text"
                    value={tarpCondition}
                    onChange={(e) => setTarpCondition(e.target.value)}
                    placeholder="e.g. Angin tenang, cuaca cerah, pekerja luar telah dievakuasi sementara"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Catatan Lapangan & Prosedur K3 */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Catatan Tambahan &amp; K3 Lapangan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan efikasi knockdown, arah asap fogging, atau kepatuhan APD masker respirator..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          )}

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
