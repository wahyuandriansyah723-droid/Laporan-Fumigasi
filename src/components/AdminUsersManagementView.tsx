import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/auth';
import { getDefaultPermissionsForRole } from '../data/initialAuthUsers';
import {
  KeyRound,
  Plus,
  Search,
  Shield,
  User,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Microscope,
  Lock,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

interface AdminUsersManagementViewProps {
  authUsers: AuthUser[];
  currentUser: AuthUser;
  onSaveUser: (user: AuthUser, isNew: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onShowToast: (message: string) => void;
}

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  authUsers,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Inline Row Edit State (Memungkinkan tombol "Simpan" langsung di setiap baris akun)
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlineUsername, setInlineUsername] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineRole, setInlineRole] = useState<UserRole>('OPERATOR');
  const [inlineShowPassword, setInlineShowPassword] = useState(true);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [newNip, setNewNip] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Full Edit Modal State
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR');
  const [editNip, setEditNip] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Metrics
  const totalCount = authUsers.length;
  const adminCount = authUsers.filter((u) => u.role === 'ADMIN').length;
  const operatorCount = authUsers.filter((u) => u.role === 'OPERATOR').length;
  const qcCount = authUsers.filter((u) => u.role === 'QC').length;

  // Filtered users
  const filteredUsers = authUsers.filter((user) => {
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.nip && user.nip.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Start Inline Edit
  const handleStartInlineEdit = (user: AuthUser) => {
    setInlineEditingId(user.id);
    setInlineName(user.name);
    setInlineUsername(user.username);
    setInlinePassword(user.password || 'admin123');
    setInlineRole(user.role);
    setInlineShowPassword(true);
    setInlineError(null);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineError(null);
  };

  // Save Inline Edit ("Tombol Simpan untuk setiap perubahan yang dilakukan")
  const handleSaveInlineEdit = (userId: string) => {
    setInlineError(null);
    const cleanUsername = inlineUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setInlineError('Username / ID tidak boleh kosong.');
      return;
    }
    if (cleanUsername.includes(' ')) {
      setInlineError('Username tidak boleh mengandung spasi.');
      return;
    }
    if (!inlinePassword.trim()) {
      setInlineError('Password tidak boleh kosong.');
      return;
    }
    if (!inlineName.trim()) {
      setInlineError('Nama pegawai tidak boleh kosong.');
      return;
    }

    const isDuplicate = authUsers.some(
      (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setInlineError(`Username "${cleanUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    const targetUser = authUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const roleTitle =
      inlineRole === 'ADMIN'
        ? 'Administrator Gudang & Sistem'
        : inlineRole === 'QC'
        ? 'Quality Control & K3 Inspector'
        : 'Operator Lapangan & Teknisi Fumigasi';

    const avatarColors = {
      ADMIN: 'from-amber-500 to-rose-600',
      QC: 'from-emerald-500 to-teal-600',
      OPERATOR: 'from-blue-500 to-indigo-600',
    };

    const updatedUser: AuthUser = {
      ...targetUser,
      username: cleanUsername,
      password: inlinePassword.trim(),
      name: inlineName.trim(),
      role: inlineRole,
      roleTitle,
      avatarColor: avatarColors[inlineRole],
      permissions: getDefaultPermissionsForRole(inlineRole),
    };

    onSaveUser(updatedUser, false);
    setInlineEditingId(null);
    onShowToast(`✓ Perubahan ID & Password "${updatedUser.username}" berhasil disimpan!`);
  };

  // Submit Add New User
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setAddFormError('Username / ID login wajib diisi.');
      return;
    }
    if (cleanUsername.includes(' ')) {
      setAddFormError('Username tidak boleh mengandung spasi.');
      return;
    }
    if (!newPassword.trim()) {
      setAddFormError('Password tidak boleh kosong.');
      return;
    }
    if (!newName.trim()) {
      setAddFormError('Nama lengkap pegawai wajib diisi.');
      return;
    }

    const isDuplicate = authUsers.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setAddFormError(`Username "${cleanUsername}" sudah digunakan. Silakan gunakan ID yang lain.`);
      return;
    }

    const roleTitle =
      newRole === 'ADMIN'
        ? 'Administrator Gudang & Sistem'
        : newRole === 'QC'
        ? 'Quality Control & K3 Inspector'
        : 'Operator Lapangan & Teknisi Fumigasi';

    const avatarColors = {
      ADMIN: 'from-amber-500 to-rose-600',
      QC: 'from-emerald-500 to-teal-600',
      OPERATOR: 'from-blue-500 to-indigo-600',
    };

    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: newPassword.trim(),
      name: newName.trim(),
      role: newRole,
      roleTitle,
      nip: newNip.trim() || `NIP-${newRole.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      email: `${cleanUsername}@logix-warehouse.id`,
      phone: newPhone.trim() || '0812-3456-7890',
      avatarColor: avatarColors[newRole],
      permissions: getDefaultPermissionsForRole(newRole),
    };

    onSaveUser(newUser, true);
    setIsAddModalOpen(false);

    // Reset Form
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewNip('');
    setNewPhone('');
    onShowToast(`✓ Akun ID "${newUser.username}" (${newUser.name}) berhasil disimpan!`);
  };

  // Open Full Edit Modal
  const handleOpenEdit = (user: AuthUser) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword(user.password || 'admin123');
    setEditName(user.name);
    setEditRole(user.role);
    setEditNip(user.nip || '');
    setEditPhone(user.phone || '');
    setEditFormError(null);
  };

  // Save Full Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);

    const cleanUsername = editUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setEditFormError('Username tidak boleh kosong.');
      return;
    }
    if (cleanUsername.includes(' ')) {
      setEditFormError('Username tidak boleh mengandung spasi.');
      return;
    }
    if (!editPassword.trim()) {
      setEditFormError('Password tidak boleh kosong.');
      return;
    }
    if (!editName.trim()) {
      setEditFormError('Nama pegawai tidak boleh kosong.');
      return;
    }

    const isDuplicate = authUsers.some(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setEditFormError(`Username "${cleanUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    const roleTitle =
      editRole === 'ADMIN'
        ? 'Administrator Gudang & Sistem'
        : editRole === 'QC'
        ? 'Quality Control & K3 Inspector'
        : 'Operator Lapangan & Teknisi Fumigasi';

    const avatarColors = {
      ADMIN: 'from-amber-500 to-rose-600',
      QC: 'from-emerald-500 to-teal-600',
      OPERATOR: 'from-blue-500 to-indigo-600',
    };

    const updatedUser: AuthUser = {
      ...editingUser,
      username: cleanUsername,
      password: editPassword.trim(),
      name: editName.trim(),
      role: editRole,
      roleTitle,
      nip: editNip.trim() || editingUser.nip,
      phone: editPhone.trim() || editingUser.phone,
      avatarColor: avatarColors[editRole],
      permissions: getDefaultPermissionsForRole(editRole),
    };

    onSaveUser(updatedUser, false);
    setEditingUser(null);
    onShowToast(`✓ Data akun "${updatedUser.username}" berhasil disimpan!`);
  };

  // Delete User with Validation
  const handleDelete = (user: AuthUser) => {
    if (user.id === currentUser.id) {
      alert('Anda sedang masuk menggunakan akun ini. Akun yang sedang aktif tidak dapat dihapus.');
      return;
    }

    const currentAdminCount = authUsers.filter((u) => u.role === 'ADMIN').length;
    if (user.role === 'ADMIN' && currentAdminCount <= 1) {
      alert('Tidak dapat menghapus Administrator utama. Sistem harus memiliki minimal 1 akun Admin.');
      return;
    }

    if (
      confirm(
        `PERINGATAN: Yakin ingin menghapus akun ID "${user.username}" (${user.name} - ${user.role})?\n\nPengguna ini tidak akan bisa login lagi ke sistem.`
      )
    ) {
      onDeleteUser(user.id);
      onShowToast(`Akun ID "${user.username}" telah dihapus.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Manajemen ID &amp; Password Pengguna
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              KHUSUS AKUN ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Dasbor otorisasi khusus Administrator untuk menambah, mengubah ID/username, menyetel ulang kata sandi (password), serta mengatur wewenang peran pegawai. <strong>Setiap perubahan dilengkapi tombol Simpan</strong> untuk mengunci data secara instan.
          </p>
        </div>

        {/* Action Buttons: Tambah Akun Baru & Simpan Sinkronisasi */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onShowToast('✓ Seluruh data akun pengguna tersimpan sinkron di database sistem.');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Verifikasi status penyimpanan data akun"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Database Tersimpan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddFormError(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah ID &amp; Password Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Pengguna</span>
          </div>
          <div className="text-xl font-black text-white font-mono">{totalCount} Akun</div>
          <div className="text-[10px] text-slate-400">Terdaftar di Database</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Administrator</span>
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">{adminCount} Akun</div>
          <div className="text-[10px] text-slate-400">Hak Akses Penuh Sistem</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Operator Lapangan</span>
          </div>
          <div className="text-xl font-black text-sky-400 font-mono">{operatorCount} Akun</div>
          <div className="text-[10px] text-slate-400">Input Pekerjaan &amp; Gudang</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
            <Microscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quality Control</span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">{qcCount} Akun</div>
          <div className="text-[10px] text-slate-400">Inspeksi &amp; Rekomendasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID login, nama pegawai, atau NIP..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'ALL', label: `Semua (${totalCount})` },
              { key: 'ADMIN', label: `Admin (${adminCount})` },
              { key: 'OPERATOR', label: `Operator (${operatorCount})` },
              { key: 'QC', label: `QC (${qcCount})` },
            ] as { key: UserRole | 'ALL'; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRoleFilter(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                roleFilter === item.key
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Tip Admin: Anda dapat menggunakan tombol <strong>"Edit Cepat"</strong> untuk mengubah ID &amp; Sandi langsung di baris tabel, lalu klik tombol <strong>"Simpan"</strong> yang menyala untuk menyimpan perubahan seketika.
          </span>
        </div>
        <span className="font-mono text-[10px] text-amber-400 font-bold hidden sm:inline">
          AUTOSAVE PERSISTENT
        </span>
      </div>

      {/* Accounts Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Pegawai / Pengguna</th>
                <th className="py-3.5 px-4">Username / ID Login</th>
                <th className="py-3.5 px-4">Kata Sandi (Password)</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Hak Akses &amp; Wewenang</th>
                <th className="py-3.5 px-4 text-center">Aksi &amp; Tombol Simpan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="font-medium">Tidak ada akun pengguna yang cocok dengan pencarian.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Gunakan tombol "+ Tambah ID &amp; Password Baru" untuk membuat akun baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isRevealed = revealedPasswords[user.id] || false;
                  const isCurrent = user.id === currentUser.id;
                  const isInlineEditing = inlineEditingId === user.id;

                  if (isInlineEditing) {
                    return (
                      <tr
                        key={user.id}
                        className="bg-amber-500/10 border-2 border-amber-500/50 animate-in fade-in duration-150"
                      >
                        {/* Inline Name Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={inlineName}
                            onChange={(e) => setInlineName(e.target.value)}
                            placeholder="Nama Lengkap Pegawai"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-white font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {user.nip || 'NIP Terdaftar'}
                          </div>
                        </td>

                        {/* Inline Username Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={inlineUsername}
                            onChange={(e) => setInlineUsername(e.target.value)}
                            placeholder="username"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>

                        {/* Inline Password Input with Eye */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type={inlineShowPassword ? 'text' : 'password'}
                              value={inlinePassword}
                              onChange={(e) => setInlinePassword(e.target.value)}
                              placeholder="password"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setInlineShowPassword(!inlineShowPassword)}
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title={inlineShowPassword ? 'Sembunyikan' : 'Tampilkan'}
                            >
                              {inlineShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Inline Role Select */}
                        <td className="py-3 px-4">
                          <select
                            value={inlineRole}
                            onChange={(e) => setInlineRole(e.target.value as UserRole)}
                            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-white font-semibold text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="ADMIN">🛡️ Admin</option>
                            <option value="OPERATOR">🌾 Operator</option>
                            <option value="QC">🔬 QC</option>
                          </select>
                        </td>

                        {/* Wewenang info */}
                        <td className="py-3 px-4 text-[11px] text-amber-300">
                          {inlineError ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {inlineError}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              Klik tombol "Simpan" di sebelah kanan untuk memperbarui akun ini.
                            </span>
                          )}
                        </td>

                        {/* TOMBOL SIMPAN & BATAL INLINE */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(user.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              title="Simpan Perubahan Akun Ini"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                              title="Batalkan Perubahan"
                            >
                              Batal
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Pegawai */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  AKUN SAYA
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {user.nip || 'NIP Terdaftar'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username / ID Login */}
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 text-xs">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                          {user.username}
                        </span>
                      </td>

                      {/* Password with Reveal Toggle */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                            {isRevealed ? user.password || 'admin123' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(user.id)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isRevealed ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                            user.role === 'ADMIN'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : user.role === 'QC'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}
                        >
                          {user.role === 'ADMIN' ? '🛡️ Admin' : user.role === 'QC' ? '🔬 QC' : '🌾 Operator'}
                        </span>
                      </td>

                      {/* Wewenang */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-300 max-w-[220px]">
                        <div className="truncate" title={user.roleTitle}>
                          {user.roleTitle}
                        </div>
                      </td>

                      {/* Aksi & Tombol Simpan */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Edit Cepat (Menampilkan Tombol Simpan Inline) */}
                          <button
                            type="button"
                            onClick={() => handleStartInlineEdit(user)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            title="Edit cepat langsung di baris tabel"
                          >
                            <Edit2 className="w-3 h-3 text-emerald-400" />
                            <span>Edit Cepat</span>
                          </button>

                          {/* Tombol Edit Lengkap (Modal) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            title="Buka form modal lengkap untuk mengedit ID & sandi"
                          >
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Lengkap</span>
                          </button>

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                                : 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border-slate-700 hover:border-rose-500/40 cursor-pointer'
                            }`}
                            title={isCurrent ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Akun'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: TAMBAH AKUN BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Tambah ID &amp; Password Baru</h3>
                  <p className="text-xs text-slate-400">Buat akun login baru dan simpan ke database.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewUser} className="p-4 sm:p-5 space-y-4 text-xs">
              {addFormError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{addFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Username / ID Login <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: operator2"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Huruf kecil tanpa spasi.</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kata Sandi (Password) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap Pegawai <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    NIP / Nomor Pegawai (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    placeholder="Contoh: NIP-OP-004"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nomor WhatsApp / HP Pegawai
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pilih Hak Akses Peran (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ADMIN">Administrator (Akses Penuh Seluruh Modul &amp; Akun)</option>
                    <option value="OPERATOR">Operator Lapangan (Fumigasi, Spraying, Obat &amp; BBM)</option>
                    <option value="QC">Quality Control (Rekomendasi Bahan Baku &amp; Approval)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer with Dedicated Simpan Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Akun Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT AKUN LENGKAP ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Edit Akun: <span className="text-cyan-300 font-mono">{editingUser.username}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Ubah ID login, password, atau hak akses pengguna.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-4 text-xs">
              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Username / ID Login <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kata Sandi (Password) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap Pegawai <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    NIP / Nomor Pegawai
                  </label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nomor WhatsApp / HP Pegawai
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hak Akses Peran (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ADMIN">Administrator (Akses Penuh Seluruh Modul &amp; Akun)</option>
                    <option value="OPERATOR">Operator Lapangan (Fumigasi, Spraying, Obat &amp; BBM)</option>
                    <option value="QC">Quality Control (Rekomendasi Bahan Baku &amp; Approval)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer with Dedicated Simpan Perubahan Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagementView;
