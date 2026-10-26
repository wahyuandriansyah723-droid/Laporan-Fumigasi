import React, { useState } from 'react';
import {
  Category,
  MasterSupplier,
  MasterLocation,
  MasterOperator,
  MasterProjectDestination,
  MasterUnit,
  MasterCategoryConfig,
  MasterChemicalMedicine,
  MasterFuelType,
  MasterEquipmentInventory,
  InventoryItem,
  HazardClass,
} from '../types/inventory';
import { AuthUser } from '../types/auth';
import {
  Building2,
  MapPin,
  Users,
  Target,
  Scale,
  FolderTree,
  Plus,
  Search,
  Edit2,
  Lock,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  Mail,
  ShieldCheck,
  Fuel,
  Skull,
  Wind,
  Shield,
  Layers,
  Info,
  Check,
  AlertTriangle,
  Download,
  Flame,
  Wrench,
  Pill,
} from 'lucide-react';
import { CATEGORY_CONFIGS } from '../data/initialMasterData';
import {
  MedicinesSection,
  FuelsSection,
  EquipmentSection,
} from './MasterCatalogSections';

interface MasterDataViewProps {
  medicines: MasterChemicalMedicine[];
  onSaveMedicine: (medicine: MasterChemicalMedicine) => void;
  onDeleteMedicine: (id: string) => void;

  fuels: MasterFuelType[];
  onSaveFuel: (fuel: MasterFuelType) => void;
  onDeleteFuel: (id: string) => void;

  equipment: MasterEquipmentInventory[];
  onSaveEquipment: (eqp: MasterEquipmentInventory) => void;
  onDeleteEquipment: (id: string) => void;

  suppliers: MasterSupplier[];
  onSaveSupplier: (supplier: MasterSupplier) => void;
  onDeleteSupplier: (id: string) => void;

  locations: MasterLocation[];
  onSaveLocation: (location: MasterLocation) => void;
  onDeleteLocation: (id: string) => void;

  operators: MasterOperator[];
  onSaveOperator: (operator: MasterOperator) => void;
  onDeleteOperator: (id: string) => void;

  destinations: MasterProjectDestination[];
  onSaveDestination: (dest: MasterProjectDestination) => void;
  onDeleteDestination: (id: string) => void;

  units: MasterUnit[];
  onSaveUnit: (unit: MasterUnit) => void;
  onDeleteUnit: (id: string) => void;

  onCreateInventoryFromMaster?: (item: Partial<InventoryItem>) => void;
  items?: InventoryItem[];
  onOpenTransactionModal?: (item: InventoryItem, defaultType?: 'IN' | 'OUT') => void;
  onNavigateToMutations?: (searchQuery?: string) => void;
  currentUser?: AuthUser;
}

type MasterTab =
  | 'medicines'
  | 'fuels'
  | 'equipment'
  | 'suppliers'
  | 'locations'
  | 'operators'
  | 'destinations'
  | 'units'
  | 'categories';

interface DeletingMasterItem {
  tab:
    | 'medicines'
    | 'fuels'
    | 'equipment'
    | 'suppliers'
    | 'locations'
    | 'operators'
    | 'destinations'
    | 'units';
  id: string;
  name: string;
  codeOrRole?: string;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  medicines,
  onSaveMedicine,
  onDeleteMedicine,
  fuels,
  onSaveFuel,
  onDeleteFuel,
  equipment,
  onSaveEquipment,
  onDeleteEquipment,
  suppliers,
  onSaveSupplier,
  onDeleteSupplier,
  locations,
  onSaveLocation,
  onDeleteLocation,
  operators,
  onSaveOperator,
  onDeleteOperator,
  destinations,
  onSaveDestination,
  onDeleteDestination,
  units,
  onSaveUnit,
  onDeleteUnit,
  onCreateInventoryFromMaster,
  items = [],
  onOpenTransactionModal,
  onNavigateToMutations,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('medicines');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states for CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // In-app Delete Confirmation state (replaces browser confirm)
  const [deletingMasterItem, setDeletingMasterItem] = useState<DeletingMasterItem | null>(null);

  const handleConfirmDeleteMaster = () => {
    if (!deletingMasterItem) return;
    const { tab, id } = deletingMasterItem;
    if (tab === 'medicines') {
      onDeleteMedicine(id);
    } else if (tab === 'fuels') {
      onDeleteFuel(id);
    } else if (tab === 'equipment') {
      onDeleteEquipment(id);
    } else if (tab === 'suppliers') {
      onDeleteSupplier(id);
    } else if (tab === 'locations') {
      onDeleteLocation(id);
    } else if (tab === 'operators') {
      onDeleteOperator(id);
    } else if (tab === 'destinations') {
      onDeleteDestination(id);
    } else if (tab === 'units') {
      onDeleteUnit(id);
    }
    setDeletingMasterItem(null);
  };

  // Stats calculation
  const totalMedicines = medicines.length;
  const totalFuels = fuels.length;
  const totalEquipment = equipment.length;
  const totalSuppliers = suppliers.length;
  const totalLocations = locations.length;
  const totalOperators = operators.length;
  const totalDestinations = destinations.length;
  const totalUnits = units.length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FolderTree className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Pusat Manajemen Master Data Gudang
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola data induk jenis obat (fumigasi/fogging), jenis BBM & pelumas, inventaris alat & APD, pemasok vendor, lokasi tangki, petugas K3, dan satuan ukuran.
                </p>
              </div>
            </div>
          </div>

          {currentUser && !currentUser.permissions.canManageMasterData ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700/80">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Katalog Baca Saja (Perlu Hak Admin)</span>
            </div>
          ) : (
            activeTab !== 'categories' && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeTab === 'medicines' && 'Tambah Master Obat Baru'}
                  {activeTab === 'fuels' && 'Tambah Master BBM Baru'}
                  {activeTab === 'equipment' && 'Tambah Master Inventaris Baru'}
                  {activeTab === 'suppliers' && 'Tambah Pemasok Baru'}
                  {activeTab === 'locations' && 'Tambah Lokasi / Tangki'}
                  {activeTab === 'operators' && 'Tambah Petugas / Teknisi'}
                  {activeTab === 'destinations' && 'Tambah Tujuan Proyek'}
                  {activeTab === 'units' && 'Tambah Satuan Ukuran'}
                </span>
              </button>
            )
          )}
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('medicines');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'medicines'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Pill className="w-4 h-4 text-emerald-400" />
            <span>Jenis Obat Fumigasi & Fogging ({totalMedicines})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('fuels');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'fuels'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Jenis BBM & Pelumas ({totalFuels})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('equipment');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'equipment'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wrench className="w-4 h-4 text-sky-400" />
            <span>Inventaris & APD ({totalEquipment})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('suppliers');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'suppliers'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Pemasok / Vendor ({totalSuppliers})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('locations');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'locations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Lokasi, Tangki & Bunker ({totalLocations})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('operators');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'operators'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Petugas & Teknisi K3 ({totalOperators})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('destinations');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'destinations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Tujuan Proyek / Kapal ({totalDestinations})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('units');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'units'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Satuan Ukuran ({totalUnits})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'categories'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kategori Komoditas (4)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content Area */}
      {activeTab !== 'categories' && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Cari kata kunci master ${
                activeTab === 'medicines'
                  ? 'obat...'
                  : activeTab === 'fuels'
                  ? 'bbm...'
                  : activeTab === 'equipment'
                  ? 'inventaris...'
                  : 'data...'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                let headers: string[] = [];
                let rows: string[][] = [];
                const filename = `MASTER-${activeTab.toUpperCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

                if (activeTab === 'medicines') {
                  headers = ['Kode', 'Nama Obat', 'Kategori', 'Tipe', 'Bahan Aktif', 'Hama Sasaran', 'Dosis Rekomendasi', 'Kelas Bahaya', 'No Registrasi', 'Satuan', 'Harga Standar', 'Kemasan', 'Status'];
                  rows = medicines.map(m => [m.code, m.name, m.category, m.medicineType, m.activeIngredient, m.targetPest, m.dosageRecommendation, m.hazardClass, m.registrationNumber, m.defaultUnit, m.standardPrice.toString(), m.packagingSpec, m.status]);
                } else if (activeTab === 'fuels') {
                  headers = ['Kode', 'Nama BBM', 'Kategori', 'Oktan/Cetane', 'Spesifikasi', 'Densitas (kg/L)', 'Titik Nyala', 'Tangki Default', 'Satuan', 'Harga Per Liter', 'Min Alert (L)', 'Status'];
                  rows = fuels.map(f => [f.code, f.name, f.fuelCategory, f.octaneOrCetane, f.specification, f.density.toString(), f.flashPoint, f.defaultTankLocation, f.defaultUnit, f.standardPricePerLiter.toString(), f.minimumAlertThreshold.toString(), f.status]);
                } else if (activeTab === 'equipment') {
                  headers = ['Kode', 'Nama Inventaris', 'Tipe Alat', 'Merk/Model', 'SN/Sertifikat', 'Lokasi Default', 'Satuan', 'Nilai Aset (Rp)', 'Maintenance (Hari)', 'Wajib Kalibrasi', 'Status'];
                  rows = equipment.map(e => [e.code, e.name, e.equipmentType, e.brandModel, e.serialNumberOrCert, e.defaultLocation, e.defaultUnit, e.standardPrice.toString(), e.maintenanceIntervalDays.toString(), e.calibrationRequired ? 'Ya' : 'Tidak', e.status]);
                } else if (activeTab === 'suppliers') {
                  headers = ['Kode', 'Nama Perusahaan', 'Kategori', 'PIC', 'Telepon', 'Email', 'Alamat', 'No Izin', 'Status'];
                  rows = suppliers.map(s => [s.code, s.name, s.category, s.contactPerson, s.phone, s.email, s.address, s.licenseNumber || '-', s.status]);
                } else if (activeTab === 'locations') {
                  headers = ['Kode', 'Nama Lokasi', 'Zona', 'Tipe', 'Kapasitas', 'Izin B3', 'Status'];
                  rows = locations.map(l => [l.code, l.name, l.zone, l.type, l.capacity || '-', l.hazmatApproved ? 'Ya' : 'Tidak', l.status]);
                } else if (activeTab === 'operators') {
                  headers = ['NIP', 'Nama Petugas', 'Peran/Role', 'Telepon', 'Sertifikat/Izin', 'Status'];
                  rows = operators.map(o => [o.nip, o.name, o.role, o.phone, o.licenseNo || '-', o.status]);
                } else if (activeTab === 'destinations') {
                  headers = ['Kode', 'Nama Proyek', 'Klien', 'Lokasi/Dermaga', 'Tipe Aktivitas', 'Status'];
                  rows = destinations.map(d => [d.code, d.name, d.clientName, d.locationAddress, d.activityType, d.status]);
                } else if (activeTab === 'units') {
                  headers = ['Nama Satuan', 'Simbol', 'Klasifikasi', 'Keterangan'];
                  rows = units.map(u => [u.name, u.symbol, u.category, u.description || '-']);
                }

                if (rows.length === 0) return;
                const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors font-medium"
              title="Unduh data induk tab aktif dalam format spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Ekspor CSV</span>
            </button>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Data Terverifikasi
            </span>
          </div>
        </div>
      )}

      {/* ================= 1. TAB: MASTER OBAT ================= */}
      {activeTab === 'medicines' && (
        <MedicinesSection
          medicines={medicines}
          searchQuery={searchQuery}
          onEdit={handleOpenEdit}
          onDelete={(id, name, code) =>
            setDeletingMasterItem({ tab: 'medicines', id, name, codeOrRole: code })
          }
          onCreateInventory={onCreateInventoryFromMaster}
          items={items}
          onOpenTransactionModal={onOpenTransactionModal}
          onNavigateToMutations={onNavigateToMutations}
        />
      )}

      {/* ================= 2. TAB: MASTER BBM & PELUMAS ================= */}
      {activeTab === 'fuels' && (
        <FuelsSection
          fuels={fuels}
          searchQuery={searchQuery}
          onEdit={handleOpenEdit}
          onDelete={(id, name, code) =>
            setDeletingMasterItem({ tab: 'fuels', id, name, codeOrRole: code })
          }
          onCreateInventory={onCreateInventoryFromMaster}
          items={items}
          onOpenTransactionModal={onOpenTransactionModal}
          onNavigateToMutations={onNavigateToMutations}
        />
      )}

      {/* ================= 3. TAB: MASTER INVENTARIS ================= */}
      {activeTab === 'equipment' && (
        <EquipmentSection
          equipment={equipment}
          searchQuery={searchQuery}
          onEdit={handleOpenEdit}
          onDelete={(id, name, code) =>
            setDeletingMasterItem({ tab: 'equipment', id, name, codeOrRole: code })
          }
          onCreateInventory={onCreateInventoryFromMaster}
          items={items}
          onOpenTransactionModal={onOpenTransactionModal}
          onNavigateToMutations={onNavigateToMutations}
        />
      )}

      {/* ================= 1. TAB: SUPPLIERS ================= */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers
            .filter((s) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                s.name.toLowerCase().includes(q) ||
                s.code.toLowerCase().includes(q) ||
                s.contactPerson.toLowerCase().includes(q) ||
                s.address.toLowerCase().includes(q)
              );
            })
            .map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-amber-400">{s.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-1" title={s.name}>
                    {s.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Kategori: <strong className="text-slate-300">{s.category}</strong>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-slate-500 shrink-0">PIC:</span>
                      <span className="font-semibold">{s.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400 text-[11px] pt-1 border-t border-slate-800/50">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.address}</span>
                    </div>
                    {s.licenseNumber && (
                      <div className="text-[10px] font-mono text-amber-400/80 bg-slate-950 p-1.5 rounded border border-slate-800 mt-2 truncate">
                        Izin: {s.licenseNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 shadow-sm"
                    title="Ubah Data Pemasok"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingMasterItem({
                        tab: 'suppliers',
                        id: s.id,
                        name: s.name,
                        codeOrRole: s.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-900/50 shadow-sm"
                    title="Hapus Data Pemasok"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ================= 2. TAB: LOCATIONS ================= */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations
            .filter((l) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                l.name.toLowerCase().includes(q) ||
                l.code.toLowerCase().includes(q) ||
                l.zone.toLowerCase().includes(q)
              );
            })
            .map((loc) => (
              <div
                key={loc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-amber-400">{loc.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        loc.hazmatApproved
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {loc.hazmatApproved ? 'IZIN B3 / HAZMAT' : 'REGULER'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-1" title={loc.name}>
                    {loc.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Zona: <strong className="text-slate-300">{loc.zone}</strong>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Tipe Penyimpanan:</span>
                      <span className="text-slate-300 font-semibold">{loc.type}</span>
                    </div>
                    {loc.capacity && (
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Kapasitas Maksimal:</span>
                        <span className="text-amber-400 font-semibold">{loc.capacity}</span>
                      </div>
                    )}
                    {loc.notes && (
                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 leading-relaxed">
                        {loc.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(loc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 shadow-sm"
                    title="Ubah Data Lokasi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingMasterItem({
                        tab: 'locations',
                        id: loc.id,
                        name: loc.name,
                        codeOrRole: loc.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-900/50 shadow-sm"
                    title="Hapus Data Lokasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ================= 3. TAB: OPERATORS ================= */}
      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators
            .filter((o) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                o.name.toLowerCase().includes(q) ||
                o.nip.toLowerCase().includes(q) ||
                o.role.toLowerCase().includes(q)
              );
            })
            .map((op) => (
              <div
                key={op.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-slate-400">{op.nip}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        op.role === 'FUMIGATOR'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : op.role === 'HSE_OFFICER'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {op.role}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm" title={op.name}>
                    {op.name}
                  </h3>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{op.phone}</span>
                    </div>

                    {op.licenseNo ? (
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Sertifikasi Lisensi:
                        </span>
                        <div className="text-[11px] font-mono text-slate-200 mt-0.5 truncate">
                          {op.licenseNo}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">Tanpa lisensi khusus B3</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(op)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 shadow-sm"
                    title="Ubah Data Petugas"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingMasterItem({
                        tab: 'operators',
                        id: op.id,
                        name: op.name,
                        codeOrRole: op.nip,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-900/50 shadow-sm"
                    title="Hapus Data Petugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ================= 4. TAB: DESTINATIONS ================= */}
      {activeTab === 'destinations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations
            .filter((d) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                d.name.toLowerCase().includes(q) ||
                d.code.toLowerCase().includes(q) ||
                d.clientName.toLowerCase().includes(q)
              );
            })
            .map((dest) => (
              <div
                key={dest.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-amber-400">{dest.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {dest.activityType}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm" title={dest.name}>
                    {dest.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Klien / Penerima: <strong className="text-slate-300">{dest.clientName}</strong>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{dest.locationAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 shadow-sm"
                    title="Ubah Data Tujuan Proyek"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingMasterItem({
                        tab: 'destinations',
                        id: dest.id,
                        name: dest.name,
                        codeOrRole: dest.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-900/50 shadow-sm"
                    title="Hapus Data Tujuan Proyek"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ================= 5. TAB: UNITS ================= */}
      {activeTab === 'units' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Satuan Ukuran</th>
                <th className="py-3 px-3">Simbol</th>
                <th className="py-3 px-3">Dimensi / Tipe</th>
                <th className="py-3 px-4">Keterangan / Penggunaan Standar</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{u.symbol}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">
                      {u.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{u.description || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 shadow-sm"
                        title="Ubah Satuan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingMasterItem({
                            tab: 'units',
                            id: u.id,
                            name: u.name,
                            codeOrRole: u.symbol,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors border border-rose-900/50 shadow-sm"
                        title="Hapus Satuan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 6. TAB: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORY_CONFIGS.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {cat.id === 'BBM' && <Fuel className="w-5 h-5" />}
                    {cat.id === 'FUMIGASI' && <Skull className="w-5 h-5" />}
                    {cat.id === 'SPRAYING_FOGGING' && <Wind className="w-5 h-5" />}
                    {cat.id === 'PERLENGKAPAN' && <Shield className="w-5 h-5" />}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">Kode: {cat.id}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    cat.defaultHazard === 'TOXIC'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : cat.defaultHazard === 'FLAMMABLE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {cat.defaultHazard}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{cat.description}</p>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase">
                  Daftar Subkategori:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.subCategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT DIALOG ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {editingItem ? (
                  <Edit2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <Plus className="w-4 h-4 text-amber-400" />
                )}
                {editingItem ? 'Ubah Data Induk' : 'Tambah Data Induk Baru'} (
                {activeTab === 'medicines'
                  ? 'Master Jenis Obat'
                  : activeTab === 'fuels'
                  ? 'Master Jenis BBM & Pelumas'
                  : activeTab === 'equipment'
                  ? 'Master Inventaris & APD'
                  : activeTab === 'suppliers'
                  ? 'Pemasok'
                  : activeTab === 'locations'
                  ? 'Lokasi / Tangki'
                  : activeTab === 'operators'
                  ? 'Petugas / Teknisi'
                  : activeTab === 'destinations'
                  ? 'Tujuan Proyek'
                  : 'Satuan Ukuran'}
                )
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={`${activeTab}-${editingItem ? editingItem.id : 'new'}`}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                if (activeTab === 'medicines') {
                  const medData: MasterChemicalMedicine = {
                    id: editingItem?.id || `med-${Date.now()}`,
                    code: (formData.get('code') as string) || `OBT-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    category: (formData.get('category') as any) || 'FUMIGASI',
                    medicineType: (formData.get('medicineType') as any) || 'TABLET_PH3',
                    activeIngredient: formData.get('activeIngredient') as string,
                    targetPest: formData.get('targetPest') as string,
                    dosageRecommendation: formData.get('dosageRecommendation') as string,
                    hazardClass: (formData.get('hazardClass') as HazardClass) || 'TOXIC',
                    registrationNumber: formData.get('registrationNumber') as string,
                    defaultUnit: formData.get('defaultUnit') as string || 'Flask',
                    standardPrice: Number(formData.get('standardPrice')) || 0,
                    packagingSpec: formData.get('packagingSpec') as string,
                    storageRequirement: (formData.get('storageRequirement') as string) || undefined,
                    status: (formData.get('status') as any) || 'ACTIVE',
                    notes: (formData.get('notes') as string) || undefined,
                  };
                  onSaveMedicine(medData);
                } else if (activeTab === 'fuels') {
                  const fuelData: MasterFuelType = {
                    id: editingItem?.id || `fuel-${Date.now()}`,
                    code: (formData.get('code') as string) || `BBM-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    fuelCategory: (formData.get('fuelCategory') as any) || 'SOLAR_DIESEL',
                    specification: formData.get('specification') as string,
                    octaneOrCetane: formData.get('octaneOrCetane') as string,
                    density: Number(formData.get('density')) || 0.84,
                    flashPoint: formData.get('flashPoint') as string,
                    defaultTankLocation: formData.get('defaultTankLocation') as string,
                    defaultUnit: formData.get('defaultUnit') as string || 'Liter',
                    standardPricePerLiter: Number(formData.get('standardPricePerLiter')) || 0,
                    minimumAlertThreshold: Number(formData.get('minimumAlertThreshold')) || 500,
                    status: (formData.get('status') as any) || 'ACTIVE',
                    notes: (formData.get('notes') as string) || undefined,
                  };
                  onSaveFuel(fuelData);
                } else if (activeTab === 'equipment') {
                  const eqpData: MasterEquipmentInventory = {
                    id: editingItem?.id || `eqp-${Date.now()}`,
                    code: (formData.get('code') as string) || `EQP-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    equipmentType: (formData.get('equipmentType') as any) || 'MESIN_FOGGER',
                    brandModel: formData.get('brandModel') as string,
                    serialNumberOrCert: formData.get('serialNumberOrCert') as string,
                    defaultLocation: formData.get('defaultLocation') as string,
                    defaultUnit: formData.get('defaultUnit') as string || 'Unit',
                    standardPrice: Number(formData.get('standardPrice')) || 0,
                    maintenanceIntervalDays: Number(formData.get('maintenanceIntervalDays')) || 30,
                    calibrationRequired:
                      formData.get('calibrationRequired') === 'true' ||
                      formData.get('calibrationRequired') === 'on',
                    standardLifespanMonths: Number(formData.get('standardLifespanMonths')) || 36,
                    status: (formData.get('status') as any) || 'ACTIVE',
                    notes: (formData.get('notes') as string) || undefined,
                  };
                  onSaveEquipment(eqpData);
                } else if (activeTab === 'suppliers') {
                  const supData: MasterSupplier = {
                    id: editingItem?.id || `sup-${Date.now()}`,
                    code: (formData.get('code') as string) || `SUP-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    category: (formData.get('category') as Category) || 'BBM',
                    contactPerson: formData.get('contactPerson') as string,
                    phone: formData.get('phone') as string,
                    email: formData.get('email') as string,
                    address: formData.get('address') as string,
                    licenseNumber: (formData.get('licenseNumber') as string) || undefined,
                    status: (formData.get('status') as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
                  };
                  onSaveSupplier(supData);
                } else if (activeTab === 'locations') {
                  const locData: MasterLocation = {
                    id: editingItem?.id || `loc-${Date.now()}`,
                    code: (formData.get('code') as string) || `LOK-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    zone: formData.get('zone') as string,
                    type: (formData.get('type') as any) || 'RACK',
                    capacity: (formData.get('capacity') as string) || undefined,
                    hazmatApproved:
                      formData.get('hazmatApproved') === 'true' ||
                      formData.get('hazmatApproved') === 'on',
                    status: 'ACTIVE',
                    notes: (formData.get('notes') as string) || undefined,
                  };
                  onSaveLocation(locData);
                } else if (activeTab === 'operators') {
                  const opData: MasterOperator = {
                    id: editingItem?.id || `op-${Date.now()}`,
                    nip: (formData.get('nip') as string) || `NIP-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    role: (formData.get('role') as any) || 'GUDANG',
                    phone: formData.get('phone') as string,
                    licenseNo: (formData.get('licenseNo') as string) || undefined,
                    status: 'ACTIVE',
                  };
                  onSaveOperator(opData);
                } else if (activeTab === 'destinations') {
                  const destData: MasterProjectDestination = {
                    id: editingItem?.id || `dest-${Date.now()}`,
                    code: (formData.get('code') as string) || `PRJ-${Date.now().toString().slice(-4)}`,
                    name: formData.get('name') as string,
                    clientName: formData.get('clientName') as string,
                    locationAddress: formData.get('locationAddress') as string,
                    activityType: (formData.get('activityType') as any) || 'UMUM',
                    status: 'ACTIVE',
                  };
                  onSaveDestination(destData);
                } else if (activeTab === 'units') {
                  const unitData: MasterUnit = {
                    id: editingItem?.id || `unit-${Date.now()}`,
                    name: formData.get('name') as string,
                    symbol: formData.get('symbol') as string,
                    category: (formData.get('category') as any) || 'VOLUME',
                    description: (formData.get('description') as string) || undefined,
                  };
                  onSaveUnit(unitData);
                }

                setIsModalOpen(false);
                setEditingItem(null);
              }}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* ================= Master Medicine Form ================= */}
              {activeTab === 'medicines' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Master Obat</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: OBT-PH3-01"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Obat Kimia / Merek Dagang</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingItem?.name || ''}
                        placeholder="Contoh: Quickphos 56 TB"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kategori Perlakuan</label>
                      <select
                        name="category"
                        defaultValue={editingItem?.category || 'FUMIGASI'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="FUMIGASI">Fumigasi Karantina / Kapal</option>
                        <option value="SPRAYING_FOGGING">Spraying & Fogging Nyamuk / Hama</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Formulasi / Tipe Obat</label>
                      <select
                        name="medicineType"
                        defaultValue={editingItem?.medicineType || 'TABLET_PH3'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="TABLET_PH3">Tablet / Pellets Fosfin (PH3)</option>
                        <option value="GAS_CYLINDER">Gas Silinder Bertekanan</option>
                        <option value="THERMAL_FOGGING">Konsentrat Fogging Panas</option>
                        <option value="COLD_ULV">Konsentrat ULV Dingin</option>
                        <option value="LARVASIDA">Larvasida Granul / Cair</option>
                        <option value="RODENTISIDA">Rodentisida Umpan Tikus</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Bahan Aktif & Kadar</label>
                      <input
                        type="text"
                        name="activeIngredient"
                        defaultValue={editingItem?.activeIngredient || ''}
                        placeholder="Contoh: Aluminium Phosphide 56%"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Hama Sasaran Utama</label>
                      <input
                        type="text"
                        name="targetPest"
                        defaultValue={editingItem?.targetPest || ''}
                        placeholder="Contoh: Tribolium castaneum, Sitophilus oryzae"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Dosis Rekomendasi Standar</label>
                      <input
                        type="text"
                        name="dosageRecommendation"
                        defaultValue={editingItem?.dosageRecommendation || ''}
                        placeholder="Contoh: 2 - 3 tablet / m³ komoditas"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Kelas Bahaya K3 (GHS Hazard)</label>
                      <select
                        name="hazardClass"
                        defaultValue={editingItem?.hazardClass || 'TOXIC'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="TOXIC">TOXIC (Beracun Ekstrem / Gas B3)</option>
                        <option value="CAUTION">CAUTION (Perhatian / Iritasi Sedang)</option>
                        <option value="FLAMMABLE">FLAMMABLE (Mudah Menyala / Terbakar)</option>
                        <option value="CORROSIVE">CORROSIVE (Korosif)</option>
                        <option value="SAFE">SAFE (Umum / Non-Hazard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nomor Registrasi Kementan / RI</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        defaultValue={editingItem?.registrationNumber || ''}
                        placeholder="Contoh: RI.01080120031892"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Satuan Ukuran Default</label>
                      <input
                        type="text"
                        name="defaultUnit"
                        defaultValue={editingItem?.defaultUnit || 'Flask'}
                        placeholder="Contoh: Flask, Liter, Kg, Tabung"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Harga Acuan Standar (Rp)</label>
                      <input
                        type="number"
                        name="standardPrice"
                        defaultValue={editingItem?.standardPrice ?? 285000}
                        required
                        min="0"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Spesifikasi Kemasan Pabrik</label>
                      <input
                        type="text"
                        name="packagingSpec"
                        defaultValue={editingItem?.packagingSpec || ''}
                        placeholder="Contoh: Aluminium Flask 1 Kg (333 Butir)"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Persyaratan Khusus Ruang Penyimpanan</label>
                    <input
                      type="text"
                      name="storageRequirement"
                      defaultValue={editingItem?.storageRequirement || ''}
                      placeholder="Contoh: Bunker B3 Karantina, Kedap Udara, Suhu < 30°C"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Status Operasional</label>
                      <select
                        name="status"
                        defaultValue={editingItem?.status || 'ACTIVE'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="ACTIVE">Aktif Digunakan</option>
                        <option value="INACTIVE">Nonaktif / Terbatas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Catatan Tambahan Teknis</label>
                      <input
                        type="text"
                        name="notes"
                        defaultValue={editingItem?.notes || ''}
                        placeholder="Opsional"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ================= Master BBM & Pelumas Form ================= */}
              {activeTab === 'fuels' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Master BBM</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: BBM-SLR-B35"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Bahan Bakar / Pelumas</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingItem?.name || ''}
                        placeholder="Contoh: Solar B35 Industri"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kategori Bahan Bakar</label>
                      <select
                        name="fuelCategory"
                        defaultValue={editingItem?.fuelCategory || 'SOLAR_DIESEL'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="SOLAR_DIESEL">Solar / Biosolar Industri</option>
                        <option value="BENSIN_GASOLINE">Bensin (Pertalite / Pertamax)</option>
                        <option value="PELUMAS_OLI">Pelumas / Oli Mesin Fogger</option>
                        <option value="PELARUT_SOLVENT">Solvent / Minyak Pelarut</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nilai Oktan / Cetane / SAE</label>
                      <input
                        type="text"
                        name="octaneOrCetane"
                        defaultValue={editingItem?.octaneOrCetane || ''}
                        placeholder="Contoh: CN 51, RON 92, SAE 20W-50"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Spesifikasi Standar Mutu</label>
                      <input
                        type="text"
                        name="specification"
                        defaultValue={editingItem?.specification || ''}
                        placeholder="Contoh: Standar Dirjen Migas / FAME 35%"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Titik Nyala (Flash Point)</label>
                      <input
                        type="text"
                        name="flashPoint"
                        defaultValue={editingItem?.flashPoint || ''}
                        placeholder="Contoh: > 52°C, > 21°C"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Massa Jenis / Densitas (kg/L)</label>
                      <input
                        type="number"
                        step="0.001"
                        name="density"
                        defaultValue={editingItem?.density ?? 0.84}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tangki / Bunker Standar</label>
                      <input
                        type="text"
                        name="defaultTankLocation"
                        defaultValue={editingItem?.defaultTankLocation || 'Tangki Utama T-01'}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Satuan Ukuran</label>
                      <input
                        type="text"
                        name="defaultUnit"
                        defaultValue={editingItem?.defaultUnit || 'Liter'}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Harga Standar per Satuan (Rp)</label>
                      <input
                        type="number"
                        name="standardPricePerLiter"
                        defaultValue={editingItem?.standardPricePerLiter ?? 18500}
                        required
                        min="0"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Ambang Peringatan Kritis (Liter)</label>
                      <input
                        type="number"
                        name="minimumAlertThreshold"
                        defaultValue={editingItem?.minimumAlertThreshold ?? 1000}
                        required
                        min="0"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Status Operasional</label>
                      <select
                        name="status"
                        defaultValue={editingItem?.status || 'ACTIVE'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="ACTIVE">Aktif Disuplai & Didistribusikan</option>
                        <option value="INACTIVE">Nonaktif / Terkunci</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Catatan Mutu / Spesifikasi Tangki</label>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={editingItem?.notes || ''}
                      placeholder="Opsional: misal kalibrasi flowmeter atau jadwal pembersihan tangki"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                </>
              )}

              {/* ================= Master Inventaris & APD Form ================= */}
              {activeTab === 'equipment' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Master Inventaris</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: EQP-FOG-01"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Inventaris / Alat Operasional</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingItem?.name || ''}
                        placeholder="Contoh: Mesin Thermal Fogger Swingfog SN-50"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Tipe / Kelompok Peralatan</label>
                      <select
                        name="equipmentType"
                        defaultValue={editingItem?.equipmentType || 'MESIN_FOGGER'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="MESIN_FOGGER">Mesin Fogger Thermal / ULV</option>
                        <option value="BLOWER_AERASI">Blower & Fan Aerasi Palka</option>
                        <option value="DETEKTOR_GAS">Detektor Gas PH3 / Multigas K3</option>
                        <option value="APD_SAFETY">APD Khusus (SCBA, Masker Full Face, Hazmat)</option>
                        <option value="TERPAL_FUMIGASI">Terpal Fumigasi Gas-Tight & Sand Snake</option>
                        <option value="ALAT_SAMPLING">Alat Sampling & Pipet Pengujian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Merk & Model / Seri</label>
                      <input
                        type="text"
                        name="brandModel"
                        defaultValue={editingItem?.brandModel || ''}
                        placeholder="Contoh: Swingtec Germany / SN-50 PE"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nomor Seri / Sertifikasi Standar</label>
                      <input
                        type="text"
                        name="serialNumberOrCert"
                        defaultValue={editingItem?.serialNumberOrCert || ''}
                        placeholder="Contoh: SN-DE-88291 · CE Mark / EN 136"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Lokasi Penyimpanan Standar</label>
                      <input
                        type="text"
                        name="defaultLocation"
                        defaultValue={editingItem?.defaultLocation || 'Rak Workshop Utama'}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Satuan</label>
                      <input
                        type="text"
                        name="defaultUnit"
                        defaultValue={editingItem?.defaultUnit || 'Unit'}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Estimasi Nilai Aset / Unit (Rp)</label>
                      <input
                        type="number"
                        name="standardPrice"
                        defaultValue={editingItem?.standardPrice ?? 32500000}
                        required
                        min="0"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Interval Pemeliharaan Rutin (Hari)</label>
                      <input
                        type="number"
                        name="maintenanceIntervalDays"
                        defaultValue={editingItem?.maintenanceIntervalDays ?? 30}
                        required
                        min="1"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Masa Pakai Standar (Bulan)</label>
                      <input
                        type="number"
                        name="standardLifespanMonths"
                        defaultValue={editingItem?.standardLifespanMonths ?? 60}
                        required
                        min="1"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      id="calibrationRequired"
                      name="calibrationRequired"
                      defaultChecked={editingItem ? !!editingItem.calibrationRequired : true}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="calibrationRequired" className="text-slate-300 font-semibold cursor-pointer">
                      Wajib Kalibrasi / Sertifikasi Uji Berkala oleh Lab K3
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Status Operasional Aset</label>
                      <select
                        name="status"
                        defaultValue={editingItem?.status || 'ACTIVE'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="ACTIVE">Aktif & Siap Operasi</option>
                        <option value="MAINTENANCE">Dalam Servis / Perbaikan</option>
                        <option value="INACTIVE">Afkir / Non-Operasional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Catatan Tambahan & Riwayat Servis</label>
                      <input
                        type="text"
                        name="notes"
                        defaultValue={editingItem?.notes || ''}
                        placeholder="Opsional: riwayat kalibrasi atau kelengkapan box"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Supplier Form Fields */}
              {activeTab === 'suppliers' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Pemasok</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: SUP-PTM-01"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Kategori Pasokan</label>
                      <select
                        name="category"
                        defaultValue={editingItem?.category || 'BBM'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="BBM">BBM & Pelumas</option>
                        <option value="FUMIGASI">Obat Fumigasi (HazMat)</option>
                        <option value="SPRAYING_FOGGING">Obat Spraying & Fogging</option>
                        <option value="PERLENGKAPAN">Perlengkapan & APD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Perusahaan Pemasok / Vendor</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name || ''}
                      placeholder="Contoh: PT Pertamina Patra Niaga"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nama PIC Kontak</label>
                      <input
                        type="text"
                        name="contactPerson"
                        defaultValue={editingItem?.contactPerson || ''}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nomor Telepon / WhatsApp</label>
                      <input
                        type="text"
                        name="phone"
                        defaultValue={editingItem?.phone || ''}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Alamat Email Resmi</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingItem?.email || ''}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Alamat Lengkap Kantor / Depo</label>
                    <textarea
                      name="address"
                      defaultValue={editingItem?.address || ''}
                      rows={2}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nomor Izin Edar / Kementan</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        defaultValue={editingItem?.licenseNumber || ''}
                        placeholder="Opsional"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Status Kemitraan</label>
                      <select
                        name="status"
                        defaultValue={editingItem?.status || 'ACTIVE'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="ACTIVE">ACTIVE (Aktif)</option>
                        <option value="INACTIVE">INACTIVE (Nonaktif)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Location Form Fields */}
              {activeTab === 'locations' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Lokasi</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: LOK-TNK-01"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tipe Penyimpanan</label>
                      <select
                        name="type"
                        defaultValue={editingItem?.type || 'RACK'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="TANK">Tangki Pendam / Tank Yard</option>
                        <option value="BUNKER">Bunker B3 Beracun (Karantina)</option>
                        <option value="DRUM_STATION">Stasiun Drum Terlindung</option>
                        <option value="RACK">Rak Penyimpanan Standard</option>
                        <option value="GENERAL">Area Terbuka / Gudang Umum</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Lokasi / Nama Tangki</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name || ''}
                      placeholder="Contoh: Tangki Utama T-01 (Solar Industri)"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Zona / Area Gudang</label>
                      <input
                        type="text"
                        name="zone"
                        defaultValue={editingItem?.zone || ''}
                        placeholder="Contoh: Yard Barat / Lantai 1"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Kapasitas Maksimal</label>
                      <input
                        type="text"
                        name="capacity"
                        defaultValue={editingItem?.capacity || ''}
                        placeholder="Contoh: 5.000 Liter / 150 Box"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      id="hazmatApproved"
                      name="hazmatApproved"
                      value="true"
                      defaultChecked={editingItem?.hazmatApproved || false}
                      className="rounded border-slate-700 text-amber-500"
                    />
                    <label htmlFor="hazmatApproved" className="text-slate-300 font-medium cursor-pointer">
                      Lokasi ini telah teruji & disetujui untuk penyimpanan Kimia HazMat B3 (K3/Barantan)
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Catatan Keamanan & SOP Lokasi</label>
                    <textarea
                      name="notes"
                      defaultValue={editingItem?.notes || ''}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                </>
              )}

              {/* Operator Form Fields */}
              {activeTab === 'operators' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">NIP / ID Petugas</label>
                      <input
                        type="text"
                        name="nip"
                        defaultValue={editingItem?.nip || ''}
                        placeholder="Contoh: NIP-2024-001"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Peran / Jabatan Teknisi</label>
                      <select
                        name="role"
                        defaultValue={editingItem?.role || 'GUDANG'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="GUDANG">Petugas Gudang / BBM</option>
                        <option value="FUMIGATOR">Fumigator Bersertifikat</option>
                        <option value="SPRAYER">Teknisi Spraying & Fogging</option>
                        <option value="HSE_OFFICER">HSE / Petugas K3 B3</option>
                        <option value="MANAGER">Kepala Gudang / Manajer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name || ''}
                      placeholder="Contoh: Ahmad Fauzi, S.T."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nomor Handphone / WhatsApp</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={editingItem?.phone || ''}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nomor Registrasi Lisensi K3 / Barantan</label>
                    <input
                      type="text"
                      name="licenseNo"
                      defaultValue={editingItem?.licenseNo || ''}
                      placeholder="Contoh: BARANTAN-FUM-REG-042/2023"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </>
              )}

              {/* Destination Form Fields */}
              {activeTab === 'destinations' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Kode Proyek</label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingItem?.code || ''}
                        placeholder="Contoh: PRJ-VESSEL-01"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Jenis Aktivitas</label>
                      <select
                        name="activityType"
                        defaultValue={editingItem?.activityType || 'FUMIGASI_KAPAL'}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      >
                        <option value="FUMIGASI_KAPAL">Fumigasi Kapal / Vessel</option>
                        <option value="FUMIGASI_GUDANG">Fumigasi Gudang / Silo</option>
                        <option value="SPRAYING_FOGGING">Spraying & Fogging Vektor</option>
                        <option value="BBM_ARMADA">Pasokan BBM Armada / Genset</option>
                        <option value="UMUM">Umum / Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Proyek / Kapal / Fasilitas</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingItem?.name || ''}
                      placeholder="Contoh: Kapal MV Samudera Perkasa 01"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nama Klien / Pemilik Proyek</label>
                    <input
                      type="text"
                      name="clientName"
                      defaultValue={editingItem?.clientName || ''}
                      placeholder="Contoh: PT Pelayaran Samudera Jaya"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Alamat Lokasi Pengerjaan / Dermaga</label>
                    <textarea
                      name="locationAddress"
                      defaultValue={editingItem?.locationAddress || ''}
                      rows={2}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                </>
              )}

              {/* Unit Form Fields */}
              {activeTab === 'units' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Nama Satuan</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingItem?.name || ''}
                        placeholder="Contoh: Kaleng / Flask"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Simbol Singkat</label>
                      <input
                        type="text"
                        name="symbol"
                        defaultValue={editingItem?.symbol || ''}
                        placeholder="Contoh: Flask, L, Kg"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Klasifikasi Ukuran</label>
                    <select
                      name="category"
                      defaultValue={editingItem?.category || 'PACKAGE'}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    >
                      <option value="VOLUME">Volume Cairan (Liter, Gallon)</option>
                      <option value="WEIGHT">Berat Massa (Kg, Gram)</option>
                      <option value="PACKAGE">Kemasan Khusus (Flask, Drum, Tabung)</option>
                      <option value="QUANTITY">Kuantitas / Jumlah (Pcs, Set, Roll)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Keterangan / Penggunaan Standar</label>
                    <input
                      type="text"
                      name="description"
                      defaultValue={editingItem?.description || ''}
                      placeholder="Contoh: Digunakan untuk kemasan kedap gas PH3"
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data Induk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-APP DELETE CONFIRMATION ================= */}
      {deletingMasterItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-900/60 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-2.5 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              Konfirmasi Hapus Data Induk
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data{' '}
                <strong className="text-amber-400">
                  {deletingMasterItem.tab === 'medicines'
                    ? 'Master Jenis Obat'
                    : deletingMasterItem.tab === 'fuels'
                    ? 'Master Jenis BBM'
                    : deletingMasterItem.tab === 'equipment'
                    ? 'Master Inventaris & APD'
                    : deletingMasterItem.tab === 'suppliers'
                    ? 'Pemasok'
                    : deletingMasterItem.tab === 'locations'
                    ? 'Lokasi / Tangki'
                    : deletingMasterItem.tab === 'operators'
                    ? 'Petugas / Teknisi'
                    : deletingMasterItem.tab === 'destinations'
                    ? 'Tujuan Proyek'
                    : 'Satuan Ukuran'}
                </strong>{' '}
                berikut?
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="text-sm font-bold text-white">{deletingMasterItem.name}</div>
                {deletingMasterItem.codeOrRole && (
                  <div className="text-[11px] font-mono text-amber-400">
                    Kode / ID: {deletingMasterItem.codeOrRole}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Tindakan ini akan menghapus data dari daftar master data gudang secara permanen.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingMasterItem(null)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMaster}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-colors shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
