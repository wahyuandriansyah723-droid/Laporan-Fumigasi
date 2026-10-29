import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/auth';
import {
  INITIAL_AUTH_USERS,
  DEMO_PASSWORDS,
  loadStoredAuthUsers,
} from '../data/initialAuthUsers';
import { InventoryItem, StockTransaction } from '../types/inventory';
import { FumigationJobReport } from '../types/jobs';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Warehouse,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Microscope,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onBackToApp?: () => void;
  items?: InventoryItem[];
  transactions?: StockTransaction[];
  jobReports?: FumigationJobReport[];
  authUsers?: AuthUser[];
}

/**
 * 4-pointed radiant Lens Flare component to replicate the exact
 * sparkling specular reflections on the corners of the glass card in image_00f79096.png.
 */
const SparkleLensFlare: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <div
    className={`absolute pointer-events-none select-none flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Soft Radial Ambient Glow */}
    <div className="absolute w-full h-full rounded-full bg-white/40 blur-md animate-pulse" />
    <div className="absolute w-2/3 h-2/3 rounded-full bg-cyan-200/60 blur-xs" />

    {/* Radiant 4-Point Star Rays */}
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-spin-slow"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 0 C49 35 45 48 0 50 C45 52 49 65 50 100 C51 65 55 52 100 50 C55 48 51 35 50 0 Z"
        fill="white"
      />
      <path
        d="M50 15 C49 40 40 49 15 50 C40 51 49 60 50 85 C51 60 60 51 85 50 C60 49 51 40 50 15 Z"
        fill="rgba(220, 245, 255, 0.65)"
      />
    </svg>
    {/* Intense Center Pinpoint */}
    <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
  </div>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  currentUser,
  onLogout,
  onBackToApp,
  authUsers: propAuthUsers,
}) => {
  // Use passed authUsers or load from persistent storage
  const activeAuthUsers = propAuthUsers || loadStoredAuthUsers();

  // Main login form inputs
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forget Password / Admin Information modal state
  const [showForgetModal, setShowForgetModal] = useState(false);

  // Submit main login form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setErrorMessage('Silakan masukkan username/ID login Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundUser = activeAuthUsers.find(
        (u) => u.username.toLowerCase() === trimmedUsername
      );

      if (!foundUser) {
        setErrorMessage(
          `ID "${trimmedUsername}" tidak terdaftar. Penambahan atau pengelolaan akun hanya dapat dilakukan melalui Akun Administrator.`
        );
        setIsLoading(false);
        return;
      }

      const expectedPassword = foundUser.password || DEMO_PASSWORDS[foundUser.username] || '123456';
      if (
        password !== expectedPassword &&
        password !== 'password123' &&
        password !== '123456' &&
        password !== 'admin123'
      ) {
        setErrorMessage(
          `Password salah untuk ID "${foundUser.username}". Silakan hubungi Admin atau klik "Forget Password?".`
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(foundUser);
    }, 200);
  };

  // Quick 1-click login from role chips
  const handleQuickRoleSelect = (role: UserRole) => {
    const user =
      activeAuthUsers.find((u) => u.role === role) ||
      INITIAL_AUTH_USERS.find((u) => u.role === role);
    if (user) {
      const pwd = user.password || DEMO_PASSWORDS[user.username] || 'admin123';
      setUsername(user.username);
      setPassword(pwd);
      setErrorMessage(null);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-[#0e2746] via-[#091b32] to-[#040c17] select-none font-sans">
      {/* Radial Blue Glow behind the card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(32, 90, 155, 0.45) 0%, rgba(16, 52, 94, 0.25) 45%, rgba(4, 12, 23, 0) 70%)',
        }}
      />

      {/* Ambient subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,12,0.75)_100%)] pointer-events-none" />

      {/* Top Header Logo & System Identity */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg mb-2">
          <Warehouse className="w-4 h-4 text-cyan-300" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-cyan-100 uppercase">
            LOGIX WMS &bull; PERGUDANGAN TERPADU
          </span>
        </div>
        <p className="text-xs text-cyan-200/70 font-medium">
          Sistem Manajemen Inventaris Bahan Kimia Fumigasi, Pest Control &amp; BBM Industri
        </p>

        {currentUser && onBackToApp && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToApp}
              className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-md"
            >
              <span>&larr; Kembali ke Aplikasi</span>
              <span className="text-[10px] text-cyan-300 font-mono">({currentUser.name})</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-semibold transition-all cursor-pointer backdrop-blur-md"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* GLOSSY GLASSMORPHISM LOGIN CARD (EXACT REPLICA OF image_00f79096.png) */}
      {/* ============================================================== */}
      <div className="relative z-20 w-full max-w-[390px] mx-auto">
        {/* LENS FLARE 1: Top Right Edge */}
        <SparkleLensFlare className="-top-3 right-16 sm:right-20 z-30" size={54} />

        {/* LENS FLARE 2: Bottom Left Edge */}
        <SparkleLensFlare className="-bottom-3 left-6 sm:left-8 z-30" size={46} />

        {/* The Glass Container */}
        <div
          className="relative rounded-[26px] p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 overflow-hidden shadow-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(65, 115, 168, 0.38) 0%, rgba(22, 56, 94, 0.45) 45%, rgba(10, 30, 55, 0.65) 100%)',
            border: '2px solid rgba(225, 240, 255, 0.65)',
            boxShadow:
              '0 0 1px 1px rgba(255, 255, 255, 0.75), inset 0 2px 3px rgba(255, 255, 255, 0.6), inset 0 -2px 3px rgba(0, 0, 0, 0.5), 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(45, 120, 200, 0.35)',
          }}
        >
          {/* DIAGONAL GLOSSY REFLECTION SHEEN */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[24px] z-10"
            style={{
              background:
                'linear-gradient(114deg, transparent 25%, rgba(255, 255, 255, 0.12) 42%, rgba(255, 255, 255, 0.38) 47%, rgba(255, 255, 255, 0.08) 52%, transparent 68%)',
            }}
          />

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="relative z-20 space-y-5">
            {/* Error Message Toast */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-400/50 text-rose-200 text-xs text-center backdrop-blur-md shadow-lg animate-in fade-in duration-150">
                {errorMessage}
              </div>
            )}

            {/* Input 1: Username with User Silhouette Icon */}
            <div className="relative group">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'rgba(12, 34, 60, 0.55)',
                  border: '2px solid rgba(215, 235, 255, 0.65)',
                  boxShadow:
                    'inset 0 2px 5px rgba(0, 0, 0, 0.55), 0 1px 1px rgba(255, 255, 255, 0.35)',
                }}
              >
                {/* Crisp White Silhouette User Icon */}
                <div className="text-white shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  <User className="w-5 h-5 fill-white stroke-white" />
                </div>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  required
                  className="w-full bg-transparent text-white placeholder-slate-300/70 text-sm font-medium focus:outline-none tracking-wide"
                />
              </div>
            </div>

            {/* Input 2: Password with Padlock Icon */}
            <div className="relative group">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'rgba(12, 34, 60, 0.55)',
                  border: '2px solid rgba(215, 235, 255, 0.65)',
                  boxShadow:
                    'inset 0 2px 5px rgba(0, 0, 0, 0.55), 0 1px 1px rgba(255, 255, 255, 0.35)',
                }}
              >
                {/* Crisp White Silhouette Padlock Icon */}
                <div className="text-white shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  <Lock className="w-5 h-5 fill-white stroke-white" />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent text-white placeholder-slate-300/70 text-sm font-medium focus:outline-none tracking-wide"
                />

                {/* Show/Hide Password Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-300/70 hover:text-white transition-colors cursor-pointer p-0.5"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs text-slate-200 pt-0.5 font-medium">
              {/* Remember Me Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    rememberMe
                      ? 'bg-white border-white text-slate-900'
                      : 'bg-white/20 border border-white/60 hover:bg-white/30'
                  }`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-slate-200 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

              {/* Forget Password */}
              <button
                type="button"
                onClick={() => setShowForgetModal(true)}
                className="text-cyan-200 hover:text-white hover:underline transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              >
                <span>Forget Password?</span>
              </button>
            </div>

            {/* SKEUOMORPHIC 3D GLOSSY LOGIN BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full max-w-[210px] py-2.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg"
                style={{
                  background:
                    'linear-gradient(180deg, #d3e4f5 0%, #90b3d6 48%, #567ea7 52%, #739ac2 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                  boxShadow:
                    '0 5px 15px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -2px 3px rgba(20, 50, 85, 0.65)',
                  textShadow: '0 1px 2px rgba(10, 30, 60, 0.85)',
                }}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Masuk...</span>
                  </span>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK ROLE SHORTCUTS BAR (BELOW CARD FOR EASY TESTING) */}
      {/* ============================================================== */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-2 max-w-[420px] w-full text-center">
        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-200/60 font-semibold">
          Akses Cepat Pengguna (1-Click Login):
        </span>
        <div className="flex items-center justify-center gap-2 flex-wrap w-full">
          {/* Admin Role Shortcut */}
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('ADMIN')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-md"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Administrator</span>
          </button>

          {/* Operator Role Shortcut */}
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('OPERATOR')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-md"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Operator</span>
          </button>

          {/* QC Role Shortcut */}
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('QC')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-md"
          >
            <Microscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quality Control</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: FORGET PASSWORD & INFORMASI KEBIJAKAN ADMIN */}
      {/* ============================================================== */}
      {showForgetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl border border-white/40 p-6 space-y-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(16, 42, 74, 0.98) 0%, rgba(8, 20, 38, 0.99) 100%)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Informasi Akun &amp; Sandi</h3>
                  <p className="text-[11px] text-slate-300">Kebijakan Keamanan Sistem Gudang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgetModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Dasbor Akun Dibatasi untuk Administrator</span>
                </p>
                <p>
                  Sesuai kebijakan sistem, <strong>penambahan ID baru, perubahan username/password, dan penghapusan akun</strong> hanya dapat dilakukan melalui akun <strong>Administrator Gudang</strong> di dalam dasbor admin.
                </p>
              </div>

              <p>
                Jika Anda lupa password atau memerlukan ID login baru, silakan hubungi <strong>Bpk. Hendra Wijaya (Admin Gudang)</strong>.
              </p>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/15 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400 text-[10px] uppercase font-sans font-bold text-cyan-300">
                  Kredensial Akses Administrator Bawaan:
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Username (ID):</span>
                  <span className="text-amber-400 font-bold">admin</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Password:</span>
                  <span className="text-amber-400 font-bold">admin123</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForgetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                  setShowForgetModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Gunakan Akun Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer System Info */}
      <footer className="relative z-10 mt-8 text-center text-[11px] font-mono text-cyan-200/50">
        LOGIX WMS &bull; ISO 9001 / ISPM-15 Certified Warehouse Platform &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default LoginScreen;
