import React, { useState, useEffect } from 'react';
import {
  Category,
  HazardClass,
  InventoryItem,
  MasterLocation,
  MasterUnit,
  MasterSupplier,
  SystemSettings,
} from '../types/inventory';
import { X, Plus, ShieldCheck, Flame, Skull, AlertCircle, Edit2, Check } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: InventoryItem) => void;
  existingItem?: InventoryItem | null;
  locations?: MasterLocation[];
  units?: MasterUnit[];
  suppliers?: MasterSupplier[];
  settings?: SystemSettings;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  existingItem,
  locations = [],
  units = [],
  suppliers = [],
  settings,
}) => {
  const [sku, setSku] = useState(existingItem?.sku || '');
  const [name, setName] = useState(existingItem?.name || '');
  const [category, setCategory] = useState<Category>(existingItem?.category || 'BBM');
  const [subCategory, setSubCategory] = useState(existingItem?.subCategory || '');
  const [currentStock, setCurrentStock] = useState(existingItem?.currentStock?.toString() || '0');
  const [unit, setUnit] = useState(existingItem?.unit || 'Liter');
  const [minimumStockThreshold, setMinimumStockThreshold] = useState(
    existingItem?.minimumStockThreshold?.toString() || existingItem?.minStockAlert?.toString() || '10'
  );
  const [location, setLocation] = useState(existingItem?.location || 'Gudang Utama - Rak A1');
  const [pricePerUnit, setPricePerUnit] = useState(existingItem?.pricePerUnit?.toString() || '0');
  const [isFuel, setIsFuel] = useState(existingItem?.isFuel || false);
  const [tankCapacity, setTankCapacity] = useState(existingItem?.tankCapacity?.toString() || '');
  const [hazardClass, setHazardClass] = useState<HazardClass>(existingItem?.hazardClass || 'CAUTION');
  const [activeIngredients, setActiveIngredients] = useState(existingItem?.activeIngredients || '');
  const [targetPest, setTargetPest] = useState(existingItem?.targetPest || '');
  const [dosageRecommendation, setDosageRecommendation] = useState(existingItem?.dosageRecommendation || '');
  const [msdsSummary, setMsdsSummary] = useState(existingItem?.msdsSummary || '');
  const [initialBatchNo, setInitialBatchNo] = useState(
    existingItem?.batches?.[0]?.batchNo || `LOT-${new Date().getFullYear()}-01`
  );
  const [expiredDate, setExpiredDate] = useState(existingItem?.batches?.[0]?.expiredDate || '');

  // Synchronize state when existingItem changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingItem) {
        setSku(existingItem.sku || '');
        setName(existingItem.name || '');
        setCategory(existingItem.category || 'BBM');
        setSubCategory(existingItem.subCategory || '');
        setCurrentStock(existingItem.currentStock !== undefined ? String(existingItem.currentStock) : '0');
        setUnit(existingItem.unit || 'Liter');
        setMinimumStockThreshold(
          existingItem.minimumStockThreshold !== undefined
            ? String(existingItem.minimumStockThreshold)
            : existingItem.minStockAlert !== undefined
            ? String(existingItem.minStockAlert)
            : '10'
        );
        setLocation(existingItem.location || (locations[0]?.name ? `${locations[0].name} (${locations[0].zone})` : 'Gudang Utama - Rak A1'));
        setPricePerUnit(existingItem.pricePerUnit !== undefined ? String(existingItem.pricePerUnit) : '0');
        setIsFuel(existingItem.isFuel || false);
        setTankCapacity(existingItem.tankCapacity !== undefined ? String(existingItem.tankCapacity) : '');
        setHazardClass(existingItem.hazardClass || 'CAUTION');
        setActiveIngredients(existingItem.activeIngredients || '');
        setTargetPest(existingItem.targetPest || '');
        setDosageRecommendation(existingItem.dosageRecommendation || '');
        setMsdsSummary(existingItem.msdsSummary || '');
      } else {
        setSku('');
        setName('');
        setCategory('BBM');
        setSubCategory('');
        setCurrentStock('0');
        setUnit(units[0]?.name || 'Liter');
        setMinimumStockThreshold('10');
        setLocation(locations[0]?.name ? `${locations[0].name} (${locations[0].zone})` : 'Gudang Utama - Rak A1');
        setPricePerUnit('0');
        setIsFuel(true);
        setTankCapacity('');
        setHazardClass('FLAMMABLE');
        setActiveIngredients('');
        setTargetPest('');
        setDosageRecommendation('');
        setMsdsSummary('');
        setInitialBatchNo(`LOT-${new Date().getFullYear()}-01`);
        setExpiredDate('');
      }
    }
  }, [isOpen, existingItem, units, locations]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const stockNum = parseFloat(currentStock) || 0;
    const minThresholdNum = parseFloat(minimumStockThreshold) || 0;
    const priceNum = parseFloat(pricePerUnit) || 0;
    const tankCapNum = tankCapacity ? parseFloat(tankCapacity) : undefined;

    const newItem: InventoryItem = {
      id: existingItem?.id || `item-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      subCategory: subCategory.trim() || 'Umum',
      currentStock: stockNum,
      unit,
      minimumStockThreshold: minThresholdNum,
      minStockAlert: minThresholdNum,
      location: location.trim(),
      pricePerUnit: priceNum,
      isFuel: category === 'BBM' ? isFuel : false,
      tankCapacity: tankCapNum,
      hazardClass,
      activeIngredients: activeIngredients.trim() || undefined,
      targetPest: targetPest.trim() || undefined,
      dosageRecommendation: dosageRecommendation.trim() || undefined,
      msdsSummary: msdsSummary.trim() || undefined,
      batches: existingItem?.batches || [
        {
          id: `b-${Date.now()}`,
          batchNo: initialBatchNo.trim(),
          expiredDate: expiredDate || undefined,
          quantity: stockNum,
          receivedDate: new Date().toISOString().slice(0, 10),
          supplier: 'Pemasok Resmi',
        },
      ],
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onSaveItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            {existingItem ? (
              <Edit2 className="w-5 h-5 text-amber-400" />
            ) : (
              <Plus className="w-5 h-5 text-amber-400" />
            )}
            {existingItem ? 'Ubah Informasi Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Category & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Kategori Utama Inventaris
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as Category;
                  setCategory(val);
                  if (val === 'BBM') {
                    setUnit('Liter');
                    setHazardClass('FLAMMABLE');
                    setIsFuel(true);
                  } else if (val === 'FUMIGASI') {
                    setUnit('Kaleng/Flask (1kg)');
                    setHazardClass('TOXIC');
                    setIsFuel(false);
                  } else if (val === 'SPRAYING_FOGGING') {
                    setUnit('Botol (1L)');
                    setHazardClass('CAUTION');
                    setIsFuel(false);
                  } else {
                    setUnit('Unit/Pcs');
                    setHazardClass('SAFE');
                    setIsFuel(false);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="BBM">BBM & Pelumas Mesin</option>
                <option value="FUMIGASI">Obat & Kimia Fumigasi (HazMat)</option>
                <option value="SPRAYING_FOGGING">Obat Spraying & Fogging</option>
                <option value="PERLENGKAPAN">Perlengkapan, Mesin & APD</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Kode SKU / Barcode Unik
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: BBM-SLR-40, FUM-PHOS-02"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono uppercase text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Name & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Nama Barang / Komoditas Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Solar Industri B35, Quickphos..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Subkategori / Jenis
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="Contoh: Fumigan Tablet, Insektisida ULV..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stock, Unit, Min Alert, Location */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                step="any"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Satuan Ukuran
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {units.length > 0 ? (
                  units.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.symbol})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Liter">Liter</option>
                    <option value="Kaleng/Flask (1kg)">Kaleng/Flask (1kg)</option>
                    <option value="Tabung (50kg)">Tabung (50kg)</option>
                    <option value="Botol (1L)">Botol (1L)</option>
                    <option value="Jerigen (5L)">Jerigen (5L)</option>
                    <option value="Unit/Pcs">Unit/Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Roll/Lembar">Roll/Lembar</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Ambang Batas Min (Threshold)
              </label>
              <input
                type="number"
                step="any"
                required
                value={minimumStockThreshold}
                onChange={(e) => setMinimumStockThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                title="Peringatan restock proaktif akan aktif saat stok jatuh di bawah nilai ini"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Estimasi Harga/Unit
              </label>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="Rp"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Location & Hazard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lokasi Rak / Bunker / Tangki
              </label>
              <input
                type="text"
                required
                list="modal-location-list"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Tangki T-01, Rak Kimia B-2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <datalist id="modal-location-list">
                {locations.map((loc) => (
                  <option key={loc.id} value={`${loc.name} (${loc.zone})`} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Klasifikasi Bahaya K3 (Hazard)
              </label>
              <select
                value={hazardClass}
                onChange={(e) => setHazardClass(e.target.value as HazardClass)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="FLAMMABLE">🔥 Flammable (Mudah Terbakar - Solar/Pertamax)</option>
                <option value="TOXIC">☠️ Toxic (Sangat Beracun - Phosphine/Methyl Bromide)</option>
                <option value="CAUTION">⚠️ Caution (Insektisida Spraying)</option>
                <option value="SAFE">🛡️ Safe (Alat/Peralatan/APD)</option>
              </select>
            </div>
          </div>

          {/* Specific BBM Capacity */}
          {category === 'BBM' && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFuel}
                    onChange={(e) => setIsFuel(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Tampilkan di Dashboard Tangki BBM</span>
                </label>
              </div>
              {isFuel && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kapasitas Maksimal Tangki (Liter)
                  </label>
                  <input
                    type="number"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(e.target.value)}
                    placeholder="Contoh: 5000"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Specific Chemicals Inputs */}
          {(category === 'FUMIGASI' || category === 'SPRAYING_FOGGING') && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Bahan Aktif (Active Ingredients)
                  </label>
                  <input
                    type="text"
                    value={activeIngredients}
                    onChange={(e) => setActiveIngredients(e.target.value)}
                    placeholder="Contoh: Aluminium Phosphide 56%"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dosis Rekomendasi
                  </label>
                  <input
                    type="text"
                    value={dosageRecommendation}
                    onChange={(e) => setDosageRecommendation(e.target.value)}
                    placeholder="Contoh: 3-5 gram/m3"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Hama & Komoditas
                </label>
                <input
                  type="text"
                  value={targetPest}
                  onChange={(e) => setTargetPest(e.target.value)}
                  placeholder="Contoh: Kumbang Beras, Vektor DBD..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Batch & Expiry Date for new item */}
          {!existingItem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nomor Batch Awal
                </label>
                <input
                  type="text"
                  value={initialBatchNo}
                  onChange={(e) => setInitialBatchNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tanggal Kadaluarsa (Expired Date)
                </label>
                <input
                  type="date"
                  value={expiredDate}
                  onChange={(e) => setExpiredDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {existingItem ? 'Simpan Perubahan Barang' : 'Tambahkan ke Inventaris'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
