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
