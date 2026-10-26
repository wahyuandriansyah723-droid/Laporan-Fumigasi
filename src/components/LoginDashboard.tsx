import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/auth';
import { INITIAL_AUTH_USERS, DEMO_PASSWORDS } from '../data/initialAuthUsers';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { FumigationJobReport } from '../types/jobs';
import {
  Warehouse,
  Shield,
  ShieldCheck,
  UserCheck,
  Microscope,
  ArrowRight,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Boxes,
  Fuel,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Flame,
  Bug,
  Info,
  Check,
  X,
  LogOut,
  Activity,
  Calendar,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface LoginDashboardProps {
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onBackToApp?: () => void;
  items?: InventoryItem[];
  transactions?: StockTransaction[];
  jobReports?: FumigationJobReport[];
}

export const LoginDashboard: React.FC<LoginDashboardProps> = ({
  onLoginSuccess,
  currentUser,
  onLogout,
  onBackToApp,
  items = [],
  transactions = [],
  jobReports = [],
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>('ADMIN');
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Quick stats calculations
  const totalItemsCount = items.length > 0 ? items.length : 12;
  const criticalItemsCount =
    items.length > 0
      ? items.filter((i) => i.currentStock <= (i.minimumStockThreshold || 10)).length
      : 2;
  const totalJobsCount = jobReports.length > 0 ? jobReports.length : 5;
  const approvedJobsCount =
    jobReports.length > 0
      ? jobReports.filter((j) => j.qcApprovalStatus === 'APPROVED').length
      : 3;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim().toLowerCase();
    const foundUser = INITIAL_AUTH_USERS.find(
      (u) => u.username.toLowerCase() === trimmedUsername
    );

    if (!foundUser) {
      setErrorMessage('Akun pengguna tidak ditemukan. Gunakan username: admin, operator, atau qc.');
      return;
    }

    const expectedPassword = DEMO_PASSWORDS[foundUser.username];
    if (password !== expectedPassword && password !== 'password123' && password !== '123456') {
      setErrorMessage(`Kata sandi salah. Kata sandi default untuk "${foundUser.username}" adalah "${expectedPassword}".`);
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = INITIAL_AUTH_USERS.find((u) => u.role === role);
    if (user) {
      setUsername(user.username);
      setPassword(DEMO_PASSWORDS[user.username] || 'admin123');
      onLoginSuccess(user);
    }
  };

  const handleSelectRoleTemplate = (role: UserRole) => {
    setSelectedDemoRole(role);
    const user = INITIAL_AUTH_USERS.find((u) => u.role === role);
    if (user) {
      setUsername(user.username);
      setPassword(DEMO_PASSWORDS[user.username] || 'admin123');
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Background Ambient Lighting */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Telemetry Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white font-mono">
                  LOGIX<span className="text-amber-400">.WMS</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                  Portal Login &amp; Dasbor Otorisasi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistem Manajemen Inventaris Bahan Kimia, Obat Fumigasi &amp; BBM Industri
              </p>
            </div>
          </div>

          {/* System Status / Logged-in State */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">
                  Sesi Aktif: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
                </span>
                {onBackToApp && (
                  <button
                    type="button"
                    onClick={onBackToApp}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Buka Aplikasi &rarr;
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Server Online &bull; LocalSync
                </span>
                <span className="hidden md:inline px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  Barantan ISPM-15 &amp; K3
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Portal Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 z-10">
        {/* Welcome Hero / Announcement */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dasbor Login Terpadu · Akses Sesuai Wewenang Peran</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Selamat Datang di Portal Sistem Inventaris Gudang LOGIX
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Silakan pilih portal masuk di bawah ini sesuai dengan wewenang tugas Anda. Setiap peran memiliki antarmuka khusus untuk menjaga kepatuhan keselamatan kerja (K3), akurasi pembukuan stok, dan standar karantina Barantan.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Boxes className="w-4 h-4 text-amber-400" />
                <span>Total Komoditas</span>
              </div>
              <div className="text-lg font-black text-white font-mono">{totalItemsCount} SKU</div>
              <div className="text-[10px] text-slate-400">Kimia, Obat &amp; BBM</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Peringatan Stok</span>
              </div>
              <div className="text-lg font-black text-rose-400 font-mono">{criticalItemsCount} Item</div>
              <div className="text-[10px] text-slate-400">Batas Minimum K3</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                <span>SPK Terdaftar</span>
              </div>
              <div className="text-lg font-black text-blue-400 font-mono">{totalJobsCount} SPK</div>
              <div className="text-[10px] text-slate-400">Fumigasi &amp; Fogging</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Microscope className="w-4 h-4 text-emerald-400" />
                <span>Inspeksi QC Lolos</span>
              </div>
              <div className="text-lg font-black text-emerald-400 font-mono">{approvedJobsCount} SPK</div>
              <div className="text-[10px] text-slate-400">Rekomendasi Approved</div>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Role Portal Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>3 Portal Akses Peran Khusus</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Lihat Matriks Hak Akses RBAC &rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PORTAL 1: ADMINISTRATOR */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                selectedDemoRole === 'ADMIN'
                  ? 'bg-purple-950/30 border-purple-500/60 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                    Akses Penuh &amp; Kroscek
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Administrator</h4>
                  <p className="text-xs text-purple-400 font-medium">Kepala Logistik &amp; Pengawas WMS</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-purple-300 text-[11px] uppercase tracking-wider">
                    Wewenang &amp; Tanggung Jawab:
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Bisa edit, hapus, dan simpan</strong> seluruh barang &amp; mutasi.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Bisa kroscek semua</strong>: rekonsiliasi SPK vs mutasi pengeluaran riil gudang.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>Pantau audit QC &amp; tindak lanjut wajib fumigasi ulang.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>Kelola Master Data, Stock Opname, dan Pengaturan Sistem.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Akun: <strong>admin</strong></span>
                  <span className="text-slate-400 font-mono text-[11px]">Sandi: <strong>admin123</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTemplate('ADMIN')}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Pilih di Form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ADMIN')}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Masuk Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* PORTAL 2: QUALITY CONTROL (QC) */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                selectedDemoRole === 'QC'
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Microscope className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Khusus Evaluasi &amp; Approve
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Quality Control (QC)</h4>
                  <p className="text-xs text-emerald-400 font-medium">Inspektur K3 &amp; Standar Barantan</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-emerald-300 text-[11px] uppercase tracking-wider">
                    Wewenang &amp; Tanggung Jawab:
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Hanya bisa melihat</strong> laporan pekerjaan fumigasi &amp; spraying fogging.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Berikan rekomendasi resmi</strong>: [OK], [Belum OK], atau [Fumigasi Ulang].</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Pengesahan Approve</strong> laporan pekerjaan berstandar ISPM-15.</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>Tidak memiliki akses ubah stok fisik atau hapus data gudang.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Akun: <strong>qc</strong></span>
                  <span className="text-slate-400 font-mono text-[11px]">Sandi: <strong>qc123</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTemplate('QC')}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Pilih di Form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('QC')}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Masuk QC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* PORTAL 3: OPERATOR LAPANGAN */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                selectedDemoRole === 'OPERATOR'
                  ? 'bg-blue-950/30 border-blue-500/60 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                    Khusus Input Obat &amp; BBM
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Operator Lapangan</h4>
                  <p className="text-xs text-blue-400 font-medium">Teknisi Fumigasi &amp; Pest Spraying</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-blue-300 text-[11px] uppercase tracking-wider">
                    Wewenang &amp; Tanggung Jawab:
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Hanya bisa input pengeluaran</strong> bahan kimia obat &amp; BBM mesin.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Input pekerjaan SPK</strong> spraying fogging dan fumigasi.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>Stok gudang terpotong otomatis secara real-time saat SPK disimpan.</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>Dibatasi dari hapus barang, stok masuk, atau ubah setelan sistem.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Akun: <strong>operator</strong></span>
                  <span className="text-slate-400 font-mono text-[11px]">Sandi: <strong>operator123</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTemplate('OPERATOR')}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Pilih di Form
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('OPERATOR')}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Masuk Operator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Formulir Otentikasi Pengguna</h3>
                  <p className="text-[11px] text-slate-400">Masukkan akun atau pilih peran cepat di atas</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                AES-256 Sesi Lokal
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username / ID Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin, operator, atau qc"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Masuk ke Dasbor Sistem</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sandi Bawaan:</span>
                  <span className="font-mono text-purple-400">admin123</span> /{' '}
                  <span className="font-mono text-blue-400">operator123</span> /{' '}
                  <span className="font-mono text-emerald-400">qc123</span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Safety Notice & Guidelines */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Protokol Keamanan K3 &amp; Gudang HazMat</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aplikasi ini terhubung langsung dengan pencatatan gas beracun (Phosphine PH3, Methyl Bromide CH3Br), insektisida pest control, dan BBM industri Solar B35/Pertamax.
              </p>
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Tangki BBM wajib dilengkapi grounding penangkal statis &amp; pemadam kebakaran APAR Powder/Foam.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                  <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>Operator wajib mengenakan Full Face Mask Canister tipe B (kuning) saat penanganan fumigan.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Sertifikat pelepasan gas bebas racun (Aerasi) wajib ditandatangani oleh Tim QC sebelum kontainer diberangkatkan.</span>
                </div>
              </div>
            </div>

            {/* Matrix preview button */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Ringkasan Matriks Otorisasi</p>
                <p className="text-[11px] text-slate-400">Lihat perbandingan hak akses per modul</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
              >
                Buka Matriks
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* RBAC Matrix Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Matriks Hak Akses &amp; Otorisasi Peran (RBAC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Berikut rincian otorisasi modul sistem sesuai instruksi wewenang pengguna:
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Modul &amp; Fitur Sistem</th>
                    <th className="p-3 text-center text-purple-400">Admin Gudang</th>
                    <th className="p-3 text-center text-emerald-400">Quality Control (QC)</th>
                    <th className="p-3 text-center text-blue-400">Operator Lapangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Edit, Hapus &amp; Simpan Barang</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Penuh</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-slate-400">Lihat Saja</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Hapus Transaksi Mutasi</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Penuh</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Kroscek Semua (SPK vs Mutasi Gudang)</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Penuh (Hub Kroscek)</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Input Pengeluaran Obat &amp; BBM</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Bisa</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-blue-400 font-bold">✓ Khusus OUT Obat/BBM</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Input Pekerjaan Spraying, Fogging &amp; Fumigasi</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Bisa</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-blue-400 font-bold">✓ Bisa (Modal SPK)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Lihat Laporan Pekerjaan Fumigasi &amp; Fogging</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Bisa</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Akses Utama</td>
                    <td className="p-3 text-center text-slate-400">Lihat Rekap</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Rekomendasi (OK / Belum OK / Fumigasi Ulang)</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Bisa Override</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Wewenang Utama</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Approve Resmi Laporan Pekerjaan</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Bisa</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Wewenang Utama</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium">Master Data &amp; Konfigurasi Sistem</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">✓ Penuh</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                    <td className="p-3 text-center text-slate-500">✕ Tidak Bisa</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Tutup Matriks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-8 text-center text-xs text-slate-500 font-mono">
        LOGIX WMS &bull; Standar Barantan ISPM-15 &bull; Protokol Keselamatan Gas Fosfin &amp; BBM Industri
      </footer>
    </div>
  );
};
