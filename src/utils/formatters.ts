export function formatCurrencyIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumberID(val: number): string {
  return new Intl.NumberFormat('id-ID').format(val);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatFullDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthYearIndo(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-');
    if (!year || !month) return yearMonth;
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return yearMonth;
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  } catch {
    return dateStr;
  }
}

export function getExpiryStatus(expiredDate?: string): {
  status: 'expired' | 'warning' | 'safe' | 'none';
  label: string;
  daysRemaining?: number;
} {
  if (!expiredDate) return { status: 'none', label: 'Tidak ada ED' };
  
  const now = new Date('2026-09-23T00:00:00'); // current simulated time
  const exp = new Date(expiredDate);
  if (isNaN(exp.getTime())) return { status: 'none', label: 'Format Salah' };

  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', label: `Expired (${Math.abs(diffDays)} hari lalu)`, daysRemaining: diffDays };
  } else if (diffDays <= 60) {
    return { status: 'warning', label: `Mendekati ED (${diffDays} hari lagi)`, daysRemaining: diffDays };
  } else {
    return { status: 'safe', label: `Aman (${diffDays} hari lagi)`, daysRemaining: diffDays };
  }
}

export function getDayNameIndo(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()];
  } catch {
    return '';
  }
}

export interface FumigationDurationInfo {
  totalDays: number;
  durationDays: number;
  totalHours: number;
  durationHours: number;
  elapsedDays: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' | 'SAME_DAY';
  durationLabel: string;
  detailText: string;
  progressText: string;
  rangeText: string;
  isOngoing: boolean;
}

/**
 * Menghitung sudah berapa lama pekerjaan difumigasi / spraying fogging
 * dari Tanggal Tutup (closingDate) sampai Tanggal Buka / Tanggal Aktif (openingDate).
 */
export function getFumigationDurationInfo(
  closingDateStr?: string,
  openingDateStr?: string,
  exposureHours?: number | string
): FumigationDurationInfo {
  const parsedExpHours = exposureHours !== undefined && exposureHours !== '' ? Number(exposureHours) : undefined;
  const validExpHours = parsedExpHours !== undefined && !isNaN(parsedExpHours) ? parsedExpHours : undefined;

  const fallbackDate = new Date().toISOString().slice(0, 10);
  const startStr = (closingDateStr || fallbackDate).slice(0, 10);
  const endStr = (openingDateStr || closingDateStr || fallbackDate).slice(0, 10);

  const start = new Date(startStr);
  const end = new Date(endStr);

  const startValid = !isNaN(start.getTime());
  const endValid = !isNaN(end.getTime());

  if (!startValid || !endValid) {
    const hours = validExpHours || 24;
    return {
      totalDays: 1,
      durationDays: 1,
      totalHours: hours,
      durationHours: hours,
      elapsedDays: 1,
      status: 'SAME_DAY',
      durationLabel: '1 Hari',
      detailText: '1 Hari',
      progressText: '1 Hari',
      rangeText: '-',
      isOngoing: false,
    };
  }

  // Set ke UTC Midnight agar bebas dari timezone offset daylight
  const startMs = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endMs = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));

  const totalDays = diffDays === 0 ? 1 : diffDays;
  const totalHours = validExpHours && validExpHours > 0 ? validExpHours : totalDays * 24;

  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeText = `${formatDateIndo(startStr)} s/d ${formatDateIndo(endStr)}`;

  if (diffDays === 0) {
    const hoursLabel = validExpHours && validExpHours > 0 ? `${validExpHours} Jam` : '24 Jam';
    return {
      totalDays: 1,
      durationDays: 1,
      totalHours,
      durationHours: totalHours,
      elapsedDays: 1,
      status: 'SAME_DAY',
      durationLabel: `1 Hari (${hoursLabel})`,
      detailText: `Perlakuan 1 Hari (${hoursLabel} paparan)`,
      progressText: `Selesai 1 Hari (${hoursLabel})`,
      rangeText: formatDateIndo(startStr),
      isOngoing: false,
    };
  }

  if (todayMs < startMs) {
    return {
      totalDays,
      durationDays: totalDays,
      totalHours,
      durationHours: totalHours,
      elapsedDays: 0,
      status: 'UPCOMING',
      durationLabel: `${totalDays} Hari`,
      detailText: `${totalDays} Hari (${rangeText})`,
      progressText: `Terjadwal ${totalDays} hari`,
      rangeText,
      isOngoing: false,
    };
  } else if (todayMs >= endMs) {
    return {
      totalDays,
      durationDays: totalDays,
      totalHours,
      durationHours: totalHours,
      elapsedDays: totalDays,
      status: 'COMPLETED',
      durationLabel: `${totalDays} Hari`,
      detailText: `Selesai ${totalDays} Hari (${rangeText})`,
      progressText: `Selesai ${totalDays} hari (Aktif dibuka sejak ${formatDateIndo(endStr)})`,
      rangeText,
      isOngoing: false,
    };
  } else {
    const elapsed = Math.min(totalDays, Math.max(1, Math.round((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1));
    return {
      totalDays,
      durationDays: totalDays,
      totalHours,
      durationHours: totalHours,
      elapsedDays: elapsed,
      status: 'IN_PROGRESS',
      durationLabel: `Hari ke-${elapsed} dari ${totalDays} Hari`,
      detailText: `Sedang difumigasi: Hari ke-${elapsed} dari ${totalDays} Hari (${rangeText})`,
      progressText: `Sedang difumigasi: Hari ke-${elapsed} dari total ${totalDays} hari`,
      rangeText,
      isOngoing: true,
    };
  }
}
