import { AuthUser, UserRole, UserPermissions } from '../types/auth';

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'ADMIN':
      return {
        canManageInventory: true,
        canDeleteItems: true,
        canCreateTransactions: true,
        canAuditStockOpname: true,
        canApplyStockOpname: true,
        canManageMasterData: true,
        canManageSettings: true,
        canPrintLabels: true,
        canPrintSuratJalan: true,
        canVerifyQC: true,
        canDeleteTransactions: true,
        canInputJobReports: true,
        canEvaluateQCJobs: true,
        canCrossCheckAll: true,
      };
    case 'OPERATOR':
      return {
        canManageInventory: false,
        canDeleteItems: false,
        canCreateTransactions: true, // Khusus pengeluaran obat & BBM
        canAuditStockOpname: false,
        canApplyStockOpname: false,
        canManageMasterData: false,
        canManageSettings: false,
        canPrintLabels: false,
        canPrintSuratJalan: true,
        canVerifyQC: false,
        canDeleteTransactions: false,
        canInputJobReports: true, // Input pekerjaan spraying fogging dan fumigasi
        canEvaluateQCJobs: false,
        canCrossCheckAll: false,
      };
    case 'QC':
      return {
        canManageInventory: false,
        canDeleteItems: false,
        canCreateTransactions: false,
        canAuditStockOpname: false,
        canApplyStockOpname: false,
        canManageMasterData: false,
        canManageSettings: false,
        canPrintLabels: false,
        canPrintSuratJalan: false,
        canVerifyQC: true,
        canDeleteTransactions: false,
        canInputJobReports: false,
        canEvaluateQCJobs: true, // Berikan rekomendasi (OK/Belum OK/Fumigasi Ulang) & Approve
        canCrossCheckAll: false,
      };
  }
};

export const INITIAL_AUTH_USERS: AuthUser[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    password: 'admin123',
    name: 'Bpk. Hendra Wijaya',
    role: 'ADMIN',
    roleTitle: 'Kepala Gudang & Admin Sistem',
    nip: 'NIP-ADM-2018-001',
    email: 'hendra.wijaya@logix-warehouse.id',
    phone: '0812-8888-0001',
    avatarColor: 'from-amber-500 to-rose-600',
    permissions: getDefaultPermissionsForRole('ADMIN'),
  },
  {
    id: 'user-operator-02',
    username: 'operator',
    password: 'operator123',
    name: 'Budi Santoso',
    role: 'OPERATOR',
    roleTitle: 'Operator Lapangan & Teknisi Fumigasi',
    nip: 'NIP-OPR-2022-014',
    email: 'budi.santoso@logix-warehouse.id',
    phone: '0813-9876-1234',
    avatarColor: 'from-blue-500 to-indigo-600',
    permissions: getDefaultPermissionsForRole('OPERATOR'),
  },
  {
    id: 'user-qc-03',
    username: 'qc',
    password: 'qc123',
    name: 'Ratna Dewi, S.Si',
    role: 'QC',
    roleTitle: 'Quality Control & K3 Inspector',
    nip: 'NIP-QC-2021-008',
    email: 'ratna.dewi.qc@logix-warehouse.id',
    phone: '0811-7788-9900',
    avatarColor: 'from-emerald-500 to-teal-600',
    permissions: getDefaultPermissionsForRole('QC'),
  },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  operator: 'operator123',
  qc: 'qc123',
};

export const STORAGE_KEY_AUTH_USERS = 'logix_warehouse_users_list_v2';

export const loadStoredAuthUsers = (): AuthUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default users exist if deleted by accident or missing
        return parsed.map((u: any) => ({
          ...u,
          password: u.password || DEMO_PASSWORDS[u.username] || '123456',
          permissions: u.permissions || getDefaultPermissionsForRole(u.role || 'OPERATOR'),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load stored auth users:', e);
  }
  return INITIAL_AUTH_USERS;
};

export const saveStoredAuthUsers = (users: AuthUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save auth users:', e);
  }
};
