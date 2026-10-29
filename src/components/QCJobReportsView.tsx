import React, { useState, useMemo } from 'react';
import { FumigationJobReport, QCRecommendation, QCApprovalStatus } from '../types/jobs';
import { AuthUser } from '../types/auth';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Search,
  Filter,
  Microscope,
  Fuel,
  Beaker,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  User,
  X,
  Check,
  Ban,
  Trash2,
  Edit,
  Edit3,
  Save,
  Printer,
  ChevronRight,
  Flame,
  Bug,
  Lock,
  Unlock,
  Package,
  Table,
  LayoutGrid,
  SlidersHorizontal,
  Download,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { formatNumberID } from '../utils/formatters';

interface QCJobReportsViewProps {
  jobReports: FumigationJobReport[];
  currentUser: AuthUser;
  onUpdateJobReport: (updatedReport: FumigationJobReport) => void;
  onDeleteJobReport?: (id: string) => void;
  onOpenNewJobModal?: (preselectedType?: 'FUMIGASI' | 'SPRAYING_FOGGING') => void;
  onShowToast: (message: string) => void;
  forcedJobType?: 'FUMIGASI' | 'SPRAYING_FOGGING';
}

export const QCJobReportsView: React.FC<QCJobReportsViewProps> = ({
  jobReports,
  currentUser,
  onUpdateJobReport,
  onDeleteJobReport,
  onOpenNewJobModal,
  onShowToast,
  forcedJobType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>(forcedJobType || 'ALL');
  const [filterRawMaterial, setFilterRawMaterial] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Sync forcedJobType if changed from outside tab navigation
  React.useEffect(() => {
    if (forcedJobType) {
      setFilterType(forcedJobType);
    }
  }, [forcedJobType]);

  // Modal review state
  const [selectedJobForReview, setSelectedJobForReview] = useState<FumigationJobReport | null>(null);
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<FumigationJobReport | null>(null);
  const [reviewRecommendation, setReviewRecommendation] = useState<QCRecommendation>('OK');
  const [reviewApproval, setReviewApproval] = useState<QCApprovalStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const isOperator = currentUser.role === 'OPERATOR';
  const isAdmin = currentUser.role === 'ADMIN';
  const isQC = currentUser.role === 'QC';

  const canEvaluate = currentUser.permissions.canEvaluateQCJobs || isAdmin;
  const canEditJob = isOperator || isAdmin;
  const canDeleteJob = isOperator || isAdmin;

  // Edit job modal states ("bisa di edit simpan dan hapus")
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<FumigationJobReport | null>(null);
  const [editRawMaterialName, setEditRawMaterialName] = useState<string>('');
  const [editClosingDate, setEditClosingDate] = useState<string>('');
  const [editOpeningDate, setEditOpeningDate] = useState<string>('');
  const [editMedicineQuantity, setEditMedicineQuantity] = useState<string>('');
  const [editMedicineName, setEditMedicineName] = useState<string>('');
  const [editMedicineUnit, setEditMedicineUnit] = useState<string>('Tablet');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editTargetPest, setEditTargetPest] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleOpenEdit = (job: FumigationJobReport) => {
    setSelectedJobForEdit(job);
    setEditRawMaterialName(job.rawMaterialName || job.targetObject || '');
    setEditClosingDate(job.closingDate || job.executionDate || '');
    setEditOpeningDate(job.openingDate || job.aerationDate || '');
    setEditMedicineQuantity(String(job.medicineQuantity ?? ''));
    setEditMedicineName(job.medicineName || '');
    setEditMedicineUnit(job.medicineUnit || 'Tablet');
    setEditTitle(job.title || '');
    setEditClientName(job.clientName || '');
    setEditLocation(job.location || '');
    setEditTargetPest(job.targetPest || '');
    setEditNotes(job.notes || '');
  };

  const handleSaveEdit = () => {
    if (!selectedJobForEdit) return;

    if (!editRawMaterialName.trim()) {
      onShowToast('Nama bahan baku wajib diisi!');
      return;
    }
    if (!editClosingDate) {
      onShowToast('Tanggal tutup wajib diisi!');
      return;
    }
    if (!editOpeningDate) {
      onShowToast('Tanggal buka wajib diisi!');
      return;
    }
    const parsedQty = parseFloat(editMedicineQuantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      onShowToast('Jumlah dosis obat harus lebih besar dari 0!');
      return;
    }

    const updated: FumigationJobReport = {
      ...selectedJobForEdit,
      rawMaterialName: editRawMaterialName.trim(),
      targetObject: editRawMaterialName.trim(),
      closingDate: editClosingDate,
      openingDate: editOpeningDate,
      executionDate: editClosingDate,
      aerationDate: editOpeningDate,
      medicineQuantity: parsedQty,
      medicineName: editMedicineName.trim() || selectedJobForEdit.medicineName,
      medicineUnit: editMedicineUnit || selectedJobForEdit.medicineUnit,
      title: editTitle.trim() || selectedJobForEdit.title,
      clientName: editClientName.trim() || selectedJobForEdit.clientName,
      location: editLocation.trim() || selectedJobForEdit.location,
      targetPest: editTargetPest.trim() || selectedJobForEdit.targetPest,
      notes: editNotes.trim() || selectedJobForEdit.notes,
    };

    onUpdateJobReport(updated);
    setSelectedJobForEdit(null);
    onShowToast(`Laporan ${updated.jobNo} berhasil diperbarui & disimpan!`);
  };

  // Open evaluation modal
  const handleOpenReview = (job: FumigationJobReport) => {
    setSelectedJobForReview(job);
    setReviewRecommendation(job.qcRecommendation === 'PENDING' ? 'OK' : job.qcRecommendation);
    setReviewApproval(job.qcApprovalStatus === 'PENDING' ? 'APPROVED' : job.qcApprovalStatus);
    setReviewNotes(
      job.qcRecommendationNotes ||
        (job.qcRecommendation === 'OK' || job.qcRecommendation === 'PENDING'
          ? job.jobType === 'SPRAYING_FOGGING'
            ? 'Aplikasi spraying & fogging memenuhi standar teknis. Penetrasi asap dan droplet merata, lethal dose tercapai, hama sasaran mati tuntas, dosis insektisida dan pelarut BBM sesuai SOP.'
            : 'Konsentrasi gas dan waktu paparan memenuhi standar karantina ISPM-15. Mortalitas hama 100%. Lolos uji QC.'
          : '')
    );
  };

  const handleSaveReview = () => {
    if (!selectedJobForReview) return;

    const updated: FumigationJobReport = {
      ...selectedJobForReview,
      qcRecommendation: reviewRecommendation,
      qcApprovalStatus: reviewApproval,
      qcInspector: currentUser.name,
      qcVerifiedAt: new Date().toISOString(),
      qcRecommendationNotes: reviewNotes.trim(),
    };

    onUpdateJobReport(updated);
    setSelectedJobForReview(null);

    let statusText = 'Direkomendasikan OK & Disetujui';
    if (reviewRecommendation === 'BELUM_OK') statusText = 'Ditandai Belum OK (Perlu Tindakan)';
    if (reviewRecommendation === 'FUMIGASI_ULANG') statusText = 'Wajib Dilakukan Fumigasi Ulang';
    if (reviewRecommendation === 'SPRAYING_ULANG') statusText = 'Wajib Dilakukan Spraying & Fogging Ulang';
    onShowToast(`Laporan ${updated.jobNo} berhasil diverifikasi: ${statusText}`);
  };

  // Unique options for dropdown filters
  const rawMaterialOptions = useMemo(() => {
    const set = new Set<string>();
    jobReports.forEach((j) => {
      const name = j.rawMaterialName || j.targetObject;
      if (name && name.trim()) set.add(name.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobReports]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    jobReports.forEach((j) => {
      if (j.location && j.location.trim()) set.add(j.location.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobReports]);

  // Enhanced Filtered Jobs Logic
  const filteredJobs = useMemo(() => {
    return jobReports.filter((job) => {
      // 1. Quick search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          job.jobNo.toLowerCase().includes(q) ||
          job.title.toLowerCase().includes(q) ||
          (job.rawMaterialName && job.rawMaterialName.toLowerCase().includes(q)) ||
          job.targetObject.toLowerCase().includes(q) ||
          job.clientName.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.operatorName.toLowerCase().includes(q) ||
          job.medicineName.toLowerCase().includes(q);

        if (!matchesSearch) return false;
      }

      // 2. QC Recommendation
      if (filterRecommendation !== 'ALL') {
        if (filterRecommendation === 'PENDING' && job.qcApprovalStatus !== 'PENDING') return false;
        if (filterRecommendation === 'OK' && job.qcRecommendation !== 'OK') return false;
        if (filterRecommendation === 'BELUM_OK' && job.qcRecommendation !== 'BELUM_OK') return false;
        if (filterRecommendation === 'FUMIGASI_ULANG' && job.qcRecommendation !== 'FUMIGASI_ULANG') return false;
      }

      // 3. Job Type (Fumigasi vs Spraying Fogging)
      if (filterType !== 'ALL' && job.jobType !== filterType) {
        return false;
      }

      // 4. Raw Material / Komoditas
      if (filterRawMaterial !== 'ALL') {
        const mat = job.rawMaterialName || job.targetObject;
        if (mat !== filterRawMaterial) return false;
      }

      // 5. Lokasi / Gudang
      if (filterLocation !== 'ALL' && job.location !== filterLocation) {
        return false;
      }

      // 6. Rentang Tanggal Tutup / Injeksi
      const jobDate = job.closingDate || job.executionDate;
      if (filterStartDate && jobDate && jobDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && jobDate && jobDate > filterEndDate) {
        return false;
      }

      return true;
    });
  }, [
    jobReports,
    searchQuery,
    filterRecommendation,
    filterType,
    filterRawMaterial,
    filterLocation,
    filterStartDate,
    filterEndDate,
  ]);

  // Active filter status check
  const isFilterActive =
    searchQuery.trim() !== '' ||
    filterRecommendation !== 'ALL' ||
    filterType !== 'ALL' ||
    filterRawMaterial !== 'ALL' ||
    filterLocation !== 'ALL' ||
    filterStartDate !== '' ||
    filterEndDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRecommendation('ALL');
    setFilterType('ALL');
    setFilterRawMaterial('ALL');
    setFilterLocation('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    onShowToast('Filter berhasil dibersihkan.');
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredJobs.length === 0) {
      onShowToast('Tidak ada data yang dapat diekspor!');
      return;
    }
    const headers = [
      'No SPK',
      'Jenis Pekerjaan',
      'Nama Bahan Baku',
      'Tanggal Tutup',
      'Tanggal Buka',
      'Jumlah Dosis Obat',
      'Satuan',
      'Nama Obat',
      'Klien',
      'Lokasi / Gudang',
      'Teknisi Pelaksana',
      'Rekomendasi QC',
      'Status Approval',
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...filteredJobs.map((j) =>
        [
          escapeCsv(j.jobNo),
          escapeCsv(j.jobType),
          escapeCsv(j.rawMaterialName || j.targetObject),
          escapeCsv(j.closingDate || j.executionDate),
          escapeCsv(j.openingDate || j.aerationDate || '-'),
          escapeCsv(j.medicineQuantity),
          escapeCsv(j.medicineUnit),
          escapeCsv(j.medicineName),
          escapeCsv(j.clientName),
          escapeCsv(j.location),
          escapeCsv(j.operatorName),
          escapeCsv(j.qcRecommendation),
          escapeCsv(j.qcApprovalStatus),
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Fumigasi_Fogging_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Laporan (${filteredJobs.length} data) berhasil diekspor ke file CSV!`);
  };

  // Scope of jobs according to forcedJobType if any
  const baseJobs = useMemo(() => {
    if (forcedJobType) {
      return jobReports.filter((j) => j.jobType === forcedJobType);
    }
    return jobReports;
  }, [jobReports, forcedJobType]);

  // Summary counts
  const totalCount = baseJobs.length;
  const pendingCount = baseJobs.filter((j) => j.qcApprovalStatus === 'PENDING').length;
  const okCount = baseJobs.filter((j) => j.qcRecommendation === 'OK' && j.qcApprovalStatus === 'APPROVED').length;
  const belumOkCount = baseJobs.filter((j) => j.qcRecommendation === 'BELUM_OK').length;
  const perlakuanUlangCount = baseJobs.filter(
    (j) => j.qcRecommendation === 'FUMIGASI_ULANG' || j.qcRecommendation === 'SPRAYING_ULANG'
  ).length;

  const bannerTitle =
    forcedJobType === 'FUMIGASI'
      ? 'Laporan Pekerjaan Fumigasi'
      : forcedJobType === 'SPRAYING_FOGGING'
      ? 'Laporan Pekerjaan Spraying & Fogging'
      : currentUser.role === 'OPERATOR'
      ? 'Laporan Pekerjaan Saya'
      : 'Laporan Pekerjaan Fumigasi & Spraying Fogging';

  const bannerSubtitle =
    forcedJobType === 'FUMIGASI'
      ? 'Catatan khusus pekerjaan fumigasi komoditas tertutup terpal & silo (Standar ISPM-15). Memuat Nama Bahan Baku, Tanggal Tutup (Injeksi), Tanggal Buka (Aerasi), dan Dosis Fosfin Tablet.'
      : forcedJobType === 'SPRAYING_FOGGING'
      ? 'Catatan khusus pekerjaan penyemprotan & pengasapan pest control gudang. Memuat Bahan Baku / Area Gudang, Tanggal Pengerjaan, Insektisida Cair, BBM Pelarut Mesin, dan Target Hama.'
      : 'Format laporan simpel & terstruktur. Menyajikan riwayat pekerjaan fumigasi karantina dan spraying fogging dengan filter data lengkap.';

  return (
    <div className="space-y-5">
      {/* Top Banner / Role Notice & Mode Switcher */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
              {forcedJobType === 'FUMIGASI' ? (
                <Flame className="w-6 h-6 text-amber-400" />
              ) : forcedJobType === 'SPRAYING_FOGGING' ? (
                <Bug className="w-6 h-6 text-emerald-400" />
              ) : (
                <Microscope className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {bannerTitle}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  currentUser.role === 'QC'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : currentUser.role === 'OPERATOR'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {currentUser.role === 'QC' ? 'Portal Tim QC' : currentUser.role === 'OPERATOR' ? 'Operator Lapangan' : 'Administrator'}
                </span>
                {forcedJobType && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    forcedJobType === 'FUMIGASI'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {forcedJobType === 'FUMIGASI' ? 'Khusus Fumigasi' : 'Khusus Spraying & Fogging'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {bannerSubtitle}
              </p>
            </div>
          </div>

          {/* Action buttons on top banner */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* View Mode Toggle: Tabel Simple vs Kartu */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Tabel Simple & Ringkas"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Simple</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
            </div>

            {/* Ekspor CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh laporan saat ini ke format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            {/* Input Pekerjaan Baru */}
            {onOpenNewJobModal && (currentUser.permissions.canInputJobReports || currentUser.role === 'ADMIN') && (
              <button
                type="button"
                onClick={() => onOpenNewJobModal(forcedJobType || (filterType !== 'ALL' ? (filterType as any) : undefined))}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>
                  + Pekerjaan Baru
                  {forcedJobType === 'FUMIGASI' ? ' Fumigasi' : forcedJobType === 'SPRAYING_FOGGING' ? ' Fogging' : ''}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs for switching between Fumigasi and Spraying Fogging when not in forced view */}
        {!forcedJobType && (
          <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-800/80 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Kategori Pekerjaan:</span>
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              Semua Pekerjaan ({jobReports.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('FUMIGASI')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'FUMIGASI'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-300 hover:text-white bg-indigo-950/30 border border-indigo-500/20'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Khusus Fumigasi ({jobReports.filter((j) => j.jobType === 'FUMIGASI').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SPRAYING_FOGGING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'SPRAYING_FOGGING'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300 hover:text-white bg-emerald-950/30 border border-emerald-500/20'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-emerald-400" />
              <span>Khusus Spraying &amp; Fogging ({jobReports.filter((j) => j.jobType === 'SPRAYING_FOGGING').length})</span>
            </button>
          </div>
        )}

        {/* Clickable Quick KPI Cards (Instant Filter Trigger) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setFilterRecommendation('ALL')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              filterRecommendation === 'ALL'
                ? 'bg-slate-800 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="text-slate-400 text-[11px] font-medium">Semua Laporan</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{totalCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterRecommendation('PENDING')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              filterRecommendation === 'PENDING'
                ? 'bg-blue-950/80 border-blue-400 ring-1 ring-blue-400 shadow-md'
                : 'bg-blue-950/30 border-blue-500/20 hover:bg-blue-950/50'
            }`}
          >
            <div className="text-blue-400 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Menunggu QC</span>
            </div>
            <div className="text-lg font-bold font-mono text-blue-300 mt-0.5">{pendingCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterRecommendation('OK')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              filterRecommendation === 'OK'
                ? 'bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                : 'bg-emerald-950/30 border-emerald-500/20 hover:bg-emerald-950/50'
            }`}
          >
            <div className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Rekomendasi OK</span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{okCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterRecommendation('BELUM_OK')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              filterRecommendation === 'BELUM_OK'
                ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400 shadow-md'
                : 'bg-amber-950/30 border-amber-500/20 hover:bg-amber-950/50'
            }`}
          >
            <div className="text-amber-400 text-[11px] font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Belum OK</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{belumOkCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterRecommendation('FUMIGASI_ULANG')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border col-span-2 sm:col-span-1 ${
              filterRecommendation === 'FUMIGASI_ULANG'
                ? 'bg-rose-950/80 border-rose-400 ring-1 ring-rose-400 shadow-md'
                : 'bg-rose-950/30 border-rose-500/20 hover:bg-rose-950/50'
            }`}
          >
            <div className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              <span>{forcedJobType === 'SPRAYING_FOGGING' ? 'Fogging Ulang' : 'Perlakuan Ulang'}</span>
            </div>
            <div className="text-lg font-bold font-mono text-rose-300 mt-0.5">{perlakuanUlangCount}</div>
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR UTAMA */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
        {/* Row 1: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SPK, Bahan Baku, Klien..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Jenis Pekerjaan */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Jenis Pekerjaan</option>
              <option value="FUMIGASI">Fumigasi Kapal / Gudang</option>
              <option value="SPRAYING_FOGGING">Spraying &amp; Fogging</option>
            </select>
          </div>

          {/* Filter Bahan Baku / Komoditas */}
          <div>
            <select
              value={filterRawMaterial}
              onChange={(e) => setFilterRawMaterial(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Bahan Baku / Komoditas</option>
              {rawMaterialOptions.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Lokasi / Gudang */}
          <div>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Gudang / Lokasi</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Status Pills, Advanced Date Filter Toggle, and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800 text-xs">
          {/* Status QC Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Status QC:</span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'PENDING', label: 'Menunggu Review' },
              { id: 'OK', label: 'Rekomendasi OK' },
              { id: 'BELUM_OK', label: 'Belum OK' },
              { id: 'FUMIGASI_ULANG', label: 'Fumigasi Ulang' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterRecommendation(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  filterRecommendation === st.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Right Side: Toggle Filter Tanggal & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAdvancedFilters || filterStartDate || filterEndDate
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Tutup Filter Tanggal' : 'Filter Tanggal'}</span>
              {(filterStartDate || filterEndDate) && (
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Bersihkan semua filter"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Date Range Filter */}
        {showAdvancedFilters && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 animate-in fade-in duration-150 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Filter Berdasarkan Tanggal Tutup / Pengerjaan:
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setFilterStartDate(today);
                    setFilterEndDate(today);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setFilterStartDate(d.toISOString().slice(0, 10));
                    setFilterEndDate(new Date().toISOString().slice(0, 10));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                    setFilterStartDate(firstDay);
                    setFilterEndDate(now.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Bulan Ini
                </button>
                {(filterStartDate || filterEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                  >
                    Hapus Tanggal
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Dari Tanggal:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Counter / Active Filter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            Menampilkan <strong className="text-white">{filteredJobs.length}</strong> dari{' '}
            <span className="text-slate-300">{jobReports.length}</span> laporan pekerjaan
            {isFilterActive && <span className="ml-1 text-emerald-400 font-semibold">(Tersaring)</span>}
          </div>
          {isFilterActive && (
            <div className="text-[11px] text-slate-400">
              Mode Filter Aktif
            </div>
          )}
        </div>
      </div>

      {/* RENDER VIEW: TABLE (SIMPLE) OR CARDS */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-14 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">Tidak ada laporan pekerjaan yang cocok</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Coba ubah kriteria pencarian atau klik tombol Reset Filter untuk melihat seluruh laporan.
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bersihkan Filter</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ================= MODE TABEL SIMPLE (RINGKAS & JELAS) ================= */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">No. SPK &amp; Jenis</th>
                  <th className="py-3 px-4">🌾 Bahan Baku / Komoditas</th>
                  <th className="py-3 px-4">🔒 Tgl Tutup</th>
                  <th className="py-3 px-4">🔓 Tgl Buka</th>
                  <th className="py-3 px-4">🧪 Dosis &amp; Obat</th>
                  <th className="py-3 px-4">📍 Lokasi / Klien</th>
                  <th className="py-3 px-4">🛡️ Status Rekomendasi QC</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredJobs.map((job) => {
                  const isFumigasi = job.jobType === 'FUMIGASI';
                  const isApproved = job.qcApprovalStatus === 'APPROVED';
                  const isRejected = job.qcApprovalStatus === 'REJECTED';

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. No SPK & Jenis */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-amber-400 text-xs">{job.jobNo}</div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                            isFumigasi
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isFumigasi ? <Flame className="w-2.5 h-2.5" /> : <Bug className="w-2.5 h-2.5" />}
                          <span>{isFumigasi ? 'Fumigasi' : 'Fogging'}</span>
                        </span>
                      </td>

                      {/* 2. Bahan Baku / Komoditas */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{job.rawMaterialName || job.targetObject}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5" title={job.clientName}>
                          Klien: <span className="text-slate-300 font-medium">{job.clientName}</span>
                        </div>
                      </td>

                      {/* 3. Tanggal Tutup */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1 text-blue-300 font-semibold">
                          <Lock className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{job.closingDate || job.executionDate}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Tutup / Gas</span>
                      </td>

                      {/* 4. Tanggal Buka */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1 text-amber-300 font-semibold">
                          <Unlock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{job.openingDate || job.aerationDate || '-'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Buka / Aerasi</span>
                      </td>

                      {/* 5. Dosis & Nama Obat */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-rose-300 text-xs">
                          {formatNumberID(job.medicineQuantity)}{' '}
                          <span className="text-[11px] font-sans text-slate-300 font-normal">{job.medicineUnit}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5" title={job.medicineName}>
                          {job.medicineName}
                        </div>
                      </td>

                      {/* 6. Lokasi / Klien */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium truncate max-w-[150px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span title={job.location}>{job.location}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Teknisi: {job.operatorName}
                        </div>
                      </td>

                      {/* 7. Status Rekomendasi QC */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {job.qcRecommendation === 'OK' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>OK (Sesuai)</span>
                            </span>
                          )}
                          {job.qcRecommendation === 'BELUM_OK' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Belum OK</span>
                            </span>
                          )}
                          {(job.qcRecommendation === 'FUMIGASI_ULANG' || job.qcRecommendation === 'SPRAYING_ULANG') && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <RotateCcw className="w-3 h-3 text-rose-400" />
                              <span>{isFumigasi ? 'Fumigasi Ulang' : 'Fogging Ulang'}</span>
                            </span>
                          )}
                          {job.qcRecommendation === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span>Menunggu QC</span>
                            </span>
                          )}

                          <span
                            className={`block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded w-max ${
                              isApproved
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : isRejected
                                ? 'bg-rose-600/30 text-rose-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                          </span>
                        </div>
                      </td>

                      {/* 8. Tombol Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Cetak */}
                          <button
                            type="button"
                            onClick={() => setSelectedJobForPrint(job)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Cetak Lembar Resmi"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Edit Data */}
                          {canEditJob && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(job)}
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 transition-colors cursor-pointer"
                              title="Edit Bahan Baku, Tanggal, dan Dosis Obat"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Evaluasi QC */}
                          {canEvaluate && (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(job)}
                              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow cursor-pointer"
                              title="Beri Rekomendasi & Approve"
                            >
                              <Microscope className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Hapus */}
                          {canDeleteJob && onDeleteJobReport && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Apakah Anda yakin ingin menghapus laporan pekerjaan ${job.jobNo} (${job.rawMaterialName || job.targetObject || 'Komoditas'})?`
                                  )
                                ) {
                                  onDeleteJobReport(job.id);
                                  onShowToast(`Laporan ${job.jobNo} berhasil dihapus.`);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                              title="Hapus Laporan Pekerjaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= MODE KARTU STREAMLINED (SIMPEL & TIDAK MENUMPUK) ================= */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredJobs.map((job) => {
            const isFumigasi = job.jobType === 'FUMIGASI';
            const isApproved = job.qcApprovalStatus === 'APPROVED';
            const isRejected = job.qcApprovalStatus === 'REJECTED';

            return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md space-y-3"
              >
                {/* Header Row: SPK, Type, QC Badge, Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400">
                      {job.jobNo}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        isFumigasi
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isFumigasi ? <Flame className="w-3 h-3 text-indigo-400" /> : <Bug className="w-3 h-3 text-emerald-400" />}
                      <span>{isFumigasi ? 'FUMIGASI' : 'FOGGING'}</span>
                    </span>

                    {/* Status QC */}
                    {job.qcRecommendation === 'OK' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Rekomendasi: OK</span>
                      </span>
                    )}
                    {job.qcRecommendation === 'BELUM_OK' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Belum OK</span>
                      </span>
                    )}
                    {(job.qcRecommendation === 'FUMIGASI_ULANG' || job.qcRecommendation === 'SPRAYING_ULANG') && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-rose-400" />
                        <span>{isFumigasi ? 'Fumigasi Ulang' : 'Fogging Ulang'}</span>
                      </span>
                    )}
                    {job.qcRecommendation === 'PENDING' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>Menunggu QC</span>
                      </span>
                    )}

                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isApproved
                          ? 'bg-emerald-600 text-white'
                          : isRejected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForPrint(job)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 cursor-pointer flex items-center gap-1"
                      title="Cetak Dokumen"
                    >
                      <Printer className="w-3 h-3 text-amber-400" />
                      <span>Cetak</span>
                    </button>

                    {canEditJob && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(job)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Bahan Baku, Tanggal Tutup/Buka, dan Dosis Obat"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                        <span>Edit</span>
                      </button>
                    )}

                    {canEvaluate && (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(job)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1"
                      >
                        <Microscope className="w-3 h-3" />
                        <span>Review</span>
                      </button>
                    )}

                    {canDeleteJob && onDeleteJobReport && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus laporan pekerjaan ${job.jobNo} (${job.rawMaterialName || job.targetObject})?`
                            )
                          ) {
                            onDeleteJobReport(job.id);
                            onShowToast(`Laporan ${job.jobNo} berhasil dihapus.`);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-700/60 transition-colors cursor-pointer"
                        title="Hapus Laporan Pekerjaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 PILAR DATA POKOK (KOMPAK & BERSIH) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* 1. Bahan Baku */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                      <Package className="w-3 h-3 text-amber-400" />
                      <span>Bahan Baku</span>
                    </div>
                    <div className="font-bold text-white text-xs mt-1 truncate" title={job.rawMaterialName || job.targetObject}>
                      {job.rawMaterialName || job.targetObject}
                    </div>
                  </div>

                  {/* 2. Tanggal Tutup */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1 uppercase">
                      <Lock className="w-3 h-3" />
                      <span>Tgl Tutup</span>
                    </div>
                    <div className="font-bold text-blue-200 font-mono text-xs mt-1">
                      {job.closingDate || job.executionDate}
                    </div>
                  </div>

                  {/* 3. Tanggal Buka */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase">
                      <Unlock className="w-3 h-3" />
                      <span>Tgl Buka</span>
                    </div>
                    <div className="font-bold text-amber-200 font-mono text-xs mt-1">
                      {job.openingDate || job.aerationDate || '-'}
                    </div>
                  </div>

                  {/* 4. Dosis Obat */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1 uppercase">
                      <Beaker className="w-3 h-3" />
                      <span>Dosis Obat</span>
                    </div>
                    <div className="font-bold text-rose-300 font-mono text-xs mt-1 truncate">
                      {formatNumberID(job.medicineQuantity)} {job.medicineUnit}{' '}
                      <span className="text-[10px] font-sans text-slate-400 font-normal">
                        ({job.medicineName})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta line: Lokasi, Klien, Teknisi & Notes */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      {job.clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {job.operatorName}
                    </span>
                  </div>

                  {job.qcRecommendationNotes && (
                    <div className="text-slate-300 italic text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 max-w-md truncate">
                      QC: "{job.qcRecommendationNotes}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QC Evaluation & Approval Modal */}
      {selectedJobForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Verifikasi Rekomendasi &amp; Approval QC
                  </h3>
                  <p className="text-xs text-slate-400">
                    No. SPK: <span className="text-amber-400 font-mono font-bold">{selectedJobForReview.jobNo}</span> &bull; {selectedJobForReview.clientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForReview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Job summary card: 4 Data Utama Laporan Fumigasi */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-sm text-white">{selectedJobForReview.title}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {selectedJobForReview.jobType}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">🌾 Bahan Baku:</span>
                    <strong className="text-white text-xs block truncate" title={selectedJobForReview.rawMaterialName || selectedJobForReview.targetObject}>
                      {selectedJobForReview.rawMaterialName || selectedJobForReview.targetObject}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">🔒 Tanggal Tutup:</span>
                    <strong className="text-blue-200 font-mono text-xs block">
                      {selectedJobForReview.closingDate || selectedJobForReview.executionDate}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">🔓 Tanggal Buka:</span>
                    <strong className="text-amber-200 font-mono text-xs block">
                      {selectedJobForReview.openingDate || selectedJobForReview.aerationDate || '-'}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">🧪 Jumlah Obat:</span>
                    <strong className="text-rose-300 font-mono text-xs block">
                      {formatNumberID(selectedJobForReview.medicineQuantity)} {selectedJobForReview.medicineUnit}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500">Klien / Lokasi:</span> {selectedJobForReview.clientName} ({selectedJobForReview.location})
                  </div>
                  <div>
                    <span className="text-slate-500">Nama Obat:</span> {selectedJobForReview.medicineName}
                  </div>
                  <div>
                    <span className="text-slate-500">Teknisi Pelaksana:</span> {selectedJobForReview.operatorName}
                  </div>
                  {selectedJobForReview.gasConcentrationPpm !== undefined && (
                    <div>
                      <span className="text-slate-500">Gas Terukur:</span> {selectedJobForReview.gasConcentrationPpm} ppm
                    </div>
                  )}
                  {selectedJobForReview.exposureHours !== undefined && (
                    <div>
                      <span className="text-slate-500">Waktu Paparan:</span> {selectedJobForReview.exposureHours} Jam
                    </div>
                  )}
                  {selectedJobForReview.jobType !== 'FUMIGASI' && selectedJobForReview.fuelName && (
                    <div>
                      <span className="text-slate-500">BBM Pelarut:</span> {selectedJobForReview.fuelName} ({selectedJobForReview.fuelQuantity} {selectedJobForReview.fuelUnit || 'L'})
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Pilih Rekomendasi QC (Menyesuaikan antara Fumigasi vs Spraying & Fogging) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    {selectedJobForReview.jobType === 'SPRAYING_FOGGING' ? (
                      <Bug className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Flame className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      1. Rekomendasi Hasil Pekerjaan (
                      {selectedJobForReview.jobType === 'SPRAYING_FOGGING' ? 'Spraying & Fogging Pest Control' : 'Fumigasi Karantina'}
                      ):
                    </span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedJobForReview.jobType === 'SPRAYING_FOGGING'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {selectedJobForReview.jobType === 'SPRAYING_FOGGING' ? 'Efikasi Fogging' : 'Standar ISPM-15'}
                  </span>
                </div>

                {selectedJobForReview.jobType === 'SPRAYING_FOGGING' ? (
                  /* ================= REKOMENDASI KHUSUS SPRAYING & FOGGING ================= */
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* OK - Spraying & Fogging */}
                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('OK');
                          setReviewApproval('APPROVED');
                          setReviewNotes(
                            'Aplikasi spraying & fogging memenuhi standar teknis. Penetrasi asap dan droplet merata di seluruh gudang, lethal dose tercapai, hama sasaran mati tuntas (knockdown 100%), dosis insektisida dan pelarut BBM sesuai SOP.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'OK'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>OK (Hama Tuntas / Lolos QC)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Penetrasi asap &amp; droplet merata, mortalitas hama 100%, dosis obat &amp; pelarut BBM sesuai.
                        </p>
                      </button>

                      {/* Belum OK - Spraying & Fogging */}
                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('BELUM_OK');
                          setReviewApproval('PENDING');
                          setReviewNotes(
                            'Penetrasi fogging di sudut gudang / celah palet belum optimal. Hama terbang masih teramati aktif. Diperlukan spraying spot-treatment tambahan dan ventilasi diperpanjang.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'BELUM_OK'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-400 mb-1">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Belum OK (Perlu Spot Treatment)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Droplet belum merata di blind spot / sudut tumpukan. Perlu penyemprotan lokal tambahan.
                        </p>
                      </button>

                      {/* Spraying Ulang */}
                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('SPRAYING_ULANG');
                          setReviewApproval('REJECTED');
                          setReviewNotes(
                            'Kegagalan penanganan hama: tingkat kematian hama sasaran rendah (efikasi tidak tercapai) atau residu tidak mencukupi. Wajib dilakukan aplikasi penyemprotan & pengasapan (Spraying & Fogging) ulang.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'SPRAYING_ULANG' || reviewRecommendation === 'FUMIGASI_ULANG'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-rose-400 mb-1">
                          <RotateCcw className="w-4 h-4 shrink-0" />
                          <span>Spraying &amp; Fogging Ulang</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Populasi hama masih aktif tinggi / efikasi gagal. Wajib dilakukan spraying &amp; fogging ulang.
                        </p>
                      </button>
                    </div>

                    {/* Quick Checklist Chips for Spraying & Fogging */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Checklist / Parameter Evaluasi QC Spraying &amp; Fogging:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '✓ Penetrasi droplet & asap merata ke seluruh ruangan',
                          '✓ Rasio campuran insektisida & BBM pelarut tepat',
                          '✓ Tingkat kematian (knockdown) hama sasaran 100%',
                          '⚠️ Perlu spot spraying tambahan di sudut celah palet',
                          '⚠️ Periksa ventilasi ruangan sebelum akses pekerja',
                          '✓ Operator mematuhi K3 dan respirator gas aktif',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setReviewNotes((prev) => (prev ? `${prev} ${chip}.` : `${chip}.`));
                            }}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= REKOMENDASI KHUSUS FUMIGASI ================= */
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('OK');
                          setReviewApproval('APPROVED');
                          setReviewNotes(
                            'Konsentrasi gas PH3 dan waktu paparan memenuhi standar karantina ISPM-15. Mortalitas hama 100%. Lolos uji QC & dinyatakan OK.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'OK'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>OK (Selesai / Lolos)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Standar konsentrasi gas &amp; lethal dose tercapai. Hama target mati total.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('BELUM_OK');
                          setReviewApproval('PENDING');
                          setReviewNotes(
                            'Konsentrasi gas menurun di bawah batas kritis. Diperlukan penambahan waktu paparan 24 jam & perbaikan penutup terpal.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'BELUM_OK'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-400 mb-1">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Belum OK (Tindakan)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Konsentrasi gas fluktuatif atau sungkup perlu diperbaiki sebelum aerasi.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewRecommendation('FUMIGASI_ULANG');
                          setReviewApproval('REJECTED');
                          setReviewNotes(
                            'Terjadi kebocoran gas masif / terpal sobek. Efikasi perlakuan gagal. Wajib dilakukan fumigasi ulang secara menyeluruh.'
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          reviewRecommendation === 'FUMIGASI_ULANG'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-rose-400 mb-1">
                          <RotateCcw className="w-4 h-4 shrink-0" />
                          <span>Fumigasi Ulang</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Perlakuan gagal total / hama masih aktif. Pekerjaan wajib diulang dari awal.
                        </p>
                      </button>
                    </div>

                    {/* Quick Checklist Chips for Fumigasi */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Checklist / Parameter Evaluasi QC Fumigasi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '✓ Konsentrasi gas PH3 mencapai target 500+ ppm',
                          '✓ Sungkup terpal kedap dan tertutup rapat',
                          '✓ Waktu paparan (exposure hours) terpenuhi penuh',
                          '⚠️ Sand snake sungkup terpal perlu diperbaiki',
                          '✓ Gas clearance aman sebelum aerasi selesai',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setReviewNotes((prev) => (prev ? `${prev} ${chip}.` : `${chip}.`));
                            }}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Status Approval */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  2. Status Approval Dokumen QC:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewApproval('APPROVED')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve (Disetujui)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewApproval('PENDING')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'PENDING'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Pending / Tunda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewApproval('REJECTED')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      reviewApproval === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    <span>Reject / Ditolak</span>
                  </button>
                </div>
              </div>

              {/* 3. Catatan Rekomendasi QC */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  3. Catatan Rekomendasi &amp; Berita Acara QC:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan catatan teknis hasil sampling gas, kondisi sungkup, keberadaan hama hidup, dan instruksi penanganan..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Inspector signature info */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Inspektur QC: <strong className="text-emerald-400">{currentUser.name}</strong></span>
                <span>Standar Barantan ISPM-15</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setSelectedJobForReview(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Rekomendasi &amp; Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Fumigation Report Print / Inspection Document Modal */}
      {selectedJobForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">Lembar Laporan Resmi Fumigasi &amp; Pest Control</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJobForPrint(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6 sm:p-8 bg-slate-950 text-slate-100 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Document Header */}
              <div className="border-b-2 border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                      LOGIX-WMS
                    </span>
                    <h2 className="text-lg font-black tracking-wider uppercase text-white">
                      BERITA ACARA LAPORAN PEKERJAAN FUMIGASI
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Standar Badan Karantina Indonesia &bull; Regulasi ISPM-15 &bull; Sertifikasi Bebas Hama Gudang
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono text-xs text-slate-300">
                  <div>No. Registrasi: <strong className="text-amber-400">{selectedJobForPrint.jobNo}</strong></div>
                  <div>Tgl Dokumen: {selectedJobForPrint.createdAt.slice(0, 10)}</div>
                </div>
              </div>

              {/* 4 DATA POKOK UTAMA FUMIGASI (Format Tabel Resmi) */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ringkasan Parameter Perlakuan Fumigasi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* 1. NAMA BAHAN BAKU */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">1. Nama Bahan Baku / Komoditas:</div>
                    <div className="text-base font-bold text-white">
                      {selectedJobForPrint.rawMaterialName || selectedJobForPrint.targetObject}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Klien: {selectedJobForPrint.clientName} &bull; Lokasi: {selectedJobForPrint.location}
                    </div>
                  </div>

                  {/* 2. JUMLAH OBAT */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-rose-400 uppercase">2. Jumlah Obat yang Digunakan:</div>
                    <div className="text-base font-mono font-bold text-rose-300">
                      {formatNumberID(selectedJobForPrint.medicineQuantity)} {selectedJobForPrint.medicineUnit}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Jenis Bahan Aktif: {selectedJobForPrint.medicineName} {selectedJobForPrint.medicineBatchNo && `(Batch: ${selectedJobForPrint.medicineBatchNo})`}
                    </div>
                  </div>

                  {/* 3. TANGGAL TUTUP */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-blue-400 uppercase">3. Tanggal Tutup (Mulai Fumigasi):</div>
                    <div className="text-base font-mono font-bold text-blue-200">
                      {selectedJobForPrint.closingDate || selectedJobForPrint.executionDate}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Pemasangan sungkup kedap gas &amp; injeksi fumigan
                    </div>
                  </div>

                  {/* 4. TANGGAL BUKA */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">4. Tanggal Buka (Aerasi &amp; Pelepasan Gas):</div>
                    <div className="text-base font-mono font-bold text-amber-200">
                      {selectedJobForPrint.openingDate || selectedJobForPrint.aerationDate || '-'}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Pembukaan terpal sungkup &amp; ventilasi gas aman
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Teknis Tambahan */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Waktu Retensi Paparan:</span>
                  <span className="font-mono font-bold text-white">{selectedJobForPrint.exposureHours || 120} Jam</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Konsentrasi Gas Terukur:</span>
                  <span className="font-mono font-bold text-amber-300">{selectedJobForPrint.gasConcentrationPpm || 500} ppm</span>
                </div>
                {selectedJobForPrint.jobType !== 'FUMIGASI' ? (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">BBM Pelarut / Mesin:</span>
                    <span className="font-medium text-white">{selectedJobForPrint.fuelName ? `${selectedJobForPrint.fuelName} (${selectedJobForPrint.fuelQuantity} ${selectedJobForPrint.fuelUnit || 'L'})` : 'N/A'}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Kondisi Sungkup:</span>
                    <span className="font-medium text-white truncate block">{selectedJobForPrint.tarpCondition || 'Terpal PVC Kedap Gas Rapat'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Target Hama:</span>
                  <span className="font-medium text-white">{selectedJobForPrint.targetPest || 'Hama Gudang / Kutu'}</span>
                </div>
              </div>

              {/* Status Rekomendasi & Evaluasi QC */}
              <div className="p-4 rounded-xl border bg-slate-900 border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">HASIL PEMERIKSAAN &amp; REKOMENDASI QUALITY CONTROL (QC):</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs ${
                    selectedJobForPrint.qcRecommendation === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : selectedJobForPrint.qcRecommendation === 'BELUM_OK'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {selectedJobForPrint.qcRecommendation === 'OK'
                      ? '✓ MEMENUHI STANDAR (OK)'
                      : selectedJobForPrint.qcRecommendation === 'BELUM_OK'
                      ? '⚠️ BELUM OK (TINDAKAN LANJUTAN)'
                      : '❌ WAJIB FUMIGASI ULANG'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  "{selectedJobForPrint.qcRecommendationNotes || 'Hasil inspeksi teknis lapangan memenuhi persyaratan standar perlakuan karantina.'}"
                </p>
              </div>

              {/* Signature Block */}
              <div className="grid grid-cols-2 gap-8 pt-4 text-xs">
                <div className="text-center p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase">Teknisi / Operator Pelaksana</div>
                  <div className="h-14 flex items-end justify-center font-serif text-slate-400 italic">
                    ( Tanda Tangan Lapangan )
                  </div>
                  <div className="font-bold text-white border-t border-slate-800 pt-1 mt-1">
                    {selectedJobForPrint.operatorName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {selectedJobForPrint.operatorNip || 'Operator Fumigasi Berlisensi'}
                  </div>
                </div>

                <div className="text-center p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-slate-400 text-[10px] uppercase">Inspektur Quality Control (QC)</div>
                  <div className="h-14 flex items-end justify-center font-serif text-emerald-400 italic">
                    [ TERVERIFIKASI SISTEM ]
                  </div>
                  <div className="font-bold text-emerald-300 border-t border-slate-800 pt-1 mt-1">
                    {selectedJobForPrint.qcInspector || 'Ratna Dewi, S.Si'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Badan Karantina ISPM-15 Validator
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Laporan Pekerjaan (Nama Bahan Baku, Tanggal Tutup, Tanggal Buka, Jumlah Obat) */}
      {selectedJobForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border-b border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Edit Laporan Pekerjaan
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedJobForEdit.jobNo}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Perbarui nama bahan baku, tanggal tutup, tanggal buka, dan jumlah dosis obat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForEdit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Highlight Notice */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3 text-xs text-blue-200">
                <FileCheck2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-300">Form Koreksi &amp; Penyuntingan Data Laporan:</span>
                  <p className="text-slate-300 mt-0.5">
                    Pastikan nama bahan baku, tanggal tutup (injeksi), tanggal buka (aerasi), dan dosis obat sesuai dengan pekerjaan aktual di gudang.
                  </p>
                </div>
              </div>

              {/* 4 PILAR UTAMA INPUT */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Package className="w-4 h-4" />
                  4 Data Pokok Pekerjaan (Wajib Terisi)
                </div>

                {/* 1. Nama Bahan Baku */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    1. Nama Bahan Baku / Komoditas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editRawMaterialName}
                    onChange={(e) => setEditRawMaterialName(e.target.value)}
                    placeholder="Contoh: Beras Premium, Jagung Pakan, Kedelai Impor, Tembakau Ekspor..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {/* Quick Suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                    {['Beras Premium', 'Jagung Pakan', 'Kedelai Impor', 'Tembakau Ekspor', 'Tepung Terigu', 'Gandum Bulk'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditRawMaterialName(preset)}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2 & 3. Tanggal Tutup & Tanggal Buka */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      2. Tanggal Tutup (Injeksi Gas) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={editClosingDate}
                      onChange={(e) => setEditClosingDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Waktu sungkup ditutup rapat</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      3. Tanggal Buka (Aerasi / Pelepasan) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={editOpeningDate}
                      onChange={(e) => setEditOpeningDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Waktu sungkup dibuka &amp; aerasi</span>
                  </div>
                </div>

                {/* 4. Dosis Obat & Nama Obat */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Beaker className="w-3.5 h-3.5 text-blue-400" />
                    4. Jumlah Dosis Obat &amp; Jenis Formula <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] text-slate-400 mb-1">Jumlah Dosis:</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editMedicineQuantity}
                        onChange={(e) => setEditMedicineQuantity(e.target.value)}
                        placeholder="Contoh: 1500"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Satuan Dosis:</label>
                      <select
                        value={editMedicineUnit}
                        onChange={(e) => setEditMedicineUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Gram">Gram</option>
                        <option value="Kg">Kg</option>
                        <option value="Liter">Liter</option>
                        <option value="Pellet">Pellet</option>
                        <option value="Canister">Canister</option>
                        <option value="Botol">Botol</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nama Formulasi Obat:</label>
                      <input
                        type="text"
                        value={editMedicineName}
                        onChange={(e) => setEditMedicineName(e.target.value)}
                        placeholder="Contoh: Phostoxin 56 TB"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Pendukung / Lapangan Tambahan */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Informasi Tambahan Pekerjaan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Klien / Perusahaan:</label>
                    <input
                      type="text"
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      placeholder="Nama PT / Klien..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Lokasi / Gudang:</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Contoh: Gudang B-03..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Hama:</label>
                    <input
                      type="text"
                      value={editTargetPest}
                      onChange={(e) => setEditTargetPest(e.target.value)}
                      placeholder="Contoh: Sitophilus oryzae..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Judul / Deskripsi SPK:</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Deskripsi SPK..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Catatan Lapangan:</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Kondisi sungkup plastik, kelembaban, atau catatan teknis..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              {canDeleteJob && onDeleteJobReport ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus laporan pekerjaan ${selectedJobForEdit.jobNo}? Data akan dihapus secara permanen.`)) {
                      onDeleteJobReport(selectedJobForEdit.id);
                      setSelectedJobForEdit(null);
                      onShowToast(`Laporan ${selectedJobForEdit.jobNo} berhasil dihapus.`);
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Laporan</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobForEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
