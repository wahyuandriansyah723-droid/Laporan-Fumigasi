import React from 'react';
import { StockTransaction, InventoryItem, SystemSettings } from '../types/inventory';
import { Printer, X, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { formatDateTimeIndo, formatNumberID } from '../utils/formatters';

interface SuratJalanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: StockTransaction | null;
  itemDetails?: InventoryItem | null;
  settings?: SystemSettings;
}

export const SuratJalanPrintModal: React.FC<SuratJalanPrintModalProps> = ({
  isOpen,
  onClose,
  transaction,
  itemDetails,
  settings,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = settings?.companyName || 'PT LOGIX WAREHOUSE SOLUSI INDONESIA';
  const companyAddress = settings?.companyAddress || 'Kawasan Pergudangan Logistik Blok A-8, Jakarta Utara';
  const warehouseManager = settings?.warehouseManager || 'Sutrisno';
  const hseOfficer = settings?.hseOfficer || 'Dian Pratama, S.K.M.';
  const footerNote = settings?.notesFooterSuratJalan || 'Bahan bakar dan pestisida/fumigan wajib ditangani oleh teknisi bersertifikat K3 / Fumigator Berlisensi.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Modal Toolbar (hidden during print) */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileText className="w-4 h-4 text-amber-400" />
            Pratinjau Dokumen Cetak Surat Jalan / Bukti Pengeluaran
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen (Print)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 bg-white text-slate-900 font-sans print-card min-h-[550px]">
          {/* Company Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  {companyName}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Divisi Manajemen Gudang, Bahan Bakar & Pengendalian Hama (Pest & Fumigation)
                </p>
                <p className="text-[11px] text-slate-500">
                  {companyAddress}
                </p>
                {settings?.licenseNumber && (
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    No. Izin / Registrasi: {settings.licenseNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="inline-block border border-slate-800 px-3 py-1 font-mono text-xs font-bold uppercase bg-slate-100 text-slate-900">
                  {transaction.type === 'OUT'
                    ? 'SURAT BUKTI PENGELUARAN'
                    : transaction.type === 'IN'
                    ? 'SURAT BUKTI PENERIMAAN'
                    : 'BERITA ACARA OPNAME'}
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 mt-1">
                  NO: {transaction.referenceNo}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-3 border border-slate-200 rounded">
            <div>
              <div className="text-slate-500 text-[11px]">Tanggal & Waktu Transaksi:</div>
              <div className="font-semibold text-slate-800">
                {formatDateTimeIndo(transaction.timestamp)}
              </div>
              <div className="text-slate-500 text-[11px] mt-2">Tujuan / Proyek Lapangan:</div>
              <div className="font-semibold text-slate-800">
                {transaction.projectOrLocation}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Teknisi / Petugas Pembawa:</div>
              <div className="font-semibold text-slate-800">{transaction.operator}</div>
              <div className="text-slate-500 text-[11px] mt-2">Kategori Bahan:</div>
              <div className="font-semibold text-slate-800 font-mono">
                {transaction.category} {itemDetails?.hazardClass ? `(${itemDetails.hazardClass})` : ''}
              </div>
            </div>
          </div>

          {/* Item Table */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-800 bg-slate-100 font-mono font-bold text-slate-800 uppercase">
                <th className="py-2 px-3">No.</th>
                <th className="py-2 px-3">Kode SKU</th>
                <th className="py-2 px-3">Deskripsi Barang / Komoditas</th>
                <th className="py-2 px-3">No. Batch / Lot</th>
                <th className="py-2 px-3 text-right">Jumlah Keluar</th>
                <th className="py-2 px-3 text-right">Sisa Stok Gudang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-3 font-mono">1</td>
                <td className="py-3 px-3 font-mono font-bold">{transaction.sku}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{transaction.itemName}</div>
                  {itemDetails?.activeIngredients && (
                    <div className="text-[11px] text-slate-600 italic">
                      Bahan Aktif: {itemDetails.activeIngredients}
                    </div>
                  )}
                  {transaction.notes && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Catatan: {transaction.notes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 font-mono">{transaction.batchNo || '-'}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                  {formatNumberID(transaction.quantity)} {transaction.unit}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {formatNumberID(transaction.newStock)} {transaction.unit}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Safety Notice for Chemicals / Fuel */}
          {(transaction.category === 'BBM' ||
            transaction.category === 'FUMIGASI' ||
            transaction.category === 'SPRAYING_FOGGING') && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                PERNYATAAN KESELAMATAN & K3 HAZARDOUS MATERIALS:
              </div>
              <p>
                {footerNote}
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs border-t border-slate-300">
            <div>
              <p className="text-slate-500 text-[11px] mb-12">Petugas Gudang (Penyerah)</p>
              <div className="border-t border-slate-700 mx-4 pt-1 font-semibold text-slate-900">
                ( {warehouseManager} )
              </div>
              <div className="text-[10px] text-slate-500">Logistik & Stock Control</div>
            </div>

            <div>
              <p className="text-slate-500 text-[11px] mb-12">Penerima / Teknisi Lapangan</p>
              <div className="border-t border-slate-700 mx-4 pt-1 font-semibold text-slate-900">
                ( {transaction.operator} )
              </div>
              <div className="text-[10px] text-slate-500">Penanggung Jawab Proyek</div>
            </div>

            <div>
              <p className="text-slate-500 text-[11px] mb-12">Mengetahui / K3 HSE Officer</p>
              <div className="border-t border-slate-700 mx-4 pt-1 font-semibold text-slate-900">
                ( {hseOfficer} )
              </div>
              <div className="text-[10px] text-slate-500">Kepala Operasional K3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
