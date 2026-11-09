import React from 'react';
import { FumigationJobReport } from '../types/jobs';
import { formatDateIndo, getDayNameIndo, getFumigationDurationInfo } from '../utils/formatters';

interface JapfaFumigationDocumentProps {
  job: FumigationJobReport;
  printable?: boolean;
}

export const JapfaFumigationDocument: React.FC<JapfaFumigationDocumentProps> = ({ job, printable = false }) => {
  // Determine days & dates
  const executionDay = job.executionDay || getDayNameIndo(job.closingDate || job.executionDate) || 'Senin';
  const executionDate = job.closingDate || job.executionDate || new Date().toISOString().slice(0, 10);
  
  const openingDay = job.openingDay || getDayNameIndo(job.openingDate || job.aerationDate) || 'Kamis';
  const openingDate = job.openingDate || job.aerationDate || '';

  // Lama difumigasi dari tanggal tutup sampai tanggal aktif / buka
  const durationInfo = getFumigationDurationInfo(
    job.closingDate || job.executionDate,
    job.openingDate || job.aerationDate,
    job.exposureHours
  );

  const requestDate = job.requestDate || executionDate;
  const rawMaterialName = job.rawMaterialName || job.targetObject || '-';
  const batch = job.rawMaterialBatch || job.medicineBatchNo || '-';
  const tonnage = job.tonnage || (job.targetObject.includes('Ton') ? job.targetObject : '-');
  const warehouseKavling = job.warehouseKavling || job.location || '-';
  const fumigantName = job.fumigantName || job.medicineName || 'Quickphos 56 TB';
  const fumigantQty = job.fumigantQuantityStr || (job.medicineQuantity ? `${job.medicineQuantity} ${job.medicineUnit}` : '-');
  const controlType = job.controlType || 'Fumigasi (Gassing) Cover Sheet';

  const operatorName = job.operatorName || 'Fumigation Operator';
  const rmWhSupervisor = job.warehouseSupervisorName || 'RM WH Supervisor';
  const qcSupervisor = job.qcSupervisorName || job.qcInspector || 'QC Supervisor';

  return (
    <div className="bg-white text-black font-sans leading-relaxed p-6 sm:p-10 border-2 border-black max-w-4xl mx-auto shadow-lg print:shadow-none print:border-2 print:border-black print:p-6 print:m-0 print:w-full print:max-w-none text-sm select-text">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-black gap-4">
        {/* Logo JAPFA + Company Title */}
        <div className="flex items-center gap-3">
          {/* Official JAPFA Stylized Red & Black Vector Emblem */}
          <div className="shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* JAPFA Ribbon Arc */}
              <circle cx="60" cy="60" r="54" stroke="#DC2626" strokeWidth="8" />
              <path
                d="M42 35C42 35 55 25 72 35C85 43 85 62 72 72C62 80 50 82 45 74C40 66 48 55 58 55C66 55 70 60 70 65"
                stroke="#1E293B"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <circle cx="76" cy="38" r="6" fill="#DC2626" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-black tracking-widest text-red-600 font-sans">
              JAPFA
            </div>
            <div className="text-xs font-extrabold uppercase tracking-tight text-black">
              PT. JAPFA COMFEED INDONESIA Tbk
            </div>
            <div className="text-xs font-semibold text-black">
              Unit Lampung
            </div>
          </div>
        </div>

        {/* Center Document Title */}
        <div className="text-center sm:flex-1 px-2">
          <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black underline underline-offset-4 decoration-2">
            BERITA ACARA PENGENDALIAN HAMA
          </h1>
        </div>

        {/* Right Form Code */}
        <div className="text-right shrink-0">
          <div className="text-xs font-black tracking-wide text-black border border-black px-2 py-1 inline-block">
            PLT-WRH-FM 01-09
          </div>
        </div>
      </div>

      {/* ================= BODY CONTENT ================= */}
      <div className="pt-6 pb-4 space-y-4 text-xs sm:text-sm">
        {/* Intro sentence */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-medium">
          <span>Pada hari :</span>
          <span className="font-bold underline min-w-[90px]">{executionDay}</span>
          <span>Tanggal :</span>
          <span className="font-bold underline min-w-[120px]">{formatDateIndo(executionDate)}</span>
          <span className="sm:ml-auto font-medium">telah dilakukan Pengendalian hama:</span>
        </div>

        {/* 8 Core Fields Form Table */}
        <div className="my-5 pl-2 sm:pl-6 space-y-2 font-sans">
          {/* Row 1 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Tanggal Permintaan</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold">{formatDateIndo(requestDate)}</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Nama Bahan Baku</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold uppercase">{rawMaterialName}</span>
          </div>

          {/* Row 3 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Batch</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold font-mono">{batch}</span>
          </div>

          {/* Row 4 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Tonase</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold">{tonnage}</span>
          </div>

          {/* Row 5 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Gudang/ Kavling</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold">{warehouseKavling}</span>
          </div>

          {/* Row 6 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Nama Fumigan</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold">{fumigantName}</span>
          </div>

          {/* Row 7 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Jumlah Fumigan</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold font-mono">{fumigantQty}</span>
          </div>

          {/* Row 8 */}
          <div className="flex items-start">
            <span className="w-48 sm:w-56 font-semibold">Jenis Pengendalian</span>
            <span className="mr-3 font-bold">=</span>
            <span className="flex-1 font-bold">{controlType}</span>
          </div>
        </div>

        {/* Closing Notice */}
        <div className="pt-2 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span>Fumigasi (Gassing) akan dibuka plastik cover sheet pada hari :</span>
            <span className="font-bold underline min-w-[80px]">{openingDay}</span>
            <span>tanggal :</span>
            <span className="font-bold underline min-w-[110px]">{openingDate ? formatDateIndo(openingDate) : '-'}</span>
            <span className="font-bold text-black border border-black/40 bg-slate-100 px-2 py-0.5 rounded text-xs">
              (Lama Difumigasi: {durationInfo.totalDays} Hari / {durationInfo.totalHours} Jam)
            </span>
          </div>
          <p className="italic text-slate-800">
            Demikian berita acara ini kami buat untuk dapat dipergunakan sebagaimana mestinya
          </p>
        </div>
      </div>

      {/* ================= SIGNATURE SECTION ================= */}
      <div className="mt-8 pt-4 border-t border-black/40 text-xs sm:text-sm">
        <div className="mb-4">
          <span>Tanggal : </span>
          <span className="font-bold">{formatDateIndo(executionDate)}</span>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:gap-12 pt-2">
          {/* Kolom Kiri: Dibuat Oleh (2 Tanda Tangan) */}
          <div className="space-y-6">
            <div>
              <div className="font-bold mb-14">Dibuat Oleh</div>
              {/* Tanda Tangan 1: Fumigation Opr */}
              <div className="space-y-1">
                <div className="border-b border-black w-48 sm:w-56 text-center font-bold pb-0.5">
                  ( {operatorName} )
                </div>
                <div className="font-bold text-xs pl-2">
                  Fimigation Opr
                </div>
              </div>
            </div>

            {/* Tanda Tangan 2: RM WH Supervisor */}
            <div className="pt-4 space-y-1">
              <div className="border-b border-black w-48 sm:w-56 text-center font-bold pb-0.5">
                ( {rmWhSupervisor} )
              </div>
              <div className="font-bold text-xs pl-2">
                RM WH Supervisor
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Mengetahui (1 Tanda Tangan) */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              <div className="font-bold mb-14">Mengetahui</div>
              {/* Tanda Tangan 3: QC Supervisor */}
              <div className="space-y-1">
                <div className="border-b border-black w-48 sm:w-56 text-center font-bold pb-0.5">
                  ( {qcSupervisor} )
                </div>
                <div className="font-bold text-xs pl-2">
                  QC Supervisor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Registration Bar */}
      <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>No. Dokumen: PLT-WRH-FM 01-09 &bull; Sistem Terpadu Pengendalian Hama</span>
        <span>ID SPK: {job.jobNo}</span>
      </div>
    </div>
  );
};
