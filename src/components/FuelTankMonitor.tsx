import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import {
  Fuel,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Sliders,
  Warehouse,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';
import { getMinThreshold, isBelowMinimumThreshold } from '../utils/stockUtils';

interface FuelTankMonitorProps {
  items: InventoryItem[];
  onQuickAction: (item: InventoryItem, actionType: 'IN' | 'OUT') => void;
  onUpdateTankCapacity?: (itemId: string, newCapacity: number, newMinThreshold?: number, locationName?: string) => void;
  canEditCapacity?: boolean;
  onEmptyTank?: (itemId: string, reason?: string) => void;
  onSaveItem?: (item: InventoryItem) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const FuelTankMonitor: React.FC<FuelTankMonitorProps> = ({
  items,
  onQuickAction,
  onUpdateTankCapacity,
  canEditCapacity = true,
  onEmptyTank,
  onSaveItem,
  onDeleteItem,
}) => {
  const fuelItems = items.filter((item) => item.category === 'BBM' && item.isFuel);

  // Items below threshold for synchronized alert
  const belowThresholdFuels = fuelItems.filter(isBelowMinimumThreshold);

  // Edit Capacity & Threshold Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [capacityInput, setCapacityInput] = useState<string>('');
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [stockInput, setStockInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Empty Tank Modal State (Kosongkan Tangki Pertamax & Solar)
  const [emptyingItem, setEmptyingItem] = useState<InventoryItem | null>(null);
  const [emptyReason, setEmptyReason] = useState<string>('Kuras & Pembersihan Tangki Berkala');
  const [emptyCustomNotes, setEmptyCustomNotes] = useState<string>('');
  const [isSubmittingEmpty, setIsSubmittingEmpty] = useState<boolean>(false);

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    const currentCap = item.tankCapacity || (item.currentStock > 1000 ? 5000 : 1000);
    setCapacityInput(String(currentCap));
    setThresholdInput(String(getMinThreshold(item)));
    setStockInput(String(item.currentStock));
    setLocationInput(item.location || '');
  };

  const handleSaveCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newCap = parseFloat(capacityInput);
    if (isNaN(newCap) || newCap <= 0) return;

    const newThresh = thresholdInput ? parseFloat(thresholdInput) : undefined;
    const newLoc = locationInput.trim() || undefined;
    const newStock = stockInput !== '' ? parseFloat(stockInput) : editingItem.currentStock;

    if (onSaveItem) {
      onSaveItem({
        ...editingItem,
        currentStock: isNaN(newStock) ? editingItem.currentStock : Math.max(0, newStock),
        tankCapacity: newCap,
        minimumStockThreshold: newThresh !== undefined ? newThresh : editingItem.minimumStockThreshold,
        minStockAlert: newThresh !== undefined ? newThresh : editingItem.minStockAlert,
        location: newLoc || editingItem.location,
        lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    }

    if (onUpdateTankCapacity) {
      onUpdateTankCapacity(editingItem.id, newCap, newThresh, newLoc);
    }
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (onDeleteItem) {
      onDeleteItem(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Quick capacity presets depending on fuel type
  const isEditingSolar = editingItem
    ? editingItem.sku.includes('SLR') || editingItem.name.toLowerCase().includes('solar')
    : false;
  const isEditingPertamax = editingItem
    ? editingItem.sku.includes('PTX') || editingItem.name.toLowerCase().includes('pertamax')
    : false;

  const presets = isEditingSolar
    ? [2500, 5000, 7500, 10000]
    : isEditingPertamax
    ? [500, 1000, 2000, 3000]
    : [1000, 2500, 5000, 10000];

  const parsedCap = parseFloat(capacityInput) || 0;
  const previewStock = editingItem?.currentStock || 0;
  const previewPercent = parsedCap > 0 ? Math.min(100, Math.round((previewStock / parsedCap) * 100)) : 0;
  const previewSpace = parsedCap > 0 ? Math.max(0, parsedCap - previewStock) : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Monitoring Tangki & Drum BBM Real-Time
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE SENSOR
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Kapasitas level tangki Solar Industri & bahan bakar mesin thermal fogger / genset
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Threshold Alert:</span>
          <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            Min 20%
          </span>
        </div>
      </div>

      {/* 🚨 PERINGATAN STOK TANGKI & DRUM BBM DI BAWAH AMBANG BATAS (REAL-TIME SENSOR) */}
      {belowThresholdFuels.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-slate-950 to-amber-950/40 border-2 border-amber-500/60 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span>PERINGATAN STOK TANGKI &amp; DRUM BBM DI BAWAH AMBANG BATAS</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    {belowThresholdFuels.length} TANGKI MENIPIS
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Data disesuaikan langsung dengan sensor level tangki &amp; drum BBM secara real-time. Lakukan pengisian BBM, kuras tangki, atau sesuaikan ambang batas/kapasitas.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 shrink-0 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SINKRONISASI LIVE SENSOR
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {belowThresholdFuels.map((item) => {
              const threshold = getMinThreshold(item);
              const capacity = item.tankCapacity || (item.currentStock > 1000 ? 5000 : 1000);
              const percentage = Math.min(100, Math.round((item.currentStock / capacity) * 100));
              const isCritical = percentage < 15 || item.currentStock <= threshold * 0.5;
              const deficit = Math.max(0, threshold - item.currentStock);
              const spaceLeft = Math.max(0, capacity - item.currentStock);

              return (
                <div
                  key={`fuel-alert-${item.id}`}
                  className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 ${
                    isCritical
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : 'bg-amber-950/20 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="font-bold text-amber-400">{item.sku}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-300 truncate max-w-[160px]">{item.location}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{item.name}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isCritical ? '🚨 KRITIS' : '⚠️ MENIPIS'} ({percentage}%)
                    </span>
                  </div>

                  {/* Level numbers & progress */}
                  <div className="space-y-1.5 font-mono text-xs bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-[11px]">Level Stok Fisik:</span>
                      <span className="font-bold text-white">
                        <span className={isCritical ? 'text-rose-400' : 'text-amber-400'}>
                          {formatNumberID(item.currentStock)}
                        </span>{' '}
                        <span className="text-slate-400 text-[10px]">/ {formatNumberID(capacity)} L ({percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          isCritical ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">
                        Ambang Min: <strong className="text-slate-200">{formatNumberID(threshold)} L</strong>
                      </span>
                      <span className="text-rose-400 font-semibold">
                        Defisit: -{formatNumberID(deficit)} L
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Sisa Ruang Tangki Kosong:</span>
                      <span className="text-emerald-400 font-semibold">+{formatNumberID(spaceLeft)} Liter</span>
                    </div>
                  </div>

                  {/* Action Buttons: Edit & Simpan, Isi BBM, Kosongkan, Hapus */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/70">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit kapasitas dan ambang batas minimum tangki"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Edit &amp; Simpan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onQuickAction(item, 'IN')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Isi tangki BBM"
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      <span>Isi BBM (+L)</span>
                    </button>

                    {onEmptyTank && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmptyingItem(item);
                          setEmptyReason('Kuras & Pembersihan Tangki Berkala');
                          setEmptyCustomNotes('');
                        }}
                        disabled={item.currentStock <= 0}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Kosongkan isi tangki"
                      >
                        <Trash2 className="w-3 h-3 text-slate-400" />
                        <span>Kosongkan</span>
                      </button>
                    )}

                    {onDeleteItem && (
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/50 text-xs transition-colors cursor-pointer ml-auto"
                        title="Hapus tangki / drum dari inventaris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {fuelItems.map((item) => {
          const threshold = getMinThreshold(item);
          const capacity = item.tankCapacity || (item.currentStock > 1000 ? 5000 : 1000);
          const percentage = Math.min(100, Math.round((item.currentStock / capacity) * 100));
          const isLow = isBelowMinimumThreshold(item);
          const isCritical = percentage < 15 || item.currentStock <= threshold * 0.5;

          const isSolar = item.sku.includes('SLR');
          const liquidColor = isSolar
            ? 'from-amber-600 via-amber-500 to-yellow-400'
            : 'from-blue-600 via-cyan-500 to-emerald-400';
          const glowColor = isSolar ? 'rgba(217, 119, 6, 0.25)' : 'rgba(6, 182, 212, 0.25)';

          return (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="font-bold text-amber-400">{item.sku}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[180px]">{item.location}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                    {item.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono border ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : isLow
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {isCritical ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        KRITIS
                      </>
                    ) : isLow ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        STOK MENIPIS
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        STABIL
                      </>
                    )}
                  </div>

                  {/* Direct Edit Button in Header */}
                  {canEditCapacity && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                      title={`Edit kapasitas ${item.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tank Visual Display */}
              <div className="my-4 flex items-center gap-4">
                {/* Simulated Cylindrical Tank Gauge */}
                <div className="relative w-20 h-32 rounded-lg bg-slate-900 border-2 border-slate-700 p-1 flex flex-col justify-end overflow-hidden shadow-inner shrink-0">
                  {/* Glass reflection */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-black/20 pointer-events-none z-10"></div>
                  
                  {/* Level marks */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20 py-2 px-1">
                    <div className="w-2.5 h-[1px] bg-slate-500 self-end"></div>
                    <div className="w-4 h-[1px] bg-slate-400 self-end"></div>
                    <div className="w-2.5 h-[1px] bg-slate-500 self-end"></div>
                    <div className="w-4 h-[1px] bg-slate-400 self-end"></div>
                    <div className="w-2.5 h-[1px] bg-slate-500 self-end"></div>
                  </div>

                  {/* Warning line at min stock */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-rose-400/80 z-20"
                    style={{ bottom: `${(threshold / capacity) * 100}%` }}
                    title={`Batas Minimum: ${formatNumberID(threshold)} Liter`}
                  ></div>

                  {/* Animated Fluid */}
                  <div
                    className={`w-full rounded bg-gradient-to-t ${liquidColor} transition-all duration-700 relative`}
                    style={{
                      height: `${Math.max(5, percentage)}%`,
                      boxShadow: `0 0 12px ${glowColor}`,
                    }}
                  >
                    {/* Top fluid wave/highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/40 rounded-full"></div>
                  </div>
                </div>

                {/* Tank Metrics Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold font-mono tracking-tight text-white">
                        {formatNumberID(item.currentStock)}{' '}
                        <span className="text-xs font-normal text-slate-400 uppercase font-sans">
                          {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                        <span>Kapasitas Tangki:</span>
                        <strong className="text-amber-400 font-mono font-bold">
                          {formatNumberID(capacity)} Liter
                        </strong>
                        {canEditCapacity && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                            title="Edit kapasitas tangki"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Ubah</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-amber-400">
                        {percentage}%
                      </div>
                      <div className="text-[11px] text-slate-500">Kapasitas Terisi</div>
                    </div>
                  </div>

                  {/* Progress bar line */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${liquidColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  {/* Quick specs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                    <div>
                      Ambang Min:{' '}
                      <span className="text-slate-200">{formatNumberID(threshold)} L</span>
                    </div>
                    <div>
                      Sisa Ruang:{' '}
                      <span className="text-slate-200">
                        {formatNumberID(Math.max(0, capacity - item.currentStock))} L
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                {canEditCapacity && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title={`Edit kapasitas tangki ${isSolar ? 'Solar' : 'Pertamax'}`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Kapasitas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onQuickAction(item, 'IN')}
                  className="flex-1 min-w-[105px] flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Isi / Terima BBM
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAction(item, 'OUT')}
                  className="flex-1 min-w-[105px] flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Pakai / Dispense
                </button>

                {onEmptyTank && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmptyingItem(item);
                      setEmptyReason('Kuras & Pembersihan Tangki Berkala');
                      setEmptyCustomNotes('');
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      item.currentStock <= 0
                        ? 'bg-slate-800/80 text-slate-500 border-slate-700'
                        : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50 hover:border-rose-600'
                    }`}
                    title={
                      item.currentStock <= 0
                        ? `Tangki ${item.name} sudah kosong (0 Liter)`
                        : `Kosongkan / kuras seluruh isi tangki ${item.name}`
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kosongkan Tangki</span>
                  </button>
                )}

                {onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer"
                    title={`Hapus data ${item.name} dari sistem`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: EDIT KAPASITAS TANGKI BBM ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 space-y-0">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Edit Kapasitas Tangki BBM
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingItem.name} ({editingItem.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCapacity} className="p-5 space-y-4">
              {/* Info Banner */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Stok Fisik Saat Ini:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatNumberID(editingItem.currentStock)} Liter
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Kapasitas Sekarang:</span>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    {formatNumberID(editingItem.tankCapacity || (editingItem.currentStock > 1000 ? 5000 : 1000))} Liter
                  </span>
                </div>
              </div>

              {/* Input Stok Fisik Saat Ini */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Stok Fisik Saat Ini (Liter) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    required
                    min="0"
                    step="any"
                    placeholder="Contoh: 1500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 pr-16"
                  />
                  <span className="absolute right-3.5 top-2 text-xs font-mono text-slate-400">
                    Liter
                  </span>
                </div>
              </div>

              {/* Input Kapasitas Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Kapasitas Tangki Baru (Liter) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    required
                    min="1"
                    step="1"
                    placeholder="Contoh: 5000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500 pr-16"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-mono text-slate-400">
                    Liter
                  </span>
                </div>

                {/* Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Preset Cepat:</span>
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCapacityInput(String(val))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        parseInt(capacityInput) === val
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      {formatNumberID(val)} L
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambang Batas Minimum */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Ambang Batas Minimum Restock Alert (Liter)
                </label>
                <input
                  type="number"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  min="0"
                  step="1"
                  placeholder="Contoh: 1000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Peringatan stok menipis otomatis aktif jika isi tangki &le; nilai ini (default: 20% kapasitas).
                </p>
              </div>

              {/* Nama Lokasi / Tangki */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Label Lokasi / Nama Tangki
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Contoh: Tangki Utama T-01 (Kapasitas 5.000 L)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Preview Bar */}
              {parsedCap > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Pratinjau Level Tangki:</span>
                    <span className="font-bold text-amber-400">{previewPercent}% Terisi</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all rounded-full"
                      style={{ width: `${Math.min(100, previewPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Stok: {formatNumberID(previewStock)} L</span>
                    <span>Sisa Ruang Kosong: <strong className="text-slate-200">{formatNumberID(previewSpace)} L</strong></span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kapasitas Tangki</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KOSONGKAN TANGKI BBM ================= */}
      {emptyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 space-y-0">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Kosongkan Tangki BBM
                  </h3>
                  <p className="text-xs text-rose-400 font-mono">
                    {emptyingItem.name} ({emptyingItem.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmptyingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Alert Callout */}
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-200">
                    Konfirmasi Pengosongan / Kuras Tangki
                  </p>
                  <p className="text-slate-300">
                    Stok fisik saat ini sebanyak{' '}
                    <strong className="text-rose-400 font-mono font-bold">
                      {formatNumberID(emptyingItem.currentStock)} {emptyingItem.unit}
                    </strong>{' '}
                    akan dikuras dan direset menjadi{' '}
                    <strong className="text-white font-mono font-bold">0 {emptyingItem.unit}</strong>.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Sistem akan otomatis mencatat riwayat transaksi mutasi pengeluaran (OUT) kuras tangki untuk keperluan audit gudang.
                  </p>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alasan / Keterangan Pengosongan Tangki:
                </label>
                <select
                  value={emptyReason}
                  onChange={(e) => setEmptyReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-sans cursor-pointer"
                >
                  <option value="Kuras & Pembersihan Tangki Berkala">
                    Kuras &amp; Pembersihan Tangki Berkala
                  </option>
                  <option value="Pergantian Batch / Kualitas BBM Baru">
                    Pergantian Batch / Kualitas BBM Baru
                  </option>
                  <option value="Kalibrasi Ulang Sensor Level Tangki">
                    Kalibrasi Ulang Sensor Level Tangki
                  </option>
                  <option value="Perawatan & Inspeksi Fisik Tangki Bocor">
                    Perawatan &amp; Inspeksi Fisik Tangki Bocor
                  </option>
                  <option value="Koreksi Fisik (Stok Tangki Nyata Kosong)">
                    Koreksi Fisik (Stok Tangki Nyata Kosong)
                  </option>
                  <option value="LAINNYA">Alasan Lainnya (Tulis Manual)</option>
                </select>
              </div>

              {emptyReason === 'LAINNYA' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tulis Alasan Pengosongan:
                  </label>
                  <input
                    type="text"
                    required
                    value={emptyCustomNotes}
                    onChange={(e) => setEmptyCustomNotes(e.target.value)}
                    placeholder="Contoh: Pemindahan tangki ke lokasi proyek B..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEmptyingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={emptyingItem.currentStock <= 0 || isSubmittingEmpty}
                  onClick={async () => {
                    if (emptyingItem.currentStock <= 0) {
                      setEmptyingItem(null);
                      return;
                    }
                    setIsSubmittingEmpty(true);
                    const finalReason =
                      emptyReason === 'LAINNYA'
                        ? emptyCustomNotes.trim() || 'Pengosongan Tangki Manual'
                        : emptyReason;
                    if (onEmptyTank) {
                      await onEmptyTank(emptyingItem.id, finalReason);
                    }
                    setIsSubmittingEmpty(false);
                    setEmptyingItem(null);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    emptyingItem.currentStock <= 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {emptyingItem.currentStock <= 0
                      ? 'Tangki Sudah Kosong'
                      : isSubmittingEmpty
                      ? 'Mengosongkan...'
                      : 'Ya, Kosongkan Tangki (0 L)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS TANGKI BBM ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hapus Tangki / Drum BBM</h3>
                  <p className="text-xs text-slate-400">{itemToDelete.sku}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300">
                Apakah Anda yakin ingin menghapus data tangki <strong>{itemToDelete.name}</strong> dari inventaris gudang dan sistem monitoring?
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <div>Stok Fisik Saat Ini: <span className="text-amber-400 font-bold">{formatNumberID(itemToDelete.currentStock)} Liter</span></div>
                <div>Kapasitas Tangki: <span className="text-white">{formatNumberID(itemToDelete.tankCapacity || 0)} Liter</span></div>
                <div>Lokasi: <span className="text-slate-300">{itemToDelete.location}</span></div>
              </div>
              <p className="text-rose-400 text-[11px] italic">
                * Data tangki ini akan dihapus permanen dari cloud Firestore dan daftar peringatan stok.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all flex items-center gap-1.5 shadow-md shadow-rose-900/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Tangki</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
