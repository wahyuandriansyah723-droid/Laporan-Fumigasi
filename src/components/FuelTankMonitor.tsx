import React from 'react';
import { InventoryItem } from '../types/inventory';
import { Fuel, AlertTriangle, ArrowUpRight, ArrowDownRight, Droplet, Gauge } from 'lucide-react';
import { formatNumberID } from '../utils/formatters';
import { getMinThreshold, isBelowMinimumThreshold } from '../utils/stockUtils';

interface FuelTankMonitorProps {
  items: InventoryItem[];
  onQuickAction: (item: InventoryItem, actionType: 'IN' | 'OUT') => void;
}

export const FuelTankMonitor: React.FC<FuelTankMonitorProps> = ({ items, onQuickAction }) => {
  const fuelItems = items.filter((item) => item.category === 'BBM' && item.isFuel);

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
        <div className="text-xs text-slate-400 font-mono">
          Threshold Alert: <span className="text-amber-400 font-semibold">Min 20%</span>
        </div>
      </div>

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
              className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{item.sku}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.location}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                    {item.name}
                  </h3>
                </div>

                <div className="text-right">
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
                      <div className="text-xs text-slate-400">
                        Kapasitas Tangki: {formatNumberID(capacity)} Liter
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
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onQuickAction(item, 'IN')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Isi / Terima BBM
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAction(item, 'OUT')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Pakai / Dispense
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
