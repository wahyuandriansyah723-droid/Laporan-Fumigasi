import React, { useState, useRef, useEffect } from 'react';
import { AuthUser, UserRole } from '../types/auth';
import { INITIAL_AUTH_USERS } from '../data/initialAuthUsers';
import {
  Shield,
  UserCheck,
  Microscope,
  LogOut,
  ChevronDown,
  Check,
  User,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Phone,
  Mail,
  BadgeAlert,
} from 'lucide-react';

interface UserProfileMenuProps {
  currentUser: AuthUser;
  onSwitchUser: (newUser: AuthUser) => void;
  onLogout: () => void;
  onOpenLoginDashboard?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onSwitchUser,
  onLogout,
  onOpenLoginDashboard,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'OPERATOR':
        return <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'QC':
        return <Microscope className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getRoleBadgeClasses = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'OPERATOR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'QC':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors cursor-pointer group"
      >
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-md`}
        >
          {currentUser.name.charAt(0)}
        </div>

        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
              {currentUser.name}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${getRoleBadgeClasses(
                currentUser.role
              )}`}
            >
              {currentUser.role}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">{currentUser.roleTitle}</span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Header */}
          <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center font-extrabold text-white text-base shadow-lg`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              </div>
              <p className="text-xs text-amber-400 font-medium">{currentUser.roleTitle}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{currentUser.nip}</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="py-2.5 space-y-1 text-xs text-slate-400 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentUser.phone}</span>
            </div>
          </div>

          {/* Role Permissions Summary */}
          <div className="py-2.5 border-b border-slate-800">
            <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Hak Akses ({currentUser.role})</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canManageInventory ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canManageInventory ? '✓' : '✕'} Kelola Stok
              </span>
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canCreateTransactions ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canCreateTransactions ? '✓' : '✕'} Transaksi IN/OUT
              </span>
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canApplyStockOpname ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canApplyStockOpname ? '✓' : '✕'} Apply Opname
              </span>
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canVerifyQC ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canVerifyQC ? '✓' : '✕'} Verifikasi QC/CoA
              </span>
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canManageMasterData ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canManageMasterData ? '✓' : '✕'} Master Data
              </span>
              <span
                className={`flex items-center gap-1 ${
                  currentUser.permissions.canManageSettings ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {currentUser.permissions.canManageSettings ? '✓' : '✕'} Pengaturan Sistem
              </span>
            </div>
          </div>

          {/* Quick Switch Role */}
          <div className="pt-3 pb-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ganti Akun Cepat</span>
            </p>
            <div className="space-y-1">
              {INITIAL_AUTH_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(user);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span>{user.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({user.role})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            {onOpenLoginDashboard && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenLoginDashboard();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Buka Dasbor Login &amp; Portal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
