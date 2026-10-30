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
import { INITIAL_AUTH_USERS, loadStoredAuthUsers, saveStoredAuthUsers } from './data/initialAuthUsers';
import { LoginScreen } from './components/LoginScreen';
import { LoginDashboard } from './components/LoginDashboard';
import { AdminUsersManagementView } from './components/AdminUsersManagementView';
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
import { TreatmentExecutionModal } from './components/TreatmentExecutionModal';
import { FumigationJobReport, JobType } from './types/jobs';
import { RawMaterialRecommendation, TreatmentExecutionRecord } from './types/recommendations';
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
  Users,
  Sparkles,
} from 'lucide-react';
import { isBelowMinimumThreshold, isCriticallyBelowThreshold } from './utils/stockUtils';

import {
  subscribeInventoryItems,
  saveInventoryItem,
  deleteInventoryItem,
  subscribeStockTransactions,
  saveStockTransaction,
  deleteStockTransaction,
  deleteAllStockTransactions,
  subscribeJobReports,
  saveJobReport,
  deleteJobReport,
  subscribeRawRecommendations,
  saveRawRecommendation,
  deleteRawRecommendation,
  subscribeAuthUsers,
  saveAuthUser,
  deleteAuthUser,
  subscribeMasterCollection,
  saveMasterDocument,
  deleteMasterDocument,
  subscribeSystemSettings,
  saveSystemSettings,
  seedDatabaseIfEmpty,
  COLLECTIONS,
} from './firebase/firestoreService';

export default function App() {
  // Authentication State: Sesuai permintaan pengguna, saat awal masuk link atau membuka program selalu kembali ke tampilan login
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [isQCModalOpen, setIsQCModalOpen] = useState(false);

  // Real-time synced states from Firebase Firestore
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_TRANSACTIONS);
  const [suppliers, setSuppliers] = useState<MasterSupplier[]>(INITIAL_SUPPLIERS);
  const [locations, setLocations] = useState<MasterLocation[]>(INITIAL_LOCATIONS);
  const [operators, setOperators] = useState<MasterOperator[]>(INITIAL_OPERATORS);
  const [destinations, setDestinations] = useState<MasterProjectDestination[]>(INITIAL_PROJECT_DESTINATIONS);
  const [units, setUnits] = useState<MasterUnit[]>(INITIAL_UNITS);
  const [medicines, setMedicines] = useState<MasterChemicalMedicine[]>(INITIAL_CHEMICAL_MEDICINES);
  const [fuels, setFuels] = useState<MasterFuelType[]>(INITIAL_FUEL_TYPES);
  const [equipment, setEquipment] = useState<MasterEquipmentInventory[]>(INITIAL_EQUIPMENT_INVENTORY);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [jobReports, setJobReports] = useState<FumigationJobReport[]>(INITIAL_JOB_REPORTS);
  const [rawRecommendations, setRawRecommendations] = useState<RawMaterialRecommendation[]>(INITIAL_RAW_RECOMMENDATIONS);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(INITIAL_AUTH_USERS);

  // Initialize and seed Firestore if empty, and subscribe to real-time listeners for all devices (HP, Laptop, PC)
  useEffect(() => {
    seedDatabaseIfEmpty();

    const unsubItems = subscribeInventoryItems((data) => {
      if (data && data.length > 0) setItems(data);
    });
    const unsubTrx = subscribeStockTransactions((data) => {
      setTransactions(data);
    });
    const unsubJobs = subscribeJobReports((data) => {
      if (data && data.length > 0) setJobReports(data);
    });
    const unsubRecs = subscribeRawRecommendations((data) => {
      if (data && data.length > 0) setRawRecommendations(data);
    });
    const unsubUsers = subscribeAuthUsers((data) => {
      if (data && data.length > 0) setAuthUsers(data);
    });
    const unsubSettings = subscribeSystemSettings((data) => {
      if (data && data.companyName) setSettings(data);
    });

    const unsubSuppliers = subscribeMasterCollection<MasterSupplier>(COLLECTIONS.SUPPLIERS, (data) => {
      if (data && data.length > 0) setSuppliers(data);
    });
    const unsubLocations = subscribeMasterCollection<MasterLocation>(COLLECTIONS.LOCATIONS, (data) => {
      if (data && data.length > 0) setLocations(data);
    });
    const unsubOperators = subscribeMasterCollection<MasterOperator>(COLLECTIONS.OPERATORS, (data) => {
      if (data && data.length > 0) setOperators(data);
    });
    const unsubDestinations = subscribeMasterCollection<MasterProjectDestination>(COLLECTIONS.DESTINATIONS, (data) => {
      if (data && data.length > 0) setDestinations(data);
    });
    const unsubUnits = subscribeMasterCollection<MasterUnit>(COLLECTIONS.UNITS, (data) => {
      if (data && data.length > 0) setUnits(data);
    });
    const unsubMedicines = subscribeMasterCollection<MasterChemicalMedicine>(COLLECTIONS.MEDICINES, (data) => {
      if (data && data.length > 0) setMedicines(data);
    });
    const unsubFuels = subscribeMasterCollection<MasterFuelType>(COLLECTIONS.FUELS, (data) => {
      if (data && data.length > 0) setFuels(data);
    });
    const unsubEquipment = subscribeMasterCollection<MasterEquipmentInventory>(COLLECTIONS.EQUIPMENT, (data) => {
      if (data && data.length > 0) setEquipment(data);
    });

    return () => {
      unsubItems();
      unsubTrx();
      unsubJobs();
      unsubRecs();
      unsubUsers();
      unsubSettings();
      unsubSuppliers();
      unsubLocations();
      unsubOperators();
      unsubDestinations();
      unsubUnits();
      unsubMedicines();
      unsubFuels();
      unsubEquipment();
    };
  }, []);

  // Current view tabs:
  type AppTab =
    | 'dashboard'
    | 'inventory'
    | 'qc_reports'
    | 'reports_fumigasi'
    | 'reports_spraying'
    | 'raw_material_recommendations'
    | 'rec_fumigasi'
    | 'rec_spraying'
    | 'crosscheck'
    | 'mutations'
    | 'outflows'
    | 'opname'
    | 'master'
    | 'settings'
    | 'login_dashboard'
    | 'admin_users';

  const [currentTab, setCurrentTab] = useState<AppTab>(() => {
    return currentUser?.role === 'QC' ? 'qc_reports' : 'dashboard';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'ALL'>('ALL');

  // Guard for QC & Operator: QC cannot access dashboard, login_dashboard, or admin_users; Operator cannot access login_dashboard or admin_users
  useEffect(() => {
    if (currentUser?.role === 'QC') {
      if (currentTab === 'dashboard' || currentTab === 'login_dashboard' || currentTab === 'admin_users') {
        setCurrentTab('qc_reports');
      }
    } else if (currentUser?.role === 'OPERATOR') {
      if (currentTab === 'login_dashboard' || currentTab === 'admin_users') {
        setCurrentTab('dashboard');
      } else if (currentTab === 'qc_reports') {
        setCurrentTab('reports_fumigasi');
      }
    }
  }, [currentUser, currentTab]);

  const [isRawRecModalOpen, setIsRawRecModalOpen] = useState(false);
  const [rawRecInitialType, setRawRecInitialType] = useState<'FUMIGASI' | 'SPRAYING_FOGGING'>('FUMIGASI');
  const [rawRecToEdit, setRawRecToEdit] = useState<RawMaterialRecommendation | null>(null);
  const [recToExecuteAsSPK, setRecToExecuteAsSPK] = useState<RawMaterialRecommendation | null>(null);

  // Perintah Realisasi Pengerjaan Fumigasi / Spraying / Fogging Modal State
  const [isTreatmentExecutionModalOpen, setIsTreatmentExecutionModalOpen] = useState(false);
  const [recForExecutionModal, setRecForExecutionModal] = useState<RawMaterialRecommendation | null>(null);

  const [isOperatorJobModalOpen, setIsOperatorJobModalOpen] = useState(false);
  const [operatorModalInitialJobType, setOperatorModalJobType] = useState<JobType>('FUMIGASI');

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

  // Handler: Commit Transaction (Input Pengeluaran / Penerimaan)
  const handleSaveTransaction = async (trxData: Omit<StockTransaction, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const newTrx: StockTransaction = {
      ...trxData,
      operator: trxData.operator || (currentUser ? currentUser.name : 'Petugas Gudang'),
      id: `trx-${Date.now()}`,
      timestamp: trxData.timestamp || new Date().toISOString(),
    };

    // Update item stock in state & Firestore
    const targetItem = items.find((item) => item.id === trxData.itemId);
    if (targetItem) {
      const updatedItem: InventoryItem = {
        ...targetItem,
        currentStock: trxData.newStock,
        lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      await saveInventoryItem(updatedItem);
    }
    await saveStockTransaction(newTrx);

    showToast(
      `Berhasil mencatat mutasi: [${trxData.type}] ${trxData.itemName} (${trxData.quantity} ${trxData.unit})`
    );

    // Auto open Surat Jalan preview if it is OUT
    if (trxData.type === 'OUT') {
      setActiveSuratJalanTrx(newTrx);
      setIsSuratJalanOpen(true);
    }
  };

  // Handler: Update Existing Transaction (Edit Mutasi & Pengeluaran dengan Penyesuaian Stok Otomatis)
  const handleUpdateTransaction = async (updatedTrx: StockTransaction) => {
    const oldTrx = transactions.find((t) => t.id === updatedTrx.id);

    if (oldTrx) {
      // Re-calculate inventory stock if quantity or itemId changed
      if (oldTrx.itemId === updatedTrx.itemId) {
        const qtyDiff = updatedTrx.quantity - oldTrx.quantity;
        if (qtyDiff !== 0) {
          const item = items.find((i) => i.id === updatedTrx.itemId);
          if (item) {
            let adjusted = item.currentStock;
            if (updatedTrx.type === 'OUT') {
              adjusted = Math.max(0, item.currentStock - qtyDiff);
            } else if (updatedTrx.type === 'IN') {
              adjusted = Math.max(0, item.currentStock + qtyDiff);
            } else if (updatedTrx.type === 'ADJUSTMENT') {
              adjusted = updatedTrx.quantity;
            }
            await saveInventoryItem({
              ...item,
              currentStock: adjusted,
              lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
            });
          }
        }
      } else {
        const oldItem = items.find((i) => i.id === oldTrx.itemId);
        if (oldItem) {
          const revertedStock =
            oldTrx.type === 'OUT'
              ? oldItem.currentStock + oldTrx.quantity
              : Math.max(0, oldItem.currentStock - oldTrx.quantity);
          await saveInventoryItem({ ...oldItem, currentStock: revertedStock });
        }
        const newItem = items.find((i) => i.id === updatedTrx.itemId);
        if (newItem) {
          const adjustedStock =
            updatedTrx.type === 'OUT'
              ? Math.max(0, newItem.currentStock - updatedTrx.quantity)
              : newItem.currentStock + updatedTrx.quantity;
          await saveInventoryItem({ ...newItem, currentStock: adjustedStock });
        }
      }
    }

    await saveStockTransaction(updatedTrx);
    showToast(`Pengeluaran / Mutasi ${updatedTrx.referenceNo} berhasil diperbarui & disinkronkan ke cloud.`);
  };

  // Handler: Delete Transaction with Optional Stock Reversion
  const handleDeleteTransaction = async (trxId: string, revertStock: boolean) => {
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (!targetTrx) return;

    if (revertStock) {
      const item = items.find((i) => i.id === targetTrx.itemId);
      if (item) {
        let adjustedStock = item.currentStock;
        if (targetTrx.type === 'IN') {
          adjustedStock = Math.max(0, item.currentStock - targetTrx.quantity);
        } else if (targetTrx.type === 'OUT') {
          adjustedStock = item.currentStock + targetTrx.quantity;
        } else if (targetTrx.type === 'ADJUSTMENT') {
          adjustedStock = targetTrx.previousStock;
        }
        await saveInventoryItem({
          ...item,
          currentStock: adjustedStock,
          lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
      }
    }

    await deleteStockTransaction(trxId);
    showToast(
      revertStock
        ? `Mutasi ${targetTrx.referenceNo} dihapus & stok barang dikembalikan.`
        : `Mutasi ${targetTrx.referenceNo} berhasil dihapus.`
    );
  };

  // Handler: Delete All Transactions (Hapus Semua Mutasi)
  const handleDeleteAllTransactions = async (revertStock: boolean) => {
    const totalCount = transactions.length;
    if (totalCount === 0) return;

    if (revertStock) {
      const itemStockMap = new Map<string, number>();
      items.forEach((i) => itemStockMap.set(i.id, i.currentStock));

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

      for (const item of items) {
        const reverted = itemStockMap.get(item.id);
        if (reverted !== undefined) {
          await saveInventoryItem({
            ...item,
            currentStock: reverted,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        }
      }
    }

    await deleteAllStockTransactions();
    showToast(
      revertStock
        ? `Seluruh riwayat mutasi (${totalCount} transaksi) berhasil dihapus & stok barang dikembalikan.`
        : `Seluruh riwayat mutasi (${totalCount} transaksi) berhasil dikosongkan.`
    );
  };

  // Handler: Reload Sample Transactions
  const handleReloadSampleTransactions = async () => {
    for (const trx of INITIAL_TRANSACTIONS) {
      await saveStockTransaction(trx);
    }
    showToast(`Data sampel riwayat mutasi (${INITIAL_TRANSACTIONS.length} transaksi) berhasil dimuat kembali ke Firestore.`);
  };

  // Handler: Add or Edit Item
  const handleSaveItem = async (itemToSave: InventoryItem) => {
    await saveInventoryItem(itemToSave);
    const exists = items.some((i) => i.id === itemToSave.id);
    showToast(
      exists
        ? `Data barang "${itemToSave.name}" berhasil diperbarui di cloud.`
        : `Barang baru "${itemToSave.name}" berhasil ditambahkan ke cloud.`
    );
    setItemToEdit(null);
  };

  // Handler: Delete Item
  const handleDeleteItem = async (itemId: string) => {
    await deleteInventoryItem(itemId);
    showToast('Barang berhasil dihapus dari inventaris gudang.');
  };

  // Handler: Apply Stock Opname Adjustments
  const handleApplyOpname = async (
    adjustments: {
      item: InventoryItem;
      physicalStock: number;
      difference: number;
      notes: string;
    }[]
  ) => {
    const dateStr = new Date().toISOString();

    for (const adj of adjustments) {
      const prevStock = adj.item.currentStock;
      const updatedItem: InventoryItem = {
        ...adj.item,
        currentStock: adj.physicalStock,
        lastUpdated: dateStr.replace('T', ' ').slice(0, 16),
      };
      await saveInventoryItem(updatedItem);

      const newTrx: StockTransaction = {
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
      };
      await saveStockTransaction(newTrx);
    }

    showToast(`Stock Opname selesai! ${adjustments.length} item berhasil diselaraskan di cloud.`);
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
    } else if (user.role === 'OPERATOR' && currentTab === 'login_dashboard') {
      setCurrentTab('dashboard');
    }
    showToast(`Beralih akun ke: ${user.name} (${user.roleTitle})`);
  };

  const handleUpdateItemBatches = async (itemId: string, updatedBatches: BatchItem[]) => {
    const target = items.find((i) => i.id === itemId);
    if (target) {
      await saveInventoryItem({ ...target, batches: updatedBatches });
    }
  };

  // Job Report Handlers: Operator & Admin can save job, QC can evaluate & approve
  const handleSaveJobAndDeductStock = async (
    report: FumigationJobReport,
    medicineDeduction: { itemId: string; qty: number; batchNo?: string },
    fuelDeduction?: { itemId: string; qty: number; batchNo?: string },
    linkedRecommendationId?: string
  ) => {
    await saveJobReport(report);

    // If linked to a raw material recommendation, update recommendation status to DIPROSES
    if (linkedRecommendationId) {
      const rec = rawRecommendations.find((r) => r.id === linkedRecommendationId);
      if (rec) {
        await saveRawRecommendation({
          ...rec,
          status: 'DIPROSES' as const,
          linkedSpkNo: report.jobNo,
          linkedJobReportId: report.id,
          processedByOperator: report.operatorName,
          processedAt: new Date().toISOString(),
        });
      }
      setRecToExecuteAsSPK(null);
    }

    const nowIso = new Date().toISOString();

    const medItem = items.find((i) => i.id === medicineDeduction.itemId);
    if (medItem) {
      const prevStock = medItem.currentStock;
      const newStock = Math.max(0, prevStock - medicineDeduction.qty);

      const medTrx: StockTransaction = {
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
      };
      await saveStockTransaction(medTrx);
      await saveInventoryItem({
        ...medItem,
        currentStock: newStock,
        lastUpdated: nowIso.replace('T', ' ').slice(0, 16),
      });
    }

    if (fuelDeduction) {
      const fuelItem = items.find((i) => i.id === fuelDeduction.itemId);
      if (fuelItem) {
        const prevStock = fuelItem.currentStock;
        const newStock = Math.max(0, prevStock - fuelDeduction.qty);

        const fuelTrx: StockTransaction = {
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
        };
        await saveStockTransaction(fuelTrx);
        await saveInventoryItem({
          ...fuelItem,
          currentStock: newStock,
          lastUpdated: nowIso.replace('T', ' ').slice(0, 16),
        });
      }
    }

    showToast(`SPK ${report.jobNo} berhasil disimpan & stok bahan telah dikeluarkan dari gudang.`);
  };

  const handleUpdateJobReport = async (updated: FumigationJobReport) => {
    await saveJobReport(updated);
    showToast(`Laporan pekerjaan SPK ${updated.jobNo} berhasil diperbarui.`);
  };

  const handleDeleteJobReport = async (id: string) => {
    await deleteJobReport(id);
    showToast('Laporan pekerjaan berhasil dihapus.');
  };

  // Raw Material Recommendations Handlers (QC -> Operator & Admin)
  const handleSaveRawRecommendation = async (rec: RawMaterialRecommendation) => {
    await saveRawRecommendation(rec);
    const exists = rawRecommendations.some((r) => r.id === rec.id);
    showToast(
      exists
        ? `Rekomendasi bahan baku ${rec.recommendationNo} berhasil diperbarui.`
        : `Rekomendasi ${rec.recommendationNo} (${rec.commodityName}) terkirim ke Operator & Admin!`
    );
    setRawRecToEdit(null);
  };

  const handleDeleteRawRecommendation = async (id: string) => {
    await deleteRawRecommendation(id);
    showToast('Rekomendasi bahan baku berhasil dihapus.');
  };

  const handleExecuteRecAsSPK = (rec: RawMaterialRecommendation) => {
    setRecToExecuteAsSPK(rec);
    setIsOperatorJobModalOpen(true);
  };

  // Handler: Konfirmasi Perintah Realisasi Pengerjaan Fumigasi / Spraying / Fogging
  const handleConfirmTreatmentExecution = async (
    recId: string,
    executionRecord: TreatmentExecutionRecord,
    stockDeduction?: { itemId: string; quantity: number }
  ) => {
    // 1. Update status rekomendasi menjadi SELESAI dan lampirkan riwayat realisasi pengerjaan
    const rec = rawRecommendations.find((r) => r.id === recId);
    if (rec) {
      await saveRawRecommendation({
        ...rec,
        status: 'SELESAI' as const,
        treatmentExecutionRecord: executionRecord,
        processedByOperator: executionRecord.executedBy,
        processedAt: executionRecord.completedAt,
      });
    }

    // 2. Jika dipilih potong stok otomatis, catat transaksi OUT di mutasi dan update stok barang inventaris
    if (stockDeduction && stockDeduction.quantity > 0) {
      const medItem = items.find((i) => i.id === stockDeduction.itemId);
      if (medItem) {
        const prevStock = medItem.currentStock;
        const newStock = Math.max(0, prevStock - stockDeduction.quantity);
        const nowIso = new Date().toISOString();

        const outTrx: StockTransaction = {
          id: `trx-exec-${Date.now()}`,
          timestamp: nowIso,
          type: 'OUT',
          itemId: medItem.id,
          sku: medItem.sku,
          itemName: medItem.name,
          category: medItem.category,
          quantity: stockDeduction.quantity,
          unit: executionRecord.usedMedicineUnit || medItem.unit,
          previousStock: prevStock,
          newStock: newStock,
          referenceNo: `REALISASI-${executionRecord.treatmentType.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          projectOrLocation: `${executionRecord.warehouseLocation} (${executionRecord.treatedTonnage} ${executionRecord.tonnageUnit})`,
          operator: executionRecord.executedBy,
          notes: `Realisasi ${executionRecord.treatmentType}: Obat ${executionRecord.usedMedicineName} pada ${executionRecord.warehouseLocation} (${executionRecord.treatedTonnage} ${executionRecord.tonnageUnit}). ${executionRecord.executionNotes || ''}`,
        };

        await saveStockTransaction(outTrx);
        await saveInventoryItem({
          ...medItem,
          currentStock: newStock,
          lastUpdated: nowIso.replace('T', ' ').slice(0, 16),
        });
      }
    }

    setIsTreatmentExecutionModalOpen(false);
    setRecForExecutionModal(null);
    showToast(
      `✓ Konfirmasi pengerjaan ${executionRecord.treatmentType} berhasil dicatat & status rekomendasi telah SELESAI!`
    );
  };

  // ================= ADMIN: KELOLA ID & PASSWORD PENGGUNA =================
  const handleSaveUser = async (user: AuthUser, isNew: boolean) => {
    await saveAuthUser(user);

    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
    }

    showToast(
      isNew
        ? `Akun ID "${user.username}" (${user.name}) berhasil dibuat di cloud Firestore.`
        : `Data ID & kata sandi "${user.username}" berhasil diperbarui di cloud Firestore.`
    );
  };

  const handleDeleteUser = async (userId: string) => {
    const adminCount = authUsers.filter((u) => u.role === 'ADMIN').length;
    const target = authUsers.find((u) => u.id === userId);
    if (target?.role === 'ADMIN' && adminCount <= 1) {
      alert('Tidak dapat menghapus Administrator utama. Sistem harus memiliki minimal 1 akun Admin.');
      return;
    }

    await deleteAuthUser(userId);
    showToast(`Akun ID "${target?.username || userId}" telah dihapus.`);
  };

  // Reset to initial demo dataset
  const handleResetData = async () => {
    if (confirm('Kembalikan semua data inventaris, mutasi, dan laporan pekerjaan ke sampel awal bawaan?')) {
      for (const item of INITIAL_ITEMS) {
        await saveInventoryItem(item);
      }
      for (const trx of INITIAL_TRANSACTIONS) {
        await saveStockTransaction(trx);
      }
      for (const rep of INITIAL_JOB_REPORTS) {
        await saveJobReport(rep);
      }
      showToast('Database inventaris & SPK berhasil direset ke data sampel di cloud.');
    }
  };

  // ================= MASTER DATA HANDLERS =================
  const handleSaveSupplier = async (sup: MasterSupplier) => {
    await saveMasterDocument(COLLECTIONS.SUPPLIERS, sup);
    showToast(`Data pemasok "${sup.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteSupplier = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.SUPPLIERS, id);
    showToast('Data pemasok berhasil dihapus.');
  };

  const handleSaveLocation = async (loc: MasterLocation) => {
    await saveMasterDocument(COLLECTIONS.LOCATIONS, loc);
    showToast(`Lokasi "${loc.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteLocation = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.LOCATIONS, id);
    showToast('Data lokasi berhasil dihapus.');
  };

  const handleSaveOperator = async (op: MasterOperator) => {
    await saveMasterDocument(COLLECTIONS.OPERATORS, op);
    showToast(`Petugas "${op.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteOperator = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.OPERATORS, id);
    showToast('Data petugas berhasil dihapus.');
  };

  const handleSaveDestination = async (dest: MasterProjectDestination) => {
    await saveMasterDocument(COLLECTIONS.DESTINATIONS, dest);
    showToast(`Tujuan proyek "${dest.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteDestination = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.DESTINATIONS, id);
    showToast('Tujuan proyek berhasil dihapus.');
  };

  const handleSaveUnit = async (unit: MasterUnit) => {
    await saveMasterDocument(COLLECTIONS.UNITS, unit);
    showToast(`Satuan ukuran "${unit.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteUnit = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.UNITS, id);
    showToast('Satuan ukuran berhasil dihapus.');
  };

  // ================= MASTER: OBAT, BBM, INVENTARIS HANDLERS =================
  const handleSaveMedicine = async (med: MasterChemicalMedicine) => {
    await saveMasterDocument(COLLECTIONS.MEDICINES, med);
    showToast(`Master Obat "${med.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteMedicine = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.MEDICINES, id);
    showToast('Data master obat berhasil dihapus.');
  };

  const handleSaveFuel = async (fuel: MasterFuelType) => {
    await saveMasterDocument(COLLECTIONS.FUELS, fuel);
    showToast(`Master BBM "${fuel.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteFuel = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.FUELS, id);
    showToast('Data master BBM berhasil dihapus.');
  };

  const handleSaveEquipment = async (eqp: MasterEquipmentInventory) => {
    await saveMasterDocument(COLLECTIONS.EQUIPMENT, eqp);
    showToast(`Master Inventaris "${eqp.name}" berhasil disimpan ke cloud.`);
  };

  const handleDeleteEquipment = async (id: string) => {
    await deleteMasterDocument(COLLECTIONS.EQUIPMENT, id);
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
  const handleSaveSettings = async (newSettings: SystemSettings) => {
    await saveSystemSettings(newSettings);
    showToast('Pengaturan sistem dan format dokumen berhasil disimpan ke cloud Firestore.');
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

  const handleImportBackup = async (data: any) => {
    if (!data) return;
    if (Array.isArray(data.items)) {
      for (const it of data.items) await saveInventoryItem(it);
    }
    if (Array.isArray(data.transactions)) {
      for (const trx of data.transactions) await saveStockTransaction(trx);
    }
    if (data.systemSettings) {
      await saveSystemSettings(data.systemSettings);
    }
    if (data.masterData) {
      if (Array.isArray(data.masterData.medicines)) {
        for (const m of data.masterData.medicines) await saveMasterDocument(COLLECTIONS.MEDICINES, m);
      }
      if (Array.isArray(data.masterData.fuels)) {
        for (const f of data.masterData.fuels) await saveMasterDocument(COLLECTIONS.FUELS, f);
      }
      if (Array.isArray(data.masterData.equipment)) {
        for (const e of data.masterData.equipment) await saveMasterDocument(COLLECTIONS.EQUIPMENT, e);
      }
      if (Array.isArray(data.masterData.suppliers)) {
        for (const s of data.masterData.suppliers) await saveMasterDocument(COLLECTIONS.SUPPLIERS, s);
      }
      if (Array.isArray(data.masterData.locations)) {
        for (const l of data.masterData.locations) await saveMasterDocument(COLLECTIONS.LOCATIONS, l);
      }
      if (Array.isArray(data.masterData.operators)) {
        for (const o of data.masterData.operators) await saveMasterDocument(COLLECTIONS.OPERATORS, o);
      }
      if (Array.isArray(data.masterData.destinations)) {
        for (const d of data.masterData.destinations) await saveMasterDocument(COLLECTIONS.DESTINATIONS, d);
      }
      if (Array.isArray(data.masterData.units)) {
        for (const u of data.masterData.units) await saveMasterDocument(COLLECTIONS.UNITS, u);
      }
    }
    showToast('Database gudang dan master data berhasil dipulihkan dan disinkronkan ke cloud.');
  };

  const handleResetFactoryData = async () => {
    if (
      confirm(
        'PERINGATAN: Seluruh database (stok barang, riwayat transaksi, master data, dan pengaturan sistem) akan dikembalikan ke standar awal pabrik. Lanjutkan?'
      )
    ) {
      for (const item of INITIAL_ITEMS) await saveInventoryItem(item);
      for (const trx of INITIAL_TRANSACTIONS) await saveStockTransaction(trx);
      for (const med of INITIAL_CHEMICAL_MEDICINES) await saveMasterDocument(COLLECTIONS.MEDICINES, med);
      for (const f of INITIAL_FUEL_TYPES) await saveMasterDocument(COLLECTIONS.FUELS, f);
      for (const eq of INITIAL_EQUIPMENT_INVENTORY) await saveMasterDocument(COLLECTIONS.EQUIPMENT, eq);
      for (const s of INITIAL_SUPPLIERS) await saveMasterDocument(COLLECTIONS.SUPPLIERS, s);
      for (const l of INITIAL_LOCATIONS) await saveMasterDocument(COLLECTIONS.LOCATIONS, l);
      for (const o of INITIAL_OPERATORS) await saveMasterDocument(COLLECTIONS.OPERATORS, o);
      for (const d of INITIAL_PROJECT_DESTINATIONS) await saveMasterDocument(COLLECTIONS.DESTINATIONS, d);
      for (const u of INITIAL_UNITS) await saveMasterDocument(COLLECTIONS.UNITS, u);
      await saveSystemSettings(INITIAL_SYSTEM_SETTINGS);
      for (const rep of INITIAL_JOB_REPORTS) await saveJobReport(rep);
      showToast('Database gudang berhasil direset ke standar pabrik di cloud.');
    }
  };

  // Return LoginScreen if no user is authenticated
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        currentUser={null}
        items={items}
        transactions={transactions}
        jobReports={jobReports}
        authUsers={authUsers}
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

          {/* 1. Laporan Fumigasi & Spraying (Dipisahkan untuk Operator, Terpadu untuk QC & Admin) */}
          {currentUser.role === 'OPERATOR' ? (
            <div className="space-y-1.5">
              {/* Laporan Fumigasi Khusus Operator */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('reports_fumigasi');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'reports_fumigasi'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="truncate">Laporan Fumigasi</span>
                </div>
                {jobReports.filter((j) => (j.jobType || 'FUMIGASI') === 'FUMIGASI' && j.qcApprovalStatus === 'PENDING').length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                      currentTab === 'reports_fumigasi'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                    title="Laporan fumigasi menunggu QC"
                  >
                    {jobReports.filter((j) => (j.jobType || 'FUMIGASI') === 'FUMIGASI' && j.qcApprovalStatus === 'PENDING').length} Baru
                  </span>
                )}
              </button>

              {/* Laporan Spraying & Fogging Khusus Operator */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('reports_spraying');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'reports_spraying'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bug className="w-4 h-4 shrink-0 text-sky-400" />
                  <span className="truncate">Laporan Spraying &amp; Fogging</span>
                </div>
                {jobReports.filter((j) => j.jobType === 'SPRAYING_FOGGING' && j.qcApprovalStatus === 'PENDING').length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                      currentTab === 'reports_spraying'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                    title="Laporan spraying fogging menunggu QC"
                  >
                    {jobReports.filter((j) => j.jobType === 'SPRAYING_FOGGING' && j.qcApprovalStatus === 'PENDING').length} Baru
                  </span>
                )}
              </button>
            </div>
          ) : (
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
          )}

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

          {/* Rekomendasi Bahan Baku - Dipisahkan antara Fumigasi dan Spraying/Fogging */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            {/* 1. Rekomendasi Fumigasi Bahan Baku */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('rec_fumigasi');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'rec_fumigasi'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">Rekomendasi Fumigasi BB</span>
              </div>
              {rawRecommendations.filter((r) => (r.recommendedTreatmentType || 'FUMIGASI') === 'FUMIGASI' && r.status === 'TERKIRIM').length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                    currentTab === 'rec_fumigasi'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                  title="Rekomendasi fumigasi menunggu eksekusi"
                >
                  {rawRecommendations.filter((r) => (r.recommendedTreatmentType || 'FUMIGASI') === 'FUMIGASI' && r.status === 'TERKIRIM').length} Siap
                </span>
              )}
            </button>

            {/* 2. Rekomendasi Spraying & Fogging Bahan Baku */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('rec_spraying');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'rec_spraying'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-sky-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Bug className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="truncate">Rekomendasi Spraying BB</span>
              </div>
              {rawRecommendations.filter((r) => r.recommendedTreatmentType === 'SPRAYING_FOGGING' && r.status === 'TERKIRIM').length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                    currentTab === 'rec_spraying'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}
                  title="Rekomendasi spraying/fogging menunggu eksekusi"
                >
                  {rawRecommendations.filter((r) => r.recommendedTreatmentType === 'SPRAYING_FOGGING' && r.status === 'TERKIRIM').length} Siap
                </span>
              )}
            </button>
          </div>

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

          {/* 10. Dasbor Manajemen ID & Password Pengguna (Khusus Admin: Tambah, Edit, Hapus Akun) */}
          {currentUser.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('admin_users');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'admin_users'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-300 hover:bg-slate-800 hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">Kelola ID &amp; Password</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  currentTab === 'admin_users'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {authUsers.length} Akun
              </span>
            </button>
          )}

          {/* 11. Layar Tampilan Login (Pratinjau) */}
          {currentUser.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setCurrentTab('login_dashboard');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'login_dashboard'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="truncate">Pratinjau Layar Login</span>
              </div>
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
                {currentTab === 'reports_fumigasi' && 'Laporan Pekerjaan Fumigasi'}
                {currentTab === 'reports_spraying' && 'Laporan Pekerjaan Spraying & Fogging'}
                {currentTab === 'raw_material_recommendations' && 'Rekomendasi Fumigasi Bahan Baku'}
                {currentTab === 'crosscheck' && 'Kroscek & Audit Terpadu (Admin)'}
                {currentTab === 'mutations' && 'Buku Mutasi Transaksi'}
                {currentTab === 'outflows' && 'Tabel Pengeluaran Barang'}
                {currentTab === 'opname' && 'Stock Opname Fisik Gudang'}
                {currentTab === 'master' && 'Master Data Gudang & Logistik'}
                {currentTab === 'settings' && 'Pengaturan Sistem & Backup'}
                {currentTab === 'admin_users' && 'Dasbor Manajemen ID & Password Pengguna (Admin)'}
                {currentTab === 'login_dashboard' && 'Pratinjau Layar Login'}
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

            {/* Quick Access to Kelola ID & Password (Khusus Admin: Dikecualikan untuk QC dan Operator) */}
            {currentUser.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setCurrentTab('admin_users')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'admin_users'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-amber-500/50'
                }`}
                title="Kelola ID, Password & Akun Pengguna"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Kelola ID &amp; Sandi</span>
              </button>
            )}

            {/* User Profile Menu */}
            <UserProfileMenu
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenLoginDashboard={currentUser.role === 'ADMIN' ? () => setCurrentTab('admin_users') : undefined}
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
            onOpenNewJobModal={(preselectedType) => {
              if (preselectedType) setOperatorModalJobType(preselectedType);
              setIsOperatorJobModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'reports_fumigasi' && (
          <QCJobReportsView
            jobReports={jobReports}
            currentUser={currentUser}
            onUpdateJobReport={handleUpdateJobReport}
            onDeleteJobReport={handleDeleteJobReport}
            forcedJobType="FUMIGASI"
            onOpenNewJobModal={() => {
              setOperatorModalJobType('FUMIGASI');
              setIsOperatorJobModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'reports_spraying' && (
          <QCJobReportsView
            jobReports={jobReports}
            currentUser={currentUser}
            onUpdateJobReport={handleUpdateJobReport}
            onDeleteJobReport={handleDeleteJobReport}
            forcedJobType="SPRAYING_FOGGING"
            onOpenNewJobModal={() => {
              setOperatorModalJobType('SPRAYING_FOGGING');
              setIsOperatorJobModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {/* Rekomendasi Khusus Fumigasi Bahan Baku */}
        {currentTab === 'rec_fumigasi' && (
          <RawMaterialRecommendationsView
            recommendations={rawRecommendations}
            currentUser={currentUser}
            forcedTreatmentType="FUMIGASI"
            onOpenNewModal={(preselectedType) => {
              setRawRecInitialType(preselectedType || 'FUMIGASI');
              setRawRecToEdit(null);
              setIsRawRecModalOpen(true);
            }}
            onEditRecommendation={(rec) => {
              setRawRecToEdit(rec);
              setRawRecInitialType(rec.recommendedTreatmentType === 'SPRAYING_FOGGING' ? 'SPRAYING_FOGGING' : 'FUMIGASI');
              setIsRawRecModalOpen(true);
            }}
            onDeleteRecommendation={handleDeleteRawRecommendation}
            onExecuteAsSPK={handleExecuteRecAsSPK}
            onOpenExecutionModal={(rec) => {
              setRecForExecutionModal(rec);
              setIsTreatmentExecutionModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {/* Rekomendasi Khusus Spraying & Fogging Bahan Baku */}
        {currentTab === 'rec_spraying' && (
          <RawMaterialRecommendationsView
            recommendations={rawRecommendations}
            currentUser={currentUser}
            forcedTreatmentType="SPRAYING_FOGGING"
            onOpenNewModal={(preselectedType) => {
              setRawRecInitialType(preselectedType || 'SPRAYING_FOGGING');
              setRawRecToEdit(null);
              setIsRawRecModalOpen(true);
            }}
            onEditRecommendation={(rec) => {
              setRawRecToEdit(rec);
              setRawRecInitialType(rec.recommendedTreatmentType === 'SPRAYING_FOGGING' ? 'SPRAYING_FOGGING' : 'FUMIGASI');
              setIsRawRecModalOpen(true);
            }}
            onDeleteRecommendation={handleDeleteRawRecommendation}
            onExecuteAsSPK={handleExecuteRecAsSPK}
            onOpenExecutionModal={(rec) => {
              setRecForExecutionModal(rec);
              setIsTreatmentExecutionModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {/* Rekomendasi Terpadu (Semua) */}
        {currentTab === 'raw_material_recommendations' && (
          <RawMaterialRecommendationsView
            recommendations={rawRecommendations}
            currentUser={currentUser}
            onOpenNewModal={(preselectedType) => {
              setRawRecInitialType(preselectedType || 'FUMIGASI');
              setRawRecToEdit(null);
              setIsRawRecModalOpen(true);
            }}
            onEditRecommendation={(rec) => {
              setRawRecToEdit(rec);
              setRawRecInitialType(rec.recommendedTreatmentType === 'SPRAYING_FOGGING' ? 'SPRAYING_FOGGING' : 'FUMIGASI');
              setIsRawRecModalOpen(true);
            }}
            onDeleteRecommendation={handleDeleteRawRecommendation}
            onExecuteAsSPK={handleExecuteRecAsSPK}
            onOpenExecutionModal={(rec) => {
              setRecForExecutionModal(rec);
              setIsTreatmentExecutionModalOpen(true);
            }}
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
            currentUser={currentUser}
            onPrintSuratJalan={(trx) => {
              setActiveSuratJalanTrx(trx);
              setIsSuratJalanOpen(true);
            }}
            onOpenNewOutflow={() => {
              setTrxDefaultItem(null);
              setTrxDefaultType('OUT');
              setIsTrxModalOpen(true);
            }}
            onUpdateOutflow={handleUpdateTransaction}
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

        {/* Dasbor Tambah, Edit, Hapus ID & Password (Hanya Bisa Diakses Akun Admin) */}
        {currentTab === 'admin_users' && currentUser.role === 'ADMIN' && (
          <AdminUsersManagementView
            authUsers={authUsers}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'login_dashboard' && (
          <div className="-mx-4 -my-6 sm:-mx-6">
            <LoginScreen
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
              authUsers={authUsers}
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
        initialJobType={operatorModalInitialJobType}
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
        initialTreatmentType={rawRecInitialType}
        onSaveRecommendation={handleSaveRawRecommendation}
      />

      <TreatmentExecutionModal
        isOpen={isTreatmentExecutionModalOpen}
        onClose={() => {
          setIsTreatmentExecutionModalOpen(false);
          setRecForExecutionModal(null);
        }}
        recommendation={recForExecutionModal}
        items={items}
        currentUser={currentUser}
        onConfirmExecution={handleConfirmTreatmentExecution}
      />
    </div>
  );
}
