import { InventoryItem, StockTransaction } from '../types/inventory';

export function exportInventoryToCSV(items: InventoryItem[]): void {
  const headers = [
    'SKU',
    'Nama Barang',
    'Kategori',
    'Subkategori',
    'Stok Saat Ini',
    'Satuan',
    'Ambang Batas Min',
    'Lokasi',
    'Harga Estimasi (Rp)',
    'Nilai Total Aset (Rp)',
    'Bahaya K3',
    'Bahan Aktif',
    'Terakhir Diperbarui',
  ];

  const rows = items.map((item) => [
    `"${item.sku}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    `"${item.subCategory}"`,
    item.currentStock,
    `"${item.unit}"`,
    item.minStockAlert,
    `"${item.location}"`,
    item.pricePerUnit,
    item.currentStock * item.pricePerUnit,
    `"${item.hazardClass}"`,
    `"${(item.activeIngredients || '').replace(/"/g, '""')}"`,
    `"${item.lastUpdated}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `INVENTARIS_GUDANG_BBM_FUMIGASI_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMutationsToCSV(transactions: StockTransaction[]): void {
  const headers = [
    'ID Transaksi',
    'Waktu',
    'Jenis Mutasi',
    'SKU',
    'Nama Barang',
    'Kategori',
    'Jumlah',
    'Satuan',
    'Stok Sebelumnya',
    'Stok Sesudahnya',
    'No Referensi / Surat Jalan',
    'Tujuan Proyek / Lokasi',
    'Petugas / Operator',
    'No Batch / Lot',
    'Catatan',
  ];

  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.timestamp}"`,
    `"${t.type}"`,
    `"${t.sku}"`,
    `"${t.itemName.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.quantity,
    `"${t.unit}"`,
    t.previousStock,
    t.newStock,
    `"${t.referenceNo}"`,
    `"${t.projectOrLocation.replace(/"/g, '""')}"`,
    `"${t.operator.replace(/"/g, '""')}"`,
    `"${t.batchNo || ''}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MUTASI_STOK_LOG_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
