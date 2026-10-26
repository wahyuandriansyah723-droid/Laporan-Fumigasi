import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  StockTransaction,
  Category,
  TransactionType,
  MasterSupplier,
  MasterLocation,
  MasterOperator,
  MasterProjectDestination,
  MasterUnit,
  MasterChemicalMedicine,
  MasterFuelType,
  MasterEquipmentInventory,
  SystemSettings,
  BatchItem,
} from './types/inventory';
import { AuthUser } from './types/auth';
import { INITIAL_AUTH_USERS } from './data/initialAuthUsers';
import { LoginScreen } from './components/LoginScreen';
import { LoginDashboard } from './components/LoginDashboard';
import { UserProfileMenu } from './components/UserProfileMenu';
import { QCInspectionModal } from './components/QCInspectionModal';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS } from './data/initialData';
import {
  INITIAL_SUPPLIERS,
  INITIAL_LOCATIONS,
  INITIAL_OPERATORS,
  INITIAL_PROJECT_DESTINATIONS,
  INITIAL_UNITS,
  INITIAL_CHEMICAL_MEDICINES,
  INITIAL_FUEL_TYPES,
  INITIAL_EQUIPMENT_INVENTORY,
  INITIAL_SYSTEM_SETTINGS,
} from './data/initialMasterData';
import { DashboardOverview } from './components/DashboardOverview';
import { InventoryTableView } from './components/InventoryTableView';
import { MutationsHistoryView } from './components/MutationsHistoryView';
import { OutflowReportsView } from './components/OutflowReportsView';
import { StockOpnameView } from './components/StockOpnameView';
import { MasterDataView } from './components/MasterDataView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { TransactionModal } from './components/TransactionModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddItemModal } from './components/AddItemModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodeLabelModal } from './components/BarcodeLabelModal';
import { SuratJalanPrintModal } from './components/SuratJalanPrintModal';
import { MSDSSafetyModal } from './components/MSDSSafetyModal';
import { QCJobReportsView } from './components/QCJobReportsView';
import { OperatorJobInputModal } from './components/OperatorJobInputModal';
import { AdminCrossCheckView } from './components/AdminCrossCheckView';
import { RawMaterialRecommendationsView } from './components/RawMaterialRecommendationsView';
import { RawMaterialRecommendationModal } from './components/RawMaterialRecommendationModal';
import { FumigationJobReport } from './types/jobs';
import { RawMaterialRecommendation } from './types/recommendations';
import { INITIAL_JOB_REPORTS } from './data/initialJobReports';
import { INITIAL_RAW_RECOMMENDATIONS } from './data/initialRecommendations';
import { exportInventoryToCSV, exportMutationsToCSV } from './utils/exportImport';
import {
  Boxes,
  Fuel,
  Scan,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Clock,
  Warehouse,
  FolderTree,
  Settings,
  Receipt,
  AlertTriangle,
  BellRing,
  Microscope,
  LogOut,
  Menu,
  X,
  FileCheck2,
  ShieldCheck,
  Flame,
  Bug,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { isBelowMinimumThreshold, isCriticallyBelowThreshold } from './utils/stockUtils';

const STORAGE_KEY_AUTH_USER = 'logix_warehouse_auth_user_v1';
const STORAGE_KEY_ITEMS = 'logix_warehouse_items_v1';
const STORAGE_KEY_TRX = 'logix_warehouse_transactions_v1';
const STORAGE_KEY_SUPPLIERS = 'logix_warehouse_suppliers_v1';
const STORAGE_KEY_LOCATIONS = 'logix_warehouse_locations_v1';
const STORAGE_KEY_OPERATORS = 'logix_warehouse_operators_v1';
const STORAGE_KEY_DESTINATIONS = 'logix_warehouse_destinations_v1';
const STORAGE_KEY_UNITS = 'logix_warehouse_units_v1';
const STORAGE_KEY_MEDICINES = 'logix_warehouse_medicines_v1';
const STORAGE_KEY_FUELS = 'logix_warehouse_fuels_v1';
const STORAGE_KEY_EQUIPMENT = 'logix_warehouse_equipment_v1';
const STORAGE_KEY_SETTINGS = 'logix_warehouse_settings_v1';
const STORAGE_KEY_JOB_REPORTS = 'logix_warehouse_job_reports_v1';
const STORAGE_KEY_RAW_RECOMMENDATIONS = 'logix_warehouse_raw_recommendations_v1';

export default function App() {
  // Authentication State (ADMIN, OPERATOR, QC)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          // Sync canonical role permissions
          const canonical = INITIAL_AUTH_USERS.find((u) => u.id === parsed.id || u.role === parsed.role);
          if (canonical) {
            return {
              ...canonical,
              ...parsed,
              permissions: canonical.permissions,
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load auth user:', e);
    }
    return null;
  });

  const [isQCModalOpen, setIsQCModalOpen] = useState(false);

  // Persistent state for items
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load items from storage:', e);
    }
    return INITIAL_ITEMS;
  });

  // Persistent state for transactions
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRX);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load transactions from storage:', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Persistent state for Master Data & Settings
  const [suppliers, setSuppliers] = useState<MasterSupplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    }
    return INITIAL_SUPPLIERS;
  });

  const [locations, setLocations] = useState<MasterLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load locations:', e);
    }
    return INITIAL_LOCATIONS;
  });

  const [operators, setOperators] = useState<MasterOperator[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OPERATORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load operators:', e);
    }
    return INITIAL_OPERATORS;
  });

  const [destinations, setDestinations] = useState<MasterProjectDestination[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DESTINATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load destinations:', e);
    }
    return INITIAL_PROJECT_DESTINATIONS;
  });

  const [units, setUnits] = useState<MasterUnit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load units:', e);
    }
    return INITIAL_UNITS;
  });

  const [medicines, setMedicines] = useState<MasterChemicalMedicine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEDICINES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load medicines:', e);
    }
    return INITIAL_CHEMICAL_MEDICINES;
  });

  const [fuels, setFuels] = useState<MasterFuelType[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FUELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load fuels:', e);
    }
    return INITIAL_FUEL_TYPES;
  });

  const [equipment, setEquipment] = useState<MasterEquipmentInventory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load equipment:', e);
    }
    return INITIAL_EQUIPMENT_INVENTORY;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.companyName) return parsed;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return INITIAL_SYSTEM_SETTINGS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
    } catch (e) {
      console.error('Failed to save suppliers:', e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
    } catch (e) {
      console.error('Failed to save locations:', e);
    }
  }, [locations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OPERATORS, JSON.stringify(operators));
    } catch (e) {
      console.error('Failed to save operators:', e);
    }
  }, [operators]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DESTINATIONS, JSON.stringify(destinations));
    } catch (e) {
      console.error('Failed to save destinations:', e);
    }
  }, [destinations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
    } catch (e) {
      console.error('Failed to save units:', e);
    }
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDICINES, JSON.stringify(medicines));
    } catch (e) {
      console.error('Failed to save medicines:', e);
    }
  }, [medicines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FUELS, JSON.stringify(fuels));
    } catch (e) {
      console.error('Failed to save fuels:', e);
    }
  }, [fuels]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(equipment));
    } catch (e) {
      console.error('Failed to save equipment:', e);
    }
  }, [equipment]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      }
    } catch (e) {
      console.error('Failed to save auth user:', e);
    }
  }, [currentUser]);

  // Current view tabs:
  type AppTab =
    | 'dashboard'
    | 'inventory'
    | 'qc_reports'
    | 'raw_material_recommendations'
    | 'crosscheck'
    | 'mutations'
    | 'outflows'
    | 'opname'
    | 'master'
    | 'settings'
    | 'login_dashboard';

  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    return currentUser?.role === 'QC' ? 'qc_reports' : 'dashboard';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'ALL'>('ALL');

  // Guard for QC: Cannot access dashboard or login_dashboard
  useEffect(() => {
    if (currentUser?.role === 'QC') {
      if (currentTab === 'dashboard' || currentTab === 'login_dashboard') {
        setCurrentTab('qc_reports');
      }
    }
  }, [currentUser, currentTab]);

  // Persistent state for Fumigation & Spraying Job Reports
  const [jobReports, setJobReports] = useState<FumigationJobReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_JOB_REPORTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load job reports:', e);
    }
    return INITIAL_JOB_REPORTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_JOB_REPORTS, JSON.stringify(jobReports));
    } catch (e) {
      console.error('Failed to save job reports:', e);
    }
  }, [jobReports]);

  // Persistent state for Raw Material Recommendations (QC -> Operator & Admin)
  const [rawRecommendations, setRawRecommendations] = useState<RawMaterialRecommendation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RAW_RECOMMENDATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load raw recommendations:', e);
    }
    return INITIAL_RAW_RECOMMENDATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RAW_RECOMMENDATIONS, JSON.stringify(rawRecommendations));
    } catch (e) {
      console.error('Failed to save raw recommendations:', e);
    }
  }, [rawRecommendations]);

  const [isRawRecModalOpen, setIsRawRecModalOpen] = useState(false);
  const [rawRecToEdit, setRawRecToEdit] = useState<RawMaterialRecommendation | null>(null);
  const [recToExecuteAsSPK, setRecToExecuteAsSPK] = useState<RawMaterialRecommendation | null>(null);

  const [isOperatorJobModalOpen, setIsOperatorJobModalOpen] = useState(false);

  // Proactive threshold calculation for visual notification & badges
  const belowThresholdCount = React.useMemo(
    () => items.filter(isBelowMinimumThreshold).length,
    [items]
  );
  const criticalCount = React.useMemo(
    () => items.filter(isCriticallyBelowThreshold).length,
    [items]
  );

  // Modals state
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [trxDefaultItem, setTrxDefaultItem] = useState<InventoryItem | null>(null);
  const [trxDefaultType, setTrxDefaultType] = useState<TransactionType>('OUT');
  const [trxDefaultQuantity, setTrxDefaultQuantity] = useState<number | undefined>(undefined);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailItem, setActiveDetailItem] = useState<InventoryItem | null>(null);

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [labelItem, setLabelItem] = useState<InventoryItem | null>(null);

  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);
  const [activeSuratJalanTrx, setActiveSuratJalanTrx] = useState<StockTransaction | null>(null);

  const [isMSDSOpen, setIsMSDSOpen] = useState(false);

  // Live real-time clock indicator (Indonesian Time)
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handler: Commit Transaction
  const handleSaveTransaction = (trxData: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTrx: StockTransaction = {
      ...trxData,
      operator: trxData.operator || (currentUser ? currentUser.name : 'Petugas Gudang'),
      id: `trx-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Update item stock
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === trxData.itemId) {
          return {
            ...item,
            currentStock: trxData.newStock,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      })
    );

    // Append to transactions
    setTransactions((prev) => [newTrx, ...prev]);

    showToast(
      `Berhasil mencatat mutasi: [${trxData.type}] ${trxData.itemName} (${trxData.quantity} ${trxData.unit})`
    );

    // Auto open Surat Jalan preview if it is OUT
    if (trxData.type === 'OUT') {
      setActiveSuratJalanTrx(newTrx);
      setIsSuratJalanOpen(true);
    }
  };

  // Handler: Update Existing Transaction (Edit Mutasi)
  const handleUpdateTransaction = (updatedTrx: StockTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTrx.id ? updatedTrx : t)));
    showToast(`Mutasi ${updatedTrx.referenceNo} berhasil diperbarui & disimpan.`);
  };

  // Handler: Delete Transaction with Optional Stock Reversion
  const handleDeleteTransaction = (trxId: string, revertStock: boolean) => {
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (!targetTrx) return;

    if (revertStock) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === targetTrx.itemId) {
            let adjustedStock = item.currentStock;
            if (targetTrx.type === 'IN') {
              adjustedStock = Math.max(0, item.currentStock - targetTrx.quantity);
            } else if (targetTrx.type === 'OUT') {
              adjustedStock = item.currentStock + targetTrx.quantity;
            } else if (targetTrx.type === 'ADJUSTMENT') {
              adjustedStock = targetTrx.previousStock;
            }
            return {
              ...item,
              currentStock: adjustedStock,
              lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
            };
          }
          return item;
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== trxId));
    showToast(
      revertStock
        ? `Mutasi ${targetTrx.referenceNo} dihapus & stok barang dikembalikan.`
        : `Mutasi ${targetTrx.referenceNo} berhasil dihapus.`
    );
  };

  // Handler: Delete All Transactions (Hapus Semua Mutasi)
  const handleDeleteAllTransactions = (revertStock: boolean) => {
    const totalCount = transactions.length;
    if (totalCount === 0) return;

    if (revertStock) {
      setItems((prevItems) => {
        const itemStockMap = new Map<string, number>();
        prevItems.forEach((i) => itemStockMap.set(i.id, i.currentStock));

        // Walk transactions in reverse chronological order (newest to oldest)
        const sortedTrx = [...transactions].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        sortedTrx.forEach((trx) => {
          const cur = itemStockMap.get(trx.itemId);
          if (cur !== undefined) {
            if (trx.type === 'IN') {
              itemStockMap.set(trx.itemId, Math.max(0, cur - trx.quantity));
            } else if (trx.type === 'OUT') {
              itemStockMap.set(trx.itemId, cur + trx.quantity);
            } else if (trx.type === 'ADJUSTMENT') {
              itemStockMap.set(trx.itemId, trx.previousStock);
            }
          }
        });

        return prevItems.map((item) => {
          const reverted = itemStockMap.get(item.id);
          return reverted !== undefined
            ? {
                ...item,
                currentStock: reverted,
                lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
              }
            : item;
        });
      });
    }

    setTransactions([]);
    showToast(
      revertStock
        ? `Seluruh riwayat mutasi (${totalCount} transaksi) berhasil dihapus & stok barang dikembalikan.`
        : `Seluruh riwayat mutasi (${totalCount} transaksi) berhasil dikosongkan.`
    );
  };

  // Handler: Reload Sample Transactions
  const handleReloadSampleTransactions = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    showToast(`Data sampel riwayat mutasi (${INITIAL_TRANSACTIONS.length} transaksi) berhasil dimuat kembali.`);
  };

  // Handler: Add or Edit Item
  const handleSaveItem = (itemToSave: InventoryItem) => {
    const exists = items.some((i) => i.id === itemToSave.id);
    if (exists) {
      setItems((prev) => prev.map((i) => (i.id === itemToSave.id ? itemToSave : i)));
      showToast(`Data barang "${itemToSave.name}" berhasil diperbarui.`);
    } else {
      setItems((prev) => [itemToSave, ...prev]);
      showToast(`Barang baru "${itemToSave.name}" berhasil ditambahkan.`);
    }
    setItemToEdit(null);
  };

  // Handler: Delete Item
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    showToast('Barang berhasil dihapus dari inventaris gudang.');
  };

  // Handler: Apply Stock Opname Adjustments
  const handleApplyOpname = (
    adjustments: {
      item: InventoryItem;
      physicalStock: number;
      difference: number;
      notes: string;
    }[]
  ) => {
    const newTrxList: StockTransaction[] = [];
    const dateStr = new Date().toISOString();

    setItems((prevItems) => {
      const updated = [...prevItems];
      adjustments.forEach((adj) => {
        const idx = updated.findIndex((i) => i.id === adj.item.id);
        if (idx !== -1) {
          const prevStock = updated[idx].currentStock;
          updated[idx] = {
            ...updated[idx],
            currentStock: adj.physicalStock,
            lastUpdated: dateStr.replace('T', ' ').slice(0, 16),
          };

          newTrxList.push({
            id: `trx-so-${Date.now()}-${adj.item.id}`,
            timestamp: dateStr,
            type: 'ADJUSTMENT',
            itemId: adj.item.id,
            sku: adj.item.sku,
            itemName: adj.item.name,
            category: adj.item.category,
            quantity: Math.abs(adj.difference),
            unit: adj.item.unit,
            previousStock: prevStock,
            newStock: adj.physicalStock,
            referenceNo: `SO-AUDIT-${new Date().toISOString().slice(0, 10)}`,
            projectOrLocation: 'Penyesuaian Fisik Stock Opname',
            operator: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tim Auditor Gudang',
            notes: adj.notes,
          });
        }
      });
      return updated;
    });

    setTransactions((prev) => [...newTrxList, ...prev]);
    showToast(`Stock Opname selesai! ${adjustments.length} item berhasil diselaraskan.`);
    setCurrentTab('inventory');
  };

  // Auth & QC Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'QC') {
      setCurrentTab('qc_reports');
    } else {
      setCurrentTab('dashboard');
    }
    showToast(`Selamat datang, ${user.name} (${user.roleTitle})!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Anda telah keluar dari sesi (Logout).');
  };

  const handleSwitchUser = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'QC') {
      setCurrentTab('qc_reports');
    }
    showToast(`Beralih akun ke: ${user.name} (${user.roleTitle})`);
  };

  const handleUpdateItemBatches = (itemId: string, updatedBatches: BatchItem[]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, batches: updatedBatches } : item))
    );
  };

  // Job Report Handlers: Operator & Admin can save job, QC can evaluate & approve
  const handleSaveJobAndDeductStock = (
    report: FumigationJobReport,
    medicineDeduction: { itemId: string; qty: number; batchNo?: string },
    fuelDeduction?: { itemId: string; qty: number; batchNo?: string },
    linkedRecommendationId?: string
  ) => {
    setJobReports((prev) => [report, ...prev]);

    // If linked to a raw material recommendation, update recommendation status to DIPROSES
    if (linkedRecommendationId) {
      setRawRecommendations((prev) =>
        prev.map((r) =>
          r.id === linkedRecommendationId
            ? {
                ...r,
                status: 'DIPROSES' as const,
                linkedSpkNo: report.jobNo,
                linkedJobReportId: report.id,
                processedByOperator: report.operatorName,
                processedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setRecToExecuteAsSPK(null);
    }

    const newTrxs: StockTransaction[] = [];
    const nowIso = new Date().toISOString();

    const medItem = items.find((i) => i.id === medicineDeduction.itemId);
    if (medItem) {
      const prevStock = medItem.currentStock;
      const newStock = Math.max(0, prevStock - medicineDeduction.qty);

      newTrxs.push({
        id: `trx-job-med-${Date.now()}`,
        timestamp: nowIso,
        type: 'OUT',
        itemId: medItem.id,
        sku: medItem.sku,
        itemName: medItem.name,
        category: medItem.category,
        quantity: medicineDeduction.qty,
        unit: medItem.unit,
        previousStock: prevStock,
        newStock: newStock,
        referenceNo: report.jobNo,
        projectOrLocation: `${report.title} (${report.clientName})`,
        operator: report.operatorName,
        batchNo: medicineDeduction.batchNo,
        notes: `Pengeluaran obat kimia pekerjaan ${report.jobType} untuk SPK ${report.jobNo}`,
      });
    }

    if (fuelDeduction) {
      const fuelItem = items.find((i) => i.id === fuelDeduction.itemId);
      if (fuelItem) {
        const prevStock = fuelItem.currentStock;
        const newStock = Math.max(0, prevStock - fuelDeduction.qty);

        newTrxs.push({
          id: `trx-job-fuel-${Date.now()}`,
          timestamp: nowIso,
          type: 'OUT',
          itemId: fuelItem.id,
          sku: fuelItem.sku,
          itemName: fuelItem.name,
          category: fuelItem.category,
          quantity: fuelDeduction.qty,
          unit: fuelItem.unit,
          previousStock: prevStock,
          newStock: newStock,
          referenceNo: report.jobNo,
          projectOrLocation: `${report.title} (${report.clientName})`,
          operator: report.operatorName,
          batchNo: fuelDeduction.batchNo,
          notes: `Pengeluaran BBM operasional untuk SPK ${report.jobNo}`,
        });
      }
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === medicineDeduction.itemId) {
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - medicineDeduction.qty),
            lastUpdated: nowIso.replace('T', ' ').slice(0, 16),
          };
        }
        if (fuelDeduction && item.id === fuelDeduction.itemId) {
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - fuelDeduction.qty),
            lastUpdated: nowIso.replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      })
    );

    setTransactions((prev) => [...newTrxs, ...prev]);
    showToast(`SPK ${report.jobNo} berhasil disimpan & stok bahan telah dikeluarkan dari gudang.`);
  };

  const handleUpdateJobReport = (updated: FumigationJobReport) => {
    setJobReports((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const handleDeleteJobReport = (id: string) => {
    setJobReports((prev) => prev.filter((j) => j.id !== id));
    showToast('Laporan pekerjaan berhasil dihapus.');
  };

  // Raw Material Recommendations Handlers (QC -> Operator & Admin)
  const handleSaveRawRecommendation = (rec: RawMaterialRecommendation) => {
    const exists = rawRecommendations.some((r) => r.id === rec.id);
    if (exists) {
      setRawRecommendations((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
      showToast(`Rekomendasi bahan baku ${rec.recommendationNo} berhasil diperbarui.`);
    } else {
      setRawRecommendations((prev) => [rec, ...prev]);
      showToast(`Rekomendasi ${rec.recommendationNo} (${rec.commodityName}) terkirim ke Operator & Admin!`);
    }
    setRawRecToEdit(null);
  };

  const handleDeleteRawRecommendation = (id: string) => {
    setRawRecommendations((prev) => prev.filter((r) => r.id !== id));
    showToast('Rekomendasi bahan baku berhasil dihapus.');
  };

  const handleExecuteRecAsSPK = (rec: RawMaterialRecommendation) => {
    setRecToExecuteAsSPK(rec);
    setIsOperatorJobModalOpen(true);
  };

  // Reset to initial demo dataset
  const handleResetData = () => {
    if (confirm('Kembalikan semua data inventaris, mutasi, dan laporan pekerjaan ke sampel awal bawaan?')) {
      setItems(INITIAL_ITEMS);
      setTransactions(INITIAL_TRANSACTIONS);
      setJobReports(INITIAL_JOB_REPORTS);
      showToast('Database inventaris & SPK berhasil direset ke data sampel.');
    }
  };

  // ================= MASTER DATA HANDLERS =================
  const handleSaveSupplier = (sup: MasterSupplier) => {
    setSuppliers((prev) => {
      const exists = prev.some((s) => s.id === sup.id);
      return exists ? prev.map((s) => (s.id === sup.id ? sup : s)) : [sup, ...prev];
    });
    showToast(`Data pemasok "${sup.name}" berhasil disimpan.`);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast('Data pemasok berhasil dihapus.');
  };

  const handleSaveLocation = (loc: MasterLocation) => {
    setLocations((prev) => {
      const exists = prev.some((l) => l.id === loc.id);
      return exists ? prev.map((l) => (l.id === loc.id ? loc : l)) : [loc, ...prev];
    });
    showToast(`Lokasi "${loc.name}" berhasil disimpan.`);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    showToast('Data lokasi berhasil dihapus.');
  };

  const handleSaveOperator = (op: MasterOperator) => {
    setOperators((prev) => {
      const exists = prev.some((o) => o.id === op.id);
      return exists ? prev.map((o) => (o.id === op.id ? op : o)) : [op, ...prev];
    });
    showToast(`Petugas "${op.name}" berhasil disimpan.`);
  };

  const handleDeleteOperator = (id: string) => {
    setOperators((prev) => prev.filter((o) => o.id !== id));
    showToast('Data petugas berhasil dihapus.');
  };

  const handleSaveDestination = (dest: MasterProjectDestination) => {
    setDestinations((prev) => {
      const exists = prev.some((d) => d.id === dest.id);
      return exists ? prev.map((d) => (d.id === dest.id ? dest : d)) : [dest, ...prev];
    });
    showToast(`Tujuan proyek "${dest.name}" berhasil disimpan.`);
  };

  const handleDeleteDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    showToast('Tujuan proyek berhasil dihapus.');
  };

  const handleSaveUnit = (unit: MasterUnit) => {
    setUnits((prev) => {
      const exists = prev.some((u) => u.id === unit.id);
      return exists ? prev.map((u) => (u.id === unit.id ? unit : u)) : [unit, ...prev];
    });
    showToast(`Satuan ukuran "${unit.name}" berhasil disimpan.`);
  };

  const handleDeleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    showToast('Satuan ukuran berhasil dihapus.');
  };

  // ================= MASTER: OBAT, BBM, INVENTARIS HANDLERS =================
  const handleSaveMedicine = (med: MasterChemicalMedicine) => {
    setMedicines((prev) => {
      const exists = prev.some((m) => m.id === med.id);
      return exists ? prev.map((m) => (m.id === med.id ? med : m)) : [med, ...prev];
    });
    showToast(`Master Obat "${med.name}" berhasil disimpan.`);
  };

  const handleDeleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    showToast('Data master obat berhasil dihapus.');
  };

  const handleSaveFuel = (fuel: MasterFuelType) => {
    setFuels((prev) => {
      const exists = prev.some((f) => f.id === fuel.id);
      return exists ? prev.map((f) => (f.id === fuel.id ? fuel : f)) : [fuel, ...prev];
    });
    showToast(`Master BBM "${fuel.name}" berhasil disimpan.`);
  };

  const handleDeleteFuel = (id: string) => {
    setFuels((prev) => prev.filter((f) => f.id !== id));
    showToast('Data master BBM berhasil dihapus.');
  };

  const handleSaveEquipment = (eqp: MasterEquipmentInventory) => {
    setEquipment((prev) => {
      const exists = prev.some((e) => e.id === eqp.id);
      return exists ? prev.map((e) => (e.id === eqp.id ? eqp : e)) : [eqp, ...prev];
    });
    showToast(`Master Inventaris "${eqp.name}" berhasil disimpan.`);
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    showToast('Data master inventaris berhasil dihapus.');
  };

  const handleCreateInventoryFromMaster = (prefill: Partial<InventoryItem>) => {
    setItemToEdit({
      id: `item-${Date.now()}`,
      sku: prefill.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: prefill.name || '',
      category: prefill.category || 'FUMIGASI',
      subCategory: prefill.subCategory || 'Fumigan Tablet (PH3)',
      currentStock: 0,
      unit: prefill.unit || 'Unit',
      minimumStockThreshold: prefill.minimumStockThreshold || 20,
      location: prefill.location || 'Gudang Utama',
      pricePerUnit: prefill.pricePerUnit || 0,
      isFuel: prefill.isFuel,
      density: prefill.density,
      tankCapacity: prefill.tankCapacity,
      activeIngredients: prefill.activeIngredients,
      hazardClass: prefill.hazardClass || 'CAUTION',
      targetPest: prefill.targetPest,
      dosageRecommendation: prefill.dosageRecommendation,
      description: prefill.description,
      batches: [],
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
    setIsAddItemModalOpen(true);
    showToast(`Form item baru diisi dari Master Data: ${prefill.name}`);
  };

  // ================= SYSTEM SETTINGS & BACKUP HANDLERS =================
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    showToast('Pengaturan sistem dan format dokumen berhasil disimpan.');
  };

  const handleExportFullBackup = () => {
    const fullBackup = {
      version: '2.4',
      system: 'LOGIX Warehouse WMS',
      exportedAt: new Date().toISOString(),
      systemSettings: settings,
      items,
      transactions,
      masterData: {
        medicines,
        fuels,
        equipment,
        suppliers,
        locations,
        operators,
        destinations,
        units,
      },
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LOGIX-GUDANG-BACKUP-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database gudang lengkap berhasil diekspor ke file JSON.');
  };

  const handleImportBackup = (data: any) => {
    if (!data) return;
    if (Array.isArray(data.items)) setItems(data.items);
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (data.systemSettings) setSettings(data.systemSettings);
    if (data.masterData) {
      if (Array.isArray(data.masterData.medicines)) setMedicines(data.masterData.medicines);
      if (Array.isArray(data.masterData.fuels)) setFuels(data.masterData.fuels);
      if (Array.isArray(data.masterData.equipment)) setEquipment(data.masterData.equipment);
      if (Array.isArray(data.masterData.suppliers)) setSuppliers(data.masterData.suppliers);
      if (Array.isArray(data.masterData.locations)) setLocations(data.masterData.locations);
      if (Array.isArray(data.masterData.operators)) setOperators(data.masterData.operators);
      if (Array.isArray(data.masterData.destinations)) setDestinations(data.masterData.destinations);
      if (Array.isArray(data.masterData.units)) setUnits(data.masterData.units);
    }
    showToast('Database gudang dan master data berhasil dipulihkan dari cadangan.');
  };

  const handleResetFactoryData = () => {
    if (
      confirm(
        'PERINGATAN: Seluruh database (stok barang, riwayat transaksi, master data, dan pengaturan sistem) akan dikembalikan ke standar awal pabrik. Lanjutkan?'
      )
    ) {
      setItems(INITIAL_ITEMS);
      setTransactions(INITIAL_TRANSACTIONS);
      setMedicines(INITIAL_CHEMICAL_MEDICINES);
      setFuels(INITIAL_FUEL_TYPES);
      setEquipment(INITIAL_EQUIPMENT_INVENTORY);
      setSuppliers(INITIAL_SUPPLIERS);
      setLocations(INITIAL_LOCATIONS);
      setOperators(INITIAL_OPERATORS);
      setDestinations(INITIAL_PROJECT_DESTINATIONS);
      setUnits(INITIAL_UNITS);
      setSettings(INITIAL_SYSTEM_SETTINGS);
      setJobReports(INITIAL_JOB_REPORTS);
      showToast('Database gudang berhasil direset ke standar pabrik.');
    }
  };

  // Return LoginDashboard if no user is authenticated
  if (!currentUser) {
    return (
      <LoginDashboard
        onLoginSuccess={handleLoginSuccess}
        currentUser={null}
        items={items}
        transactions={transactions}
        jobReports={jobReports}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand & Warehouse Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
                <Warehouse className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-white uppercase">
                    LOGIX <span className="text-amber-400">WMS</span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase">
                    BBM & FUMIGASI
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Active User Card */}
          <div className="mt-3.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/30">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{currentUser.roleTitle}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                currentUser.role === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : currentUser.role === 'QC'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Vertical Nav List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {/* Header Label per Role */}
          <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
            <span>
              {currentUser.role === 'ADMIN' && 'Navigasi Administrator'}
              {currentUser.role === 'QC' && 'Navigasi Quality Control'}
              {currentUser.role === 'OPERATOR' && 'Navigasi Operator Lapangan'}
            </span>
          </div>

          {/* OPERATOR QUICK ACTIONS IN SIDEBAR */}
          {currentUser.role === 'OPERATOR' && (
            <div className="pb-3 mb-2 border-b border-slate-800/80 space-y-1.5 px-1">
              <button
                type="button"
                onClick={() => {
                  setIsOperatorJobModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span>+ Input Pekerjaan SPK</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrxDefaultItem(null);
                  setTrxDefaultType('OUT');
                  setIsTrxModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Pengeluaran Obat &amp; BBM</span>
              </button>
            </div>
          )}

          {/* 1. Laporan Fumigasi & Spraying (QC Hub / Riwayat SPK) */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('qc_reports');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'qc_reports'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {currentUser.role === 'QC'
                  ? 'Laporan Fumigasi & Fogging'
                  : currentUser.role === 'OPERATOR'
                  ? 'Laporan Pekerjaan Saya'
                  : 'Laporan Fumigasi & Fogging'}
              </span>
            </div>
            {jobReports.filter((j) => j.qcApprovalStatus === 'PENDING').length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                  currentTab === 'qc_reports' ? 'bg-slate-950/20 text-slate-950' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
                title="Laporan menunggu verifikasi QC"
              >
                {jobReports.filter((j) => j.qcApprovalStatus === 'PENDING').length} Baru
              </span>
            )}
          </button>

          {/* 2. Kroscek & Audit Terpadu (Khusus Admin: "bisa kroscek semua") */}
          {currentUser.permissions.canCrossCheckAll && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('crosscheck');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'crosscheck'
                  ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                  : 'text-purple-300 hover:bg-purple-950/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
                <span className="truncate">Kroscek &amp; Audit Terpadu</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                  currentTab === 'crosscheck' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'
                }`}
              >
                KROSCEK
              </span>
            </button>
          )}

          {/* Rekomendasi Bahan Baku yang akan Difumigasi (QC, Operator, Admin) */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('raw_material_recommendations');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'raw_material_recommendations'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-emerald-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">
                {currentUser.role === 'QC'
                  ? 'Rekomendasi Bahan Baku'
                  : currentUser.role === 'OPERATOR'
                  ? 'Rekomendasi Bahan Baku (QC)'
                  : 'Rekomendasi Bahan Baku'}
              </span>
            </div>
            {rawRecommendations.filter((r) => r.status === 'TERKIRIM').length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                  currentTab === 'raw_material_recommendations'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
                title="Rekomendasi menunggu eksekusi"
              >
                {rawRecommendations.filter((r) => r.status === 'TERKIRIM').length} Siap
              </span>
            )}
          </button>

          {/* 3. Dashboard & Tangki BBM (Dikecualikan untuk QC sesuai permintaan pengguna) */}
          {currentUser.role !== 'QC' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('dashboard');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Fuel className="w-4 h-4 shrink-0" />
                <span>Dasbor &amp; Tangki BBM</span>
              </div>
              {belowThresholdCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                    currentTab === 'dashboard'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  {belowThresholdCount}
                </span>
              )}
            </button>
          )}

          {/* 4. Daftar Stok Inventaris (Admin edit/hapus/simpan, Operator view only) */}
          {currentUser.role !== 'QC' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('inventory');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Boxes className="w-4 h-4 shrink-0" />
                <span className="truncate">Stok Inventaris</span>
              </div>
              <div className="flex items-center gap-1">
                {belowThresholdCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      currentTab === 'inventory' ? 'bg-rose-900 text-rose-100' : 'bg-rose-500/20 text-rose-300'
                    }`}
                    title={`${belowThresholdCount} stok menipis`}
                  >
                    !{belowThresholdCount}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                    currentTab === 'inventory' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {items.length}
                </span>
              </div>
            </button>
          )}

          {/* 5. Buku Mutasi Transaksi (Admin edit/hapus/simpan, Operator view only) */}
          {currentUser.role !== 'QC' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('mutations');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'mutations'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="truncate">Mutasi Transaksi</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                  currentTab === 'mutations' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {transactions.length}
              </span>
            </button>
          )}

          {/* 6. Tabel Pengeluaran */}
          {currentUser.role !== 'QC' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('outflows');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'outflows'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="truncate">Tabel Pengeluaran</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  currentTab === 'outflows' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Periode
              </span>
            </button>
          )}

          {/* 7. Stock Opname Fisik (Khusus Admin: Terapkan Penyesuaian) */}
          {currentUser.permissions.canApplyStockOpname && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('opname');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'opname'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span className="truncate">Stock Opname Fisik</span>
              </div>
            </button>
          )}

          {/* 8. Master Data Gudang (Khusus Admin: Edit, Hapus, Simpan) */}
          {currentUser.permissions.canManageMasterData && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('master');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'master'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderTree className="w-4 h-4 shrink-0" />
                <span className="truncate">Master Data Gudang</span>
              </div>
            </button>
          )}

          {/* 9. Pengaturan Sistem (Khusus Admin: Edit, Simpan, Reset) */}
          {currentUser.permissions.canManageSettings && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('settings');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Settings className="w-4 h-4 shrink-0" />
                <span className="truncate">Pengaturan Sistem</span>
              </div>
            </button>
          )}

          {/* 10. Dasbor Login & Portal Akses (Dikecualikan untuk QC sesuai permintaan pengguna) */}
          {currentUser.role !== 'QC' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('login_dashboard');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'login_dashboard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">Dasbor Login &amp; Portal</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  currentTab === 'login_dashboard'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                Portal
              </span>
            </button>
          )}
        </div>

        {/* Sidebar Footer / Tools */}
        <div className="p-3 border-t border-slate-800 space-y-1 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setIsMSDSOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Panduan K3 HazMat (MSDS)</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Reset Sampel Data</span>
          </button>

          <div className="pt-2 px-2 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/40">
            <span>Standar Barantan ISPM-15</span>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
          {/* Mobile drawer trigger & Active view heading */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label="Buka menu navigasi dasbor"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-white tracking-tight truncate">
                {currentTab === 'dashboard' && 'Dasbor & Monitoring Tangki BBM'}
                {currentTab === 'inventory' && 'Daftar Stok Inventaris'}
                {currentTab === 'qc_reports' &&
                  (currentUser.role === 'OPERATOR'
                    ? 'Laporan Pekerjaan Saya (Status QC)'
                    : 'Laporan Pekerjaan Fumigasi & Spraying Fogging (QC Hub)')}
                {currentTab === 'raw_material_recommendations' && 'Rekomendasi Fumigasi Bahan Baku'}
                {currentTab === 'crosscheck' && 'Kroscek & Audit Terpadu (Admin)'}
                {currentTab === 'mutations' && 'Buku Mutasi Transaksi'}
                {currentTab === 'outflows' && 'Tabel Pengeluaran Barang'}
                {currentTab === 'opname' && 'Stock Opname Fisik Gudang'}
                {currentTab === 'master' && 'Master Data Gudang & Logistik'}
                {currentTab === 'settings' && 'Pengaturan Sistem & Backup'}
                {currentTab === 'login_dashboard' && 'Dasbor Login & Portal Otorisasi Akses'}
              </span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="text-xs text-slate-400 font-mono hidden lg:inline">
                {currentUser.role === 'ADMIN'
                  ? 'Admin: Edit, Hapus, Simpan & Kroscek Semua'
                  : currentUser.role === 'QC'
                  ? 'QC: Evaluasi Laporan Pekerjaan & Rekomendasi Bahan Baku'
                  : 'Operator: Input Pekerjaan SPK & Pengeluaran Obat/BBM'}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Visual Warning Badge Button for Below-Threshold Stock */}
            {belowThresholdCount > 0 && (
              <button
                type="button"
                onClick={() => setCurrentTab('dashboard')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold transition-all cursor-pointer shadow-lg animate-pulse"
                title={`${belowThresholdCount} barang di bawah ambang batas stok minimum (${criticalCount} kritis). Klik untuk membuka dasbor!`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">{belowThresholdCount} Menipis</span>
                {criticalCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-extrabold font-mono">
                    {criticalCount} Kritis
                  </span>
                )}
              </button>
            )}

            <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {/* Admin: Quick Cross-Check Button */}
            {currentUser.permissions.canCrossCheckAll && (
              <button
                type="button"
                onClick={() => setCurrentTab('crosscheck')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Buka Hub Kroscek & Audit Terpadu"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Kroscek Semua</span>
              </button>
            )}

            {/* Operator & Admin: Quick Input SPK Pekerjaan */}
            {currentUser.permissions.canInputJobReports && (
              <button
                type="button"
                onClick={() => setIsOperatorJobModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Input Pekerjaan Spraying, Fogging & Fumigasi Baru"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Input SPK</span>
              </button>
            )}

            {/* QC Quick Inspection Hub Button */}
            {currentUser.permissions.canVerifyQC && (
              <button
                type="button"
                onClick={() => setIsQCModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Buka Hub Inspeksi QC & Pengujian Mutu Batch"
              >
                <Microscope className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Inspeksi Batch</span>
              </button>
            )}

            {/* In / Out Transaction Buttons (Controlled by role permission) */}
            {currentUser.permissions.canCreateTransactions && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTrxDefaultItem(null);
                    setTrxDefaultType('OUT');
                    setIsTrxModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pengeluaran</span>
                </button>

                {currentUser.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTrxDefaultItem(null);
                      setTrxDefaultType('IN');
                      setIsTrxModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Penerimaan</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
              title="Scan Barcode / SKU / QR Code"
            >
              <Scan className="w-4 h-4" />
            </button>

            {/* Quick Access to Dasbor Login (Dikecualikan untuk QC sesuai permintaan pengguna) */}
            {currentUser.role !== 'QC' && (
              <button
                type="button"
                onClick={() => setCurrentTab('login_dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'login_dashboard'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-amber-500/50'
                }`}
                title="Buka Dasbor Login & Portal Akses Peran"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Dasbor Login</span>
              </button>
            )}

            {/* User Profile & Role Switcher */}
            <UserProfileMenu
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onLogout={handleLogout}
              onOpenLoginDashboard={currentUser.role !== 'QC' ? () => setCurrentTab('login_dashboard') : undefined}
            />
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'qc_reports' && (
          <QCJobReportsView
            jobReports={jobReports}
            currentUser={currentUser}
            onUpdateJobReport={handleUpdateJobReport}
            onDeleteJobReport={handleDeleteJobReport}
            onOpenNewJobModal={() => setIsOperatorJobModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'raw_material_recommendations' && (
          <RawMaterialRecommendationsView
            recommendations={rawRecommendations}
            currentUser={currentUser}
            onOpenNewModal={() => {
              setRawRecToEdit(null);
              setIsRawRecModalOpen(true);
            }}
            onEditRecommendation={(rec) => {
              setRawRecToEdit(rec);
              setIsRawRecModalOpen(true);
            }}
            onDeleteRecommendation={handleDeleteRawRecommendation}
            onExecuteAsSPK={handleExecuteRecAsSPK}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'crosscheck' && (
          <AdminCrossCheckView
            items={items}
            transactions={transactions}
            jobReports={jobReports}
            currentUser={currentUser}
            onUpdateJobReport={handleUpdateJobReport}
            onDeleteJobReport={handleDeleteJobReport}
            onDeleteTransaction={handleDeleteTransaction}
            onNavigateToStockOpname={() => setCurrentTab('opname')}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'dashboard' && currentUser.role !== 'QC' && (
          <DashboardOverview
            items={items}
            transactions={transactions}
            onOpenQuickTransaction={(type, item, suggestedQty) => {
              setTrxDefaultItem(item || null);
              setTrxDefaultType(type);
              setTrxDefaultQuantity(suggestedQty);
              setIsTrxModalOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenStockOpname={() => setCurrentTab('opname')}
            onOpenMSDS={() => setIsMSDSOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onViewItemDetails={(item) => {
              setActiveDetailItem(item);
              setIsDetailModalOpen(true);
            }}
            onPrintSuratJalan={(trx) => {
              setActiveSuratJalanTrx(trx);
              setIsSuratJalanOpen(true);
            }}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryTableView
            items={items}
            selectedCategory={selectedCategoryFilter}
            onSelectCategory={setSelectedCategoryFilter}
            onOpenTransaction={(item, type, suggestedQty) => {
              setTrxDefaultItem(item);
              setTrxDefaultType(type);
              setTrxDefaultQuantity(suggestedQty);
              setIsTrxModalOpen(true);
            }}
            onViewDetails={(item) => {
              setActiveDetailItem(item);
              setIsDetailModalOpen(true);
            }}
            onPrintLabel={(item) => {
              setLabelItem(item);
              setIsPrintLabelOpen(true);
            }}
            onAddNewItem={() => {
              setItemToEdit(null);
              setIsAddItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setItemToEdit(item);
              setIsAddItemModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onSaveItem={handleSaveItem}
            onExportCSV={() => exportInventoryToCSV(items)}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'mutations' && (
          <MutationsHistoryView
            transactions={transactions}
            items={items}
            onPrintSuratJalan={(trx) => {
              setActiveSuratJalanTrx(trx);
              setIsSuratJalanOpen(true);
            }}
            onExportCSV={() => exportMutationsToCSV(transactions)}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteAllTransactions={handleDeleteAllTransactions}
            onReloadSampleTransactions={handleReloadSampleTransactions}
            onNavigateToOutflows={() => setCurrentTab('outflows')}
          />
        )}

        {currentTab === 'outflows' && (
          <OutflowReportsView
            transactions={transactions}
            items={items}
            onPrintSuratJalan={(trx) => {
              setActiveSuratJalanTrx(trx);
              setIsSuratJalanOpen(true);
            }}
            onOpenNewOutflow={() => {
              setTrxDefaultItem(null);
              setTrxDefaultType('OUT');
              setIsTrxModalOpen(true);
            }}
            onDeleteOutflow={handleDeleteTransaction}
            onNavigateToMutations={() => {
              setCurrentTab('mutations');
            }}
            onNavigateToInventory={() => {
              setCurrentTab('inventory');
            }}
            onSyncAll={() => {
              showToast(`Sinkronisasi aktif: ${items.length} item stok dan ${transactions.length} mutasi sinkron.`);
            }}
          />
        )}

        {currentTab === 'opname' && (
          <StockOpnameView
            items={items}
            currentUser={currentUser}
            onApplyOpname={handleApplyOpname}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'master' && (
          <MasterDataView
            medicines={medicines}
            onSaveMedicine={handleSaveMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            fuels={fuels}
            onSaveFuel={handleSaveFuel}
            onDeleteFuel={handleDeleteFuel}
            equipment={equipment}
            onSaveEquipment={handleSaveEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            suppliers={suppliers}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            locations={locations}
            onSaveLocation={handleSaveLocation}
            onDeleteLocation={handleDeleteLocation}
            operators={operators}
            onSaveOperator={handleSaveOperator}
            onDeleteOperator={handleDeleteOperator}
            destinations={destinations}
            onSaveDestination={handleSaveDestination}
            onDeleteDestination={handleDeleteDestination}
            units={units}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            onCreateInventoryFromMaster={handleCreateInventoryFromMaster}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'settings' && (
          <SystemSettingsView
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
            onExportFullBackup={handleExportFullBackup}
            onImportBackup={handleImportBackup}
            onResetFactoryData={handleResetFactoryData}
          />
        )}

        {currentTab === 'login_dashboard' && (
          <div className="-mx-4 -my-6 sm:-mx-6">
            <LoginDashboard
              onLoginSuccess={handleLoginSuccess}
              currentUser={currentUser}
              onLogout={handleLogout}
              onBackToApp={() => {
                if (currentUser.role === 'QC') setCurrentTab('qc_reports');
                else setCurrentTab('dashboard');
              }}
              items={items}
              transactions={transactions}
              jobReports={jobReports}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-xs text-slate-500 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-mono text-[11px]">
            Sistem Inventaris Gudang Terpadu · Modul Stok BBM (Solar B35/Pertamax), Kimia Fumigasi (PH3/CH3Br) & Fogging Pest Control
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Standar K3 & Barantan ISPM-15</span>
            <span aria-hidden="true">·</span>
            <span>Real-time FIFO & Batch Tracking</span>
          </div>
        </div>
      </footer>
        </div>
      </div>

      {/* Modal Dialogs */}
      <TransactionModal
        isOpen={isTrxModalOpen}
        onClose={() => {
          setIsTrxModalOpen(false);
          setTrxDefaultQuantity(undefined);
        }}
        items={items}
        defaultItem={trxDefaultItem}
        defaultType={trxDefaultType}
        defaultQuantity={trxDefaultQuantity}
        operators={operators}
        destinations={destinations}
        settings={settings}
        currentUserName={currentUser.name}
        currentUser={currentUser}
        onSaveTransaction={handleSaveTransaction}
      />

      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={activeDetailItem}
        transactions={transactions}
        currentUser={currentUser}
        onOpenTransaction={(item, type, suggestedQty) => {
          setTrxDefaultItem(item);
          setTrxDefaultType(type);
          setTrxDefaultQuantity(suggestedQty);
          setIsTrxModalOpen(true);
        }}
        onPrintLabel={(item) => {
          setLabelItem(item);
          setIsPrintLabelOpen(true);
        }}
        onEditItem={(item) => {
          setItemToEdit(item);
          setIsAddItemModalOpen(true);
        }}
        onDeleteItem={handleDeleteItem}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSaveItem={handleSaveItem}
        existingItem={itemToEdit}
        locations={locations}
        units={units}
        suppliers={suppliers}
        settings={settings}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        onSelectItem={(item, action) => {
          if (action === 'TRANSACT') {
            setTrxDefaultItem(item);
            setTrxDefaultType('OUT');
            setIsTrxModalOpen(true);
          } else {
            setActiveDetailItem(item);
            setIsDetailModalOpen(true);
          }
        }}
      />

      <BarcodeLabelModal
        isOpen={isPrintLabelOpen}
        onClose={() => setIsPrintLabelOpen(false)}
        item={labelItem}
      />

      <SuratJalanPrintModal
        isOpen={isSuratJalanOpen}
        onClose={() => setIsSuratJalanOpen(false)}
        transaction={activeSuratJalanTrx}
        settings={settings}
        itemDetails={
          activeSuratJalanTrx
            ? items.find((i) => i.id === activeSuratJalanTrx.itemId) || null
            : null
        }
      />

      <MSDSSafetyModal
        isOpen={isMSDSOpen}
        onClose={() => setIsMSDSOpen(false)}
      />

      <QCInspectionModal
        isOpen={isQCModalOpen}
        onClose={() => setIsQCModalOpen(false)}
        items={items}
        currentUser={currentUser}
        onUpdateItemBatches={handleUpdateItemBatches}
        onShowToast={showToast}
      />

      <OperatorJobInputModal
        isOpen={isOperatorJobModalOpen}
        onClose={() => {
          setIsOperatorJobModalOpen(false);
          setRecToExecuteAsSPK(null);
        }}
        items={items}
        currentUser={currentUser}
        operators={operators}
        destinations={destinations}
        settings={settings}
        initialRecommendation={recToExecuteAsSPK}
        onSaveJobAndDeductStock={handleSaveJobAndDeductStock}
      />

      <RawMaterialRecommendationModal
        isOpen={isRawRecModalOpen}
        onClose={() => {
          setIsRawRecModalOpen(false);
          setRawRecToEdit(null);
        }}
        currentUser={currentUser}
        items={items}
        existingRecommendation={rawRecToEdit}
        onSaveRecommendation={handleSaveRawRecommendation}
      />
    </div>
  );
}
