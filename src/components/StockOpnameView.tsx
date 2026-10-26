import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { AuthUser } from '../types/auth';
import { CheckCircle2, AlertTriangle, RefreshCw, Save, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface StockOpnameViewProps {
  items: InventoryItem[];
  currentUser?: AuthUser;
  onApplyOpname: (
    adjustments: {
      item: InventoryItem;
      physicalStock: number;
      difference: number;
      notes: string;
    }[]
  ) => void;
  onCancel: () => void;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({
  items,
  currentUser,
  onApplyOpname,
  onCancel,
}) => {
  // Store physical inputs: itemId -> string value
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    items.forEach((item) => {
      initial[item.id] = String(item.currentStock);
    });
    return initial;
  });

  const [notesRecord, setNotesRecord] = useState<Record<string, string>>({});
  const [opnameReference, setOpnameReference] = useState<string>(
    () => `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-AUDIT`
  );
  const [auditorName, setAuditorName] = useState<string>(
    currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tim Audit Gudang & QC'
  );

  const handlePhysicalChange = (itemId: string, value: string) => {
    setPhysicalCounts((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleNotesChange = (itemId: string, value: string) => {
    setNotesRecord((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const discrepancies = items.map((item) => {
    const physicalVal = parseFloat(physicalCounts[item.id]) ?? item.currentStock;
    const diff = physicalVal - item.currentStock;
    return {
      item,
      physicalVal,
      diff,
      notes: notesRecord[item.id] || '',
    };
  });

  const changedItems = discrepancies.filter((d) => d.diff !== 0 && !isNaN(d.physicalVal));

  const handleSave = () => {
    if (changedItems.length === 0) {
      alert('Tidak ada selisih stok fisik yang diubah.');
      return;
    }

    const adjustments = changedItems.map((c) => ({
      item: c.item,
      physicalStock: c.physicalVal,
      difference: c.diff,
      notes: c.notes || `Stock Opname Ref: ${opnameReference} oleh ${auditorName}`,
    }));

    onApplyOpname(adjustments);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Opname Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Formulir Stock Opname Fisik Gudang
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    AUDIT MODE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verifikasi fisik drum BBM, kaleng fumigasi, botol spraying, dan inventaris APD
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-slate-400 block">No. Berita Acara:</span>
              <input
                type="text"
                value={opnameReference}
                onChange={(e) => setOpnameReference(e.target.value)}
                className="text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Petugas Auditor:</span>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <div className="pt-4 sm:pt-0">
              <button
                type="button"
                onClick={handleSave}
                disabled={changedItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                  changedItems.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {currentUser?.permissions.canApplyStockOpname
                  ? `Terapkan Penyesuaian (${changedItems.length} Item Selisih)`
                  : `Simpan Audit Fisik (${changedItems.length} Item Selisih)`}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Item Dihitung:</span>
            <span className="text-lg font-bold text-white">{items.length} SKU</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Stok Sesuai:</span>
            <span className="text-lg font-bold text-emerald-400">
              {items.length - changedItems.length} Sesuai
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Item Terdapat Selisih:</span>
            <span
              className={`text-lg font-bold ${
                changedItems.length > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {changedItems.length} Item
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Status Opname:</span>
              <span className="text-xs font-semibold text-slate-200">
                {changedItems.length > 0 ? 'Siap Diselaraskan' : 'Kesesuaian 100%'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const initial: Record<string, string> = {};
                items.forEach((item) => {
                  initial[item.id] = String(item.currentStock);
                });
                setPhysicalCounts(initial);
                setNotesRecord({});
              }}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset Fisik
            </button>
          </div>
        </div>
      </div>

      {/* Table of Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Lokasi Rak/Tangki</th>
                <th className="py-3 px-4 text-right">Stok Sistem</th>
                <th className="py-3 px-4 w-40 text-center">Hitungan Fisik</th>
                <th className="py-3 px-4 text-center">Selisih (+ / -)</th>
                <th className="py-3 px-4">Alasan / Catatan Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 text-xs">
              {discrepancies.map(({ item, physicalVal, diff, notes }) => {
                const hasDiff = diff !== 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      hasDiff ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="font-mono text-slate-400 text-[11px] flex items-center gap-2">
                        <span>{item.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {formatNumberID(item.currentStock)} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={physicalCounts[item.id] ?? ''}
                          onChange={(e) => handlePhysicalChange(item.id, e.target.value)}
                          className={`w-28 text-center font-mono font-bold text-sm px-2 py-1 rounded bg-slate-950 border focus:outline-none ${
                            hasDiff
                              ? 'border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                              : 'border-slate-700 text-white focus:border-blue-500'
                          }`}
                        />
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {hasDiff ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                            diff > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : `${diff}`} {item.unit}
                        </span>
                      ) : (
                        <span className="text-emerald-500 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sesuai
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder={hasDiff ? 'Wajib isi alasan selisih...' : 'Kondisi fisik aman'}
                        value={notes}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
