import React, { useState } from 'react';
import {
  MasterChemicalMedicine,
  MasterFuelType,
  MasterEquipmentInventory,
  InventoryItem,
  HazardClass,
} from '../types/inventory';
import {
  Skull,
  Wind,
  Shield,
  Fuel,
  Droplets,
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  PackagePlus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Sliders,
  Flame,
  Info,
  Layers,
  Thermometer,
  Zap,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  RefreshCw,
} from 'lucide-react';

// =========================================================================
// 1. MASTER JENIS OBAT (FUMIGASI, SPRAYING & FOGGING)
// =========================================================================

interface MedicinesSectionProps {
  medicines: MasterChemicalMedicine[];
  searchQuery: string;
  onEdit: (med: MasterChemicalMedicine) => void;
  onDelete: (id: string, name: string, code: string) => void;
  onCreateInventory?: (item: Partial<InventoryItem>) => void;
  items?: InventoryItem[];
  onOpenTransactionModal?: (item: InventoryItem, defaultType?: 'IN' | 'OUT') => void;
  onNavigateToMutations?: (searchQuery?: string) => void;
}

export const MedicinesSection: React.FC<MedicinesSectionProps> = ({
  medicines,
  searchQuery,
  onEdit,
  onDelete,
  onCreateInventory,
  items = [],
  onOpenTransactionModal,
  onNavigateToMutations,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = medicines.filter((m) => {
    const matchFilter =
      filterType === 'ALL' ||
      (filterType === 'FUMIGASI' && m.category === 'FUMIGASI') ||
      (filterType === 'SPRAYING' && m.category === 'SPRAYING_FOGGING') ||
      (filterType === 'TOXIC' && m.hazardClass === 'TOXIC');

    if (!matchFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.activeIngredient.toLowerCase().includes(q) ||
      m.targetPest.toLowerCase().includes(q) ||
      m.registrationNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Sub-filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] shrink-0">Filter Obat:</span>
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            filterType === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Semua Jenis Obat ({medicines.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('FUMIGASI')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            filterType === 'FUMIGASI'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Obat Fumigasi Gas/Tablet (
          {medicines.filter((m) => m.category === 'FUMIGASI').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('SPRAYING')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            filterType === 'SPRAYING'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Obat Spraying & Fogging (
          {medicines.filter((m) => m.category === 'SPRAYING_FOGGING').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('TOXIC')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            filterType === 'TOXIC'
              ? 'bg-rose-500 text-white shadow'
              : 'bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800'
          }`}
        >
          HazMat Beracun (B3) (
          {medicines.filter((m) => m.hazardClass === 'TOXIC').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          Tidak ditemukan data master jenis obat dengan kriteria pencarian ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((m) => {
            const isToxic = m.hazardClass === 'TOXIC';
            const isCaution = m.hazardClass === 'CAUTION';

            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div className="space-y-3">
                  {/* Header badges */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {m.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isToxic
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isCaution
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isToxic && <Skull className="w-3 h-3 text-rose-400" />}
                        {isCaution && <Wind className="w-3 h-3 text-amber-400" />}
                        {!isToxic && !isCaution && <Shield className="w-3 h-3 text-emerald-400" />}
                        {m.hazardClass}
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                        {m.category === 'FUMIGASI' ? 'Fumigan Gas/Tablet' : 'Spraying / Fogging'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {/* Title & Active Ingredients */}
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{m.name}</h3>
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg">
                      <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <span className="font-semibold block text-[11px] text-emerald-300">
                          Bahan Aktif (Active Ingredient):
                        </span>
                        <span className="text-[11px] text-emerald-100 font-medium">
                          {m.activeIngredient}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Hama Sasaran Target:
                      </span>
                      <span className="text-[11px] text-slate-200 line-clamp-2" title={m.targetPest}>
                        {m.targetPest}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Dosis & Standar Karantina:
                      </span>
                      <span
                        className="text-[11px] text-slate-200 line-clamp-2"
                        title={m.dosageRecommendation}
                      >
                        {m.dosageRecommendation}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Spesifikasi Kemasan & Satuan:
                      </span>
                      <span className="text-[11px] text-slate-200">
                        {m.packagingSpec} ({m.defaultUnit})
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Harga Baku Standar:
                      </span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        Rp {m.standardPrice.toLocaleString('id-ID')} / {m.defaultUnit}
                      </span>
                    </div>
                  </div>

                  {/* Registration & Storage Note */}
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                      <span className="text-slate-500">No. Registrasi:</span>
                      <span className="text-slate-300 font-semibold">{m.registrationNumber}</span>
                    </div>
                    {m.storageRequirement && (
                      <div className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80 leading-relaxed">
                        <strong className="text-slate-300">Penyimpanan:</strong> {m.storageRequirement}
                      </div>
                    )}
                  </div>

                  {/* Live Stock Synchronization Badge & Details */}
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === m.code.toLowerCase() ||
                        it.name.toLowerCase() === m.name.toLowerCase() ||
                        it.name.toLowerCase().includes(m.name.toLowerCase().slice(0, 8))
                    );

                    if (linkedItem) {
                      const isLowStock = linkedItem.currentStock <= linkedItem.minimumStockThreshold;
                      return (
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Boxes className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-slate-400">Stok Gudang:</span>
                            <span
                              className={`font-bold ${
                                isLowStock ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {linkedItem.currentStock} {linkedItem.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tersinkron
                            </span>
                            {onNavigateToMutations && (
                              <button
                                type="button"
                                onClick={() => onNavigateToMutations(linkedItem.name)}
                                className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono ml-1 cursor-pointer"
                                title="Lihat kartu mutasi obat ini"
                              >
                                Mutasi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-950/40 p-2 rounded-lg border border-dashed border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                          <span>Belum ada di daftar stok fisik</span>
                          <span className="text-[10px] text-slate-600">Katalog Master</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === m.code.toLowerCase() ||
                        it.name.toLowerCase() === m.name.toLowerCase() ||
                        it.name.toLowerCase().includes(m.name.toLowerCase().slice(0, 8))
                    );

                    if (linkedItem && onOpenTransactionModal) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'OUT')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Keluarkan obat untuk operasional / proyek"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                            <span>Keluarkan (OUT)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'IN')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Restock obat masuk ke gudang"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Masuk (IN)</span>
                          </button>
                        </div>
                      );
                    } else if (onCreateInventory) {
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            onCreateInventory({
                              sku: m.code,
                              name: m.name,
                              category: m.category,
                              subCategory:
                                m.category === 'FUMIGASI'
                                  ? 'Fumigan Tablet (PH3)'
                                  : 'Insektisida Fogging (Thermal)',
                              unit: m.defaultUnit,
                              pricePerUnit: m.standardPrice,
                              activeIngredients: m.activeIngredient,
                              hazardClass: m.hazardClass,
                              targetPest: m.targetPest,
                              dosageRecommendation: m.dosageRecommendation,
                              location:
                                m.category === 'FUMIGASI'
                                  ? 'Bunker Khusus B3 Karantina'
                                  : 'Rak A1 - Obat Cairan Spraying',
                              description: `Master Data: ${m.packagingSpec}. No. Reg: ${m.registrationNumber}`,
                            })
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="Buat item stok gudang baru berdasarkan master data ini"
                        >
                          <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Jadikan Item Gudang</span>
                        </button>
                      );
                    }
                    return <div />;
                  })()}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      title="Edit Master Data Obat"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id, m.name, m.code)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
                      title="Hapus Master Data Obat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 2. MASTER JENIS BBM & PELUMAS/PELARUT
// =========================================================================

interface FuelsSectionProps {
  fuels: MasterFuelType[];
  searchQuery: string;
  onEdit: (fuel: MasterFuelType) => void;
  onDelete: (id: string, name: string, code: string) => void;
  onCreateInventory?: (item: Partial<InventoryItem>) => void;
  items?: InventoryItem[];
  onOpenTransactionModal?: (item: InventoryItem, defaultType?: 'IN' | 'OUT') => void;
  onNavigateToMutations?: (searchQuery?: string) => void;
}

export const FuelsSection: React.FC<FuelsSectionProps> = ({
  fuels,
  searchQuery,
  onEdit,
  onDelete,
  onCreateInventory,
  items = [],
  onOpenTransactionModal,
  onNavigateToMutations,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = fuels.filter((f) => {
    if (categoryFilter !== 'ALL' && f.fuelCategory !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.specification.toLowerCase().includes(q) ||
      f.defaultTankLocation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] shrink-0">Kategori BBM:</span>
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            categoryFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Semua BBM & Pelumas ({fuels.length})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('SOLAR_DIESEL')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            categoryFilter === 'SOLAR_DIESEL'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Solar & Biosolar ({fuels.filter((f) => f.fuelCategory === 'SOLAR_DIESEL').length})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('BENSIN_GASOLINE')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            categoryFilter === 'BENSIN_GASOLINE'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Bensin / Pertamax ({fuels.filter((f) => f.fuelCategory === 'BENSIN_GASOLINE').length})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('PELUMAS_OLI')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            categoryFilter === 'PELUMAS_OLI'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Pelumas 2T ({fuels.filter((f) => f.fuelCategory === 'PELUMAS_OLI').length})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('PELARUT_SOLVENT')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            categoryFilter === 'PELARUT_SOLVENT'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Pelarut Carrier ({fuels.filter((f) => f.fuelCategory === 'PELARUT_SOLVENT').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          Tidak ditemukan data master jenis BBM dengan kriteria pencarian ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((f) => {
            const isFlammableHigh = f.fuelCategory === 'BENSIN_GASOLINE';

            return (
              <div
                key={f.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {f.code}
                      </span>
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                        {f.octaneOrCetane}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFlammableHigh
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        {f.fuelCategory.replace('_', ' ')}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        f.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  {/* Fuel Name & Spec */}
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{f.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800">
                      {f.specification}
                    </p>
                  </div>

                  {/* Physical parameters */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Massa Jenis / Densitas:
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {f.density} kg/Liter
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Titik Nyala (Flash Point):
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {f.flashPoint}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Ambang Batas Minimum:
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {f.minimumAlertThreshold.toLocaleString('id-ID')} Liter
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Harga Baku Patokan:
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Rp {f.standardPricePerLiter.toLocaleString('id-ID')} / {f.defaultUnit}
                      </span>
                    </div>
                  </div>

                  {/* Storage Tank */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Tangki / Drum Penyimpanan:</span>
                    <strong className="text-slate-200 font-semibold">{f.defaultTankLocation}</strong>
                  </div>

                  {f.notes && (
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">{f.notes}</p>
                  )}

                  {/* Live Fuel Stock in Tank / Drum */}
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === f.code.toLowerCase() ||
                        it.name.toLowerCase() === f.name.toLowerCase() ||
                        (it.category === 'BBM' &&
                          (it.name.toLowerCase().includes(f.name.toLowerCase().slice(0, 5)) ||
                            f.name.toLowerCase().includes(it.name.toLowerCase().slice(0, 5))))
                    );

                    if (linkedItem) {
                      const isLowStock = linkedItem.currentStock <= linkedItem.minimumStockThreshold;
                      return (
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-slate-400">Stok Fisik Tangki:</span>
                            <span
                              className={`font-bold ${
                                isLowStock ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {linkedItem.currentStock.toLocaleString('id-ID')} {linkedItem.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tersinkron
                            </span>
                            {onNavigateToMutations && (
                              <button
                                type="button"
                                onClick={() => onNavigateToMutations(linkedItem.name)}
                                className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono ml-1 cursor-pointer"
                                title="Lihat riwayat mutasi BBM ini"
                              >
                                Mutasi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-950/40 p-2 rounded-lg border border-dashed border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                          <span>Belum didaftarkan ke tangki/drum stok fisik</span>
                          <span className="text-[10px] text-slate-600">Katalog Master</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === f.code.toLowerCase() ||
                        it.name.toLowerCase() === f.name.toLowerCase() ||
                        (it.category === 'BBM' &&
                          (it.name.toLowerCase().includes(f.name.toLowerCase().slice(0, 5)) ||
                            f.name.toLowerCase().includes(it.name.toLowerCase().slice(0, 5))))
                    );

                    if (linkedItem && onOpenTransactionModal) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'OUT')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Distribusi BBM keluar ke kendaraan/mesin"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                            <span>Distribusi (OUT)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'IN')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Pengisian tangki BBM masuk"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Isi Tangki (IN)</span>
                          </button>
                        </div>
                      );
                    } else if (onCreateInventory) {
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            onCreateInventory({
                              sku: f.code,
                              name: f.name,
                              category: 'BBM',
                              subCategory:
                                f.fuelCategory === 'SOLAR_DIESEL'
                                  ? 'Bahan Bakar Mesin & Genset'
                                  : f.fuelCategory === 'BENSIN_GASOLINE'
                                  ? 'Bahan Bakar Alat Khusus'
                                  : f.fuelCategory === 'PELUMAS_OLI'
                                  ? 'Pelumas & Oli Mesin'
                                  : 'Solvent & Carrier',
                              unit: f.defaultUnit,
                              pricePerUnit: f.standardPricePerLiter,
                              minimumStockThreshold: f.minimumAlertThreshold,
                              isFuel: true,
                              density: f.density,
                              tankCapacity:
                                f.fuelCategory === 'SOLAR_DIESEL' ? 5000 : 1000,
                              hazardClass: 'FLAMMABLE',
                              location: f.defaultTankLocation,
                              description: `Master BBM: ${f.specification}. Titik nyala: ${f.flashPoint}`,
                            })
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="Buat item tangki/drum stok gudang baru berdasarkan master BBM ini"
                        >
                          <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Jadikan Item Gudang</span>
                        </button>
                      );
                    }
                    return <div />;
                  })()}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => onEdit(f)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      title="Edit Master Data BBM"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(f.id, f.name, f.code)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
                      title="Hapus Master Data BBM"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. MASTER INVENTARIS & ALAT OPERASIONAL / APD
// =========================================================================

interface EquipmentSectionProps {
  equipment: MasterEquipmentInventory[];
  searchQuery: string;
  onEdit: (eqp: MasterEquipmentInventory) => void;
  onDelete: (id: string, name: string, code: string) => void;
  onCreateInventory?: (item: Partial<InventoryItem>) => void;
  items?: InventoryItem[];
  onOpenTransactionModal?: (item: InventoryItem, defaultType?: 'IN' | 'OUT') => void;
  onNavigateToMutations?: (searchQuery?: string) => void;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  equipment,
  searchQuery,
  onEdit,
  onDelete,
  onCreateInventory,
  items = [],
  onOpenTransactionModal,
  onNavigateToMutations,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = equipment.filter((eq) => {
    if (typeFilter !== 'ALL' && eq.equipmentType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(q) ||
      eq.code.toLowerCase().includes(q) ||
      eq.brandModel.toLowerCase().includes(q) ||
      eq.serialNumberOrCert.toLowerCase().includes(q) ||
      eq.defaultLocation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] shrink-0">Tipe Inventaris:</span>
        <button
          type="button"
          onClick={() => setTypeFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            typeFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Semua Inventaris ({equipment.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('MESIN_FOGGER')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            typeFilter === 'MESIN_FOGGER'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Mesin Fogger ({equipment.filter((e) => e.equipmentType === 'MESIN_FOGGER').length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('DETEKTOR_GAS')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            typeFilter === 'DETEKTOR_GAS'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Detektor Gas B3 ({equipment.filter((e) => e.equipmentType === 'DETEKTOR_GAS').length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('APD_SAFETY')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            typeFilter === 'APD_SAFETY'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Respirator & APD ({equipment.filter((e) => e.equipmentType === 'APD_SAFETY').length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('TERPAL_FUMIGASI')}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
            typeFilter === 'TERPAL_FUMIGASI'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Terpal Kedap Gas ({equipment.filter((e) => e.equipmentType === 'TERPAL_FUMIGASI').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          Tidak ditemukan data master inventaris dengan kriteria pencarian ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((eq) => {
            return (
              <div
                key={eq.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div className="space-y-3">
                  {/* Header badges */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {eq.code}
                      </span>
                      <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono">
                        {eq.equipmentType.replace('_', ' ')}
                      </span>
                      {eq.calibrationRequired && (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-400" />
                          Wajib Kalibrasi
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        eq.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : eq.status === 'MAINTENANCE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </div>

                  {/* Title & Brand Model */}
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{eq.name}</h3>
                    <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{eq.brandModel}</span>
                    </div>
                  </div>

                  {/* Spec details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Jadwal Maintenance:
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        Tiap {eq.maintenanceIntervalDays} Hari
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Estimasi Masa Pakai:
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {eq.standardLifespanMonths ? `${eq.standardLifespanMonths} Bulan` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Lokasi Penyimpanan:
                      </span>
                      <span className="text-[11px] text-slate-300 truncate block">
                        {eq.defaultLocation}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Nilai Aset Standar:
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Rp {eq.standardPrice.toLocaleString('id-ID')} / {eq.defaultUnit}
                      </span>
                    </div>
                  </div>

                  {/* Certificate / Serial Number */}
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block">Sertifikat / SN / Standar:</span>
                      <span className="text-slate-200 font-semibold">{eq.serialNumberOrCert}</span>
                    </div>
                  </div>

                  {eq.notes && (
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">{eq.notes}</p>
                  )}

                  {/* Live Inventory Equipment Stock */}
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === eq.code.toLowerCase() ||
                        it.name.toLowerCase() === eq.name.toLowerCase() ||
                        (it.category === 'PERLENGKAPAN' &&
                          (it.name.toLowerCase().includes(eq.name.toLowerCase().slice(0, 6)) ||
                            eq.name.toLowerCase().includes(it.name.toLowerCase().slice(0, 6))))
                    );

                    if (linkedItem) {
                      const isLowStock = linkedItem.currentStock <= linkedItem.minimumStockThreshold;
                      return (
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-slate-400">Stok Inventaris:</span>
                            <span
                              className={`font-bold ${
                                isLowStock ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {linkedItem.currentStock} {linkedItem.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tersinkron
                            </span>
                            {onNavigateToMutations && (
                              <button
                                type="button"
                                onClick={() => onNavigateToMutations(linkedItem.name)}
                                className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono ml-1 cursor-pointer"
                                title="Lihat riwayat mutasi alat inventaris ini"
                              >
                                Mutasi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-slate-950/40 p-2 rounded-lg border border-dashed border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                          <span>Belum didaftarkan ke stok fisik gudang</span>
                          <span className="text-[10px] text-slate-600">Katalog Master</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {(() => {
                    const linkedItem = items.find(
                      (it) =>
                        it.sku.toLowerCase() === eq.code.toLowerCase() ||
                        it.name.toLowerCase() === eq.name.toLowerCase() ||
                        (it.category === 'PERLENGKAPAN' &&
                          (it.name.toLowerCase().includes(eq.name.toLowerCase().slice(0, 6)) ||
                            eq.name.toLowerCase().includes(it.name.toLowerCase().slice(0, 6))))
                    );

                    if (linkedItem && onOpenTransactionModal) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'OUT')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Keluarkan alat inventaris / APD untuk proyek operasional"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                            <span>Keluarkan (OUT)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTransactionModal(linkedItem, 'IN')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                            title="Pengembalian alat / restock inventaris masuk"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Masuk (IN)</span>
                          </button>
                        </div>
                      );
                    } else if (onCreateInventory) {
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            onCreateInventory({
                              sku: eq.code,
                              name: eq.name,
                              category: 'PERLENGKAPAN',
                              subCategory:
                                eq.equipmentType === 'MESIN_FOGGER' || eq.equipmentType === 'BLOWER_AERASI'
                                  ? 'Mesin Fogging & Blower'
                                  : eq.equipmentType === 'DETEKTOR_GAS'
                                  ? 'Gas Detector & Pengukur'
                                  : eq.equipmentType === 'APD_SAFETY'
                                  ? 'Alat Pelindung Diri (APD)'
                                  : 'Perlengkapan Terpal (Tarpaulin)',
                              unit: eq.defaultUnit,
                              pricePerUnit: eq.standardPrice,
                              minimumStockThreshold: 2,
                              hazardClass: 'SAFE',
                              location: eq.defaultLocation,
                              description: `Master Inventaris: ${eq.brandModel}. Sertifikat: ${eq.serialNumberOrCert}. Siklus servis: tiap ${eq.maintenanceIntervalDays} hari`,
                            })
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="Buat item stok inventaris gudang berdasarkan master alat ini"
                        >
                          <PackagePlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Jadikan Item Gudang</span>
                        </button>
                      );
                    }
                    return <div />;
                  })()}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => onEdit(eq)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      title="Edit Master Data Inventaris"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(eq.id, eq.name, eq.code)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
                      title="Hapus Master Data Inventaris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
