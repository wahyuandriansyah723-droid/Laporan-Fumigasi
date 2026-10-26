import React from 'react';
import { HazardClass } from '../types/inventory';
import { Flame, Skull, AlertCircle, ShieldCheck } from 'lucide-react';

interface HazardBadgeProps {
  hazard: HazardClass;
  showIconOnly?: boolean;
}

export const HazardBadge: React.FC<HazardBadgeProps> = ({ hazard, showIconOnly = false }) => {
  switch (hazard) {
    case 'FLAMMABLE':
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-400"
          title="Bahan Mudah Terbakar (Flammable Hazard - Jauhkan dari sumber api)"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {!showIconOnly && <span>Flammable</span>}
        </span>
      );
    case 'TOXIC':
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400"
          title="Bahan Kimia Beracun Tinggi / Gas Lethal (Wajib APD Penuh ABEK2P3)"
        >
          <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          {!showIconOnly && <span>Toxic / Beracun</span>}
        </span>
      );
    case 'CAUTION':
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400"
          title="Perhatian - Pestisida Iritan (Gunakan masker & sarung tangan)"
        >
          <AlertCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          {!showIconOnly && <span>Pestisida Iritan</span>}
        </span>
      );
    case 'CORROSIVE':
      return (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-400"
          title="Bahan Korosif"
        >
          <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          {!showIconOnly && <span>Korosif</span>}
        </span>
      );
    case 'SAFE':
    default:
      return (
        <span
          className="inline-flex items-center gap-1 text-xs text-slate-400"
          title="Peralatan / APD Standar"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {!showIconOnly && <span>Alat / APD</span>}
        </span>
      );
  }
};
