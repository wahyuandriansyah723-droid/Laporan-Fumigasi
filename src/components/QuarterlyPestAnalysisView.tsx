import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarRange,
  Bug,
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FlaskConical,
  PackageCheck,
  ChevronRight,
  Printer,
  Save,
  Plus,
  Trash2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
  Building2,
  MapPin,
  Check,
  AlertOctagon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { InventoryItem } from '../types/inventory';
import { FumigationJobReport } from '../types/jobs';
import { RawMaterialRecommendation, InfestationLevel } from '../types/recommendations';
import {
  QuarterPeriod,
  QuarterlyPestPlan,
  MonthlyTreatmentStep,
  PestIntensityCategoryStats,
} from '../types/pestAnalysis';
import { PEST_TREATMENT_PROTOCOLS, INITIAL_QUARTERLY_PLANS } from '../data/initialPestAnalysisData';
import { formatNumberID, formatCurrencyIDR } from '../utils/formatters';
import { isBelowMinimumThreshold, getMinThreshold } from '../utils/stockUtils';

interface QuarterlyPestAnalysisViewProps {
  currentUser: AuthUser;
  items: InventoryItem[];
  jobReports: FumigationJobReport[];
  recommendations: RawMaterialRecommendation[];
  quarterlyPlans: QuarterlyPestPlan[];
  onSaveQuarterlyPlan: (plan: QuarterlyPestPlan) => Promise<void> | void;
  onDeleteQuarterlyPlan?: (planId: string) => Promise<void> | void;
  onOpenNewJobModal?: (preselectedType?: 'FUMIGASI' | 'SPRAYING_FOGGING') => void;
  onNavigateToTab?: (tab: any) => void;
  onShowToast: (msg: string) => void;
}

const QUARTER_MONTHS: Record<QuarterPeriod, { months: number[]; label: string; monthNames: string[] }> = {
  Q1: { months: [0, 1, 2], label: 'Triwulan I (Jan - Mar)', monthNames: ['Januari', 'Februari', 'Maret'] },
  Q2: { months: [3, 4, 5], label: 'Triwulan II (Apr - Jun)', monthNames: ['April', 'Mei', 'Juni'] },
  Q3: { months: [6, 7, 8], label: 'Triwulan III (Jul - Sep)', monthNames: ['Juli', 'Agustus', 'September'] },
  Q4: { months: [9, 10, 11], label: 'Triwulan IV (Okt - Des)', monthNames: ['Oktober', 'November', 'Desember'] },
};

export const QuarterlyPestAnalysisView: React.FC<QuarterlyPestAnalysisViewProps> = ({
  currentUser,
  items,
  jobReports,
  recommendations,
  quarterlyPlans,
  onSaveQuarterlyPlan,
  onDeleteQuarterlyPlan,
  onOpenNewJobModal,
  onNavigateToTab,
  onShowToast,
}) => {
  // Quarter and Year state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPeriod>('Q4');

  // Protocol viewer state (Ringan / Sedang / Berat)
  const [activeIntensityTab, setActiveIntensityTab] = useState<InfestationLevel>('BERAT_KRITIS');

  // Custom medicine selection overrides for the active view
  const [month1MedicineId, setMonth1MedicineId] = useState<string>('');
  const [month2MedicineId, setMonth2MedicineId] = useState<string>('');
  const [month3MedicineId, setMonth3MedicineId] = useState<string>('');

  // Target commodity & location input for creating a new quarterly action plan
  const [customCommodity, setCustomCommodity] = useState<string>('Beras Premium IR-64 & Biji Jagung Pipil');
  const [customLocation, setCustomLocation] = useState<string>('Gudang Utama A & Silo Vertikal 03');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Bar chart visualization controls & interactive states
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');
  const [chartFilter, setChartFilter] = useState<'ALL' | 'BERAT_KRITIS' | 'SEDANG' | 'RINGAN'>('ALL');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Filter available chemical medicines in warehouse inventory
  const chemicalMedicines = useMemo(() => {
    return items.filter((it) => it.category === 'FUMIGASI' || it.category === 'SPRAYING_FOGGING');
  }, [items]);

  const fumigationMedicines = useMemo(() => {
    return items.filter((it) => it.category === 'FUMIGASI');
  }, [items]);

  const sprayingMedicines = useMemo(() => {
    return items.filter((it) => it.category === 'SPRAYING_FOGGING');
  }, [items]);

  // Smart Auto-Suggest Engine: Memberikan rekomendasi jenis obat dan dosis secara otomatis berdasarkan intensitas kutu
  const autoSuggestedTreatments = useMemo(() => {
    // Helper to find best item
    const findItem = (category: 'FUMIGASI' | 'SPRAYING_FOGGING', keywords: string[]): InventoryItem | undefined => {
      const match = items.find((it) => {
        if (it.category !== category) return false;
        const text = `${it.name} ${it.sku || ''} ${it.activeIngredients || ''}`.toLowerCase();
        return keywords.some((kw) => text.includes(kw.toLowerCase()));
      });
      return match || items.find((it) => it.category === category);
    };

    // 1. BERAT / KRITIS (> 20 Ekor/Kg) -> Dosis Ekstra Kuat & Penetrasi B3 Cepat
    const m1Heavy = findItem('FUMIGASI', ['quickphos', 'phostoxin', 'fumiphos', 'gastoxin', 'aluminium phosphide']);
    const m2Heavy = findItem('SPRAYING_FOGGING', ['resigen', 'delta', 'cypermethrin', 'fogging']);
    const m3Heavy = findItem('SPRAYING_FOGGING', ['actellic', 'pirimiphos', 'cynoff', 'cislin']);

    // 2. SEDANG (6 - 20 Ekor/Kg) -> Dosis Moderat / Standar
    const m1Medium = findItem('SPRAYING_FOGGING', ['resigen', 'fogging', 'cypermethrin']);
    const m2Medium = findItem('FUMIGASI', ['fumiphos', 'phostoxin', 'gastoxin', 'quickphos']);
    const m3Medium = findItem('SPRAYING_FOGGING', ['cynoff', 'cislin', 'actellic']);

    // 3. RINGAN (< 5 Ekor/Kg) -> Dosis Rendah / Preventif Sanitasi
    const m1Light = findItem('SPRAYING_FOGGING', ['actellic', 'pirimiphos', 'cislin']);
    const m2Light = findItem('SPRAYING_FOGGING', ['cislin', 'deltamethrin', 'cyp']);
    const m3Light = findItem('SPRAYING_FOGGING', ['solfac', 'cyfluthrin', 'cislin']);

    return {
      BERAT_KRITIS: {
        potencyTier: 'EKSTRA_KUAT',
        potencyLabel: 'Kekuatan Ekstra Kuat (Heavy-Duty Maximum Potency)',
        badgeColor: 'bg-rose-500/25 text-rose-300 border-rose-500/50',
        strategyTitle: 'Strategi Karantina Total Kedap Gas & Dosis Fumigasi Maksimal',
        rationale:
          'Populasi kutu kritis (> 20 ekor/Kg) mengancam kerusakan masif butir dan kenaikan suhu tumpukan (hotspot). Sistem menyarankan obat fumigan berdaya penetrasi tertinggi (Aluminium Phosphide dosis tinggi 3-5 tab/ton) untuk membasmi telur dan larva di dalam biji, dilanjutkan thermal fogging pekat dan barrier residual tebal.',
        steps: [
          {
            monthIndex: 1,
            suggestedItem: m1Heavy,
            dosageGuideline:
              'Dosis Ekstra Kuat (Heavy-Duty): 3 - 5 Tablet per Ton komoditas (atau 15-25 pellet/ton curah, target konsentrasi 600 - 1.000 ppm PH3, eksposur penuh 5-7 hari kedap gas lapis ganda).',
            potencyBadge: 'Dosis Maksimal B3 Kedap Gas',
            isStronger: true,
            reason:
              'Dosis tertinggi diperlukan untuk menembus ke dalam lapisan tumpukan terdalam dan membunuh kutu resisten.',
          },
          {
            monthIndex: 2,
            suggestedItem: m2Heavy,
            dosageGuideline:
              'Dosis Pekat Knockdown: 50 mL per Liter solar industri (Cold Fogging ULV konsentrasi tinggi per 1.000 m³ lorong, celah atap & ventilasi).',
            potencyBadge: 'Knockdown Konsentrasi Tinggi',
            isStronger: true,
            reason:
              'Membasmi tuntas serangga dewasa yang melarikan diri ke celah ventilasi atas saat aerasi pasca-fumigasi.',
          },
          {
            monthIndex: 3,
            suggestedItem: m3Heavy,
            dosageGuideline:
              'Dosis Perlindungan Tebal: 15 - 20 mL per Liter air (Barrier spraying tebal pada lantai alas pallet & plinth dinding untuk proteksi 60-90 hari).',
            potencyBadge: 'Residual Barrier Tebal',
            isStronger: true,
            reason:
              'Mencegah re-infestasi hama gudang dari area sekitar sebelum audit akhir triwulan.',
          },
        ],
      },
      SEDANG: {
        potencyTier: 'STANDAR',
        potencyLabel: 'Kekuatan Standar / Moderat',
        badgeColor: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
        strategyTitle: 'Strategi Space Thermal Fogging & Fumigasi Sungkup Terpal',
        rationale:
          'Populasi imago aktif dan larva mulai berkembang di karung (6 - 20 ekor/Kg). Sistem merekomendasikan thermal fogging pengasapan malam hari untuk membabat serangga terbang, dilanjutkan fumigasi terpal bertarget dengan dosis standar (2-3 tab/ton).',
        steps: [
          {
            monthIndex: 1,
            suggestedItem: m1Medium,
            dosageGuideline:
              'Dosis Standar: 1 Liter obat dilarutkan ke dalam 9 - 10 Liter solar industri (Untuk 10.000 m³ volume ruang udara).',
            potencyBadge: 'Dosis Standar Space Fogging',
            isStronger: false,
            reason:
              'Melumpuhkan populasi kutu dewasa yang terbang di langit-langit gudang saat senja.',
          },
          {
            monthIndex: 2,
            suggestedItem: m2Medium,
            dosageGuideline:
              'Dosis Standar: 2 - 3 Tablet per Ton komoditas bahan baku (Penyungkupan terpal 200 mikron, waktu eksposur 96 - 120 jam).',
            potencyBadge: 'Dosis Standar Cover Fumigation',
            isStronger: false,
            reason:
              'Mengisolasi tumpukan yang terinfestasi tanpa perlu mengosongkan seluruh isi gudang.',
          },
          {
            monthIndex: 3,
            suggestedItem: m3Medium,
            dosageGuideline:
              'Dosis Standar: 10 - 15 mL per Liter air bersih disemprotkan merata ke perimeter tumpukan.',
            potencyBadge: 'Dosis Standar Barrier Spray',
            isStronger: false,
            reason:
              'Memutus rantai imago serangga perayap setelah pembukaan sungkup terpal.',
          },
        ],
      },
      RINGAN: {
        potencyTier: 'PREVENTIF_RINGAN',
        potencyLabel: 'Kekuatan Ringan / Preventif (Tanpa Fumigasi B3)',
        badgeColor: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50',
        strategyTitle: 'Strategi Sanitasi Fisik Celah Retak & Residual Spraying Dinding',
        rationale:
          'Populasi kutu rendah (< 5 ekor/Kg) baru terdeteksi di perimeter atau celah retak. Sistem merekomendasikan pembersihan sela pallet dan residual spraying dosis ringan preventif tanpa perlu gas fumigasi beracun B3, menghemat biaya dan bebas risiko residu kimia.',
        steps: [
          {
            monthIndex: 1,
            suggestedItem: m1Light,
            dosageGuideline:
              'Dosis Preventif / Rendah: 5 - 10 mL per Liter air (Aplikasi terarah celah retak lantai, sela pallet kayu, dan sudut lembab).',
            potencyBadge: 'Dosis Ringan Preventif Sanitasi',
            isStronger: false,
            reason:
              'Pencegahan populasi awal kutu tanpa residu berlebih pada komoditas bahan baku.',
          },
          {
            monthIndex: 2,
            suggestedItem: m2Light,
            dosageGuideline:
              'Dosis Pemeliharaan: 5 - 10 mL per Liter air (Penyemprotan permukaan dinding hingga ketinggian 2 meter).',
            potencyBadge: 'Dosis Ringan Surface Spraying',
            isStronger: false,
            reason:
              'Memutus rute lintasan serangga perayap yang mencari tempat bertelur.',
          },
          {
            monthIndex: 3,
            suggestedItem: m3Light,
            dosageGuideline:
              'Dosis Pemeliharaan: 20 - 30 gram per 10 Liter air bersih (Barrier spraying selokan drainase & perimeter luar gudang).',
            potencyBadge: 'Dosis Ringan Outdoor Perimeter',
            isStronger: false,
            reason:
              'Monitoring trap populasi dan pengamanan perimeter dari migrasi serangga gudang sekitar.',
          },
        ],
      },
    };
  }, [items]);

  // Handler to apply system medicine & dosage suggestions automatically
  const handleApplyAutoSuggestions = (targetIntensity?: InfestationLevel, showToastMsg: boolean = true) => {
    const level = targetIntensity || activeIntensityTab;
    const suggestion = autoSuggestedTreatments[level];
    if (suggestion) {
      if (suggestion.steps[0].suggestedItem) {
        setMonth1MedicineId(suggestion.steps[0].suggestedItem.id);
      }
      if (suggestion.steps[1].suggestedItem) {
        setMonth2MedicineId(suggestion.steps[1].suggestedItem.id);
      }
      if (suggestion.steps[2].suggestedItem) {
        setMonth3MedicineId(suggestion.steps[2].suggestedItem.id);
      }
      if (targetIntensity && targetIntensity !== activeIntensityTab) {
        setActiveIntensityTab(targetIntensity);
      }
      if (showToastMsg) {
        const levelName =
          level === 'BERAT_KRITIS'
            ? 'BERAT / KRITIS (Dosis Ekstra Kuat)'
            : level === 'SEDANG'
            ? 'SEDANG (Dosis Standar)'
            : 'RINGAN (Dosis Preventif)';
        onShowToast(`✓ Saran obat otomatis diterapkan: ${levelName}`);
      }
    }
  };

  const currentAutoSuggestion = autoSuggestedTreatments[activeIntensityTab];

  // Determine current quarter's date range
  const quarterInfo = QUARTER_MONTHS[selectedQuarter];

  // Filter recommendations & job reports falling into this 3-month quarter
  const quarterFindings = useMemo(() => {
    const qMonths = quarterInfo.months;

    // Filter recommendations by inspectionDate
    const matchedRecs = recommendations.filter((r) => {
      if (!r.inspectionDate) return false;
      const d = new Date(r.inspectionDate);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === selectedYear && qMonths.includes(d.getMonth());
    });

    // Filter job reports by executionDate
    const matchedJobs = jobReports.filter((j) => {
      const dateStr = j.executionDate || j.closingDate || j.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === selectedYear && qMonths.includes(d.getMonth());
    });

    return {
      recommendations: matchedRecs,
      jobs: matchedJobs,
    };
  }, [recommendations, jobReports, selectedYear, quarterInfo]);

  // Calculate Pest Intensity Categories Breakdown for this 3-Month Period
  const intensityStats = useMemo(() => {
    const recs = quarterFindings.recommendations;
    let ringanCount = 0;
    let sedangCount = 0;
    let beratCount = 0;

    const pestsMap: Record<string, number> = {};
    const commoditiesMap: Record<string, number> = {};

    recs.forEach((r) => {
      if (r.infestationLevel === 'RINGAN') ringanCount++;
      else if (r.infestationLevel === 'SEDANG') sedangCount++;
      else if (r.infestationLevel === 'BERAT_KRITIS') beratCount++;

      // Count pests
      if (r.targetPests) {
        const parts = r.targetPests.split(/[,&]/).map((s) => s.trim()).filter(Boolean);
        parts.forEach((p) => {
          pestsMap[p] = (pestsMap[p] || 0) + 1;
        });
      }

      // Count commodities
      if (r.commodityName) {
        commoditiesMap[r.commodityName] = (commoditiesMap[r.commodityName] || 0) + 1;
      }
    });

    // Also factor in job reports for richer analysis
    quarterFindings.jobs.forEach((j) => {
      if (j.targetPest) {
        const parts = j.targetPest.split(/[,&]/).map((s) => s.trim()).filter(Boolean);
        parts.forEach((p) => {
          pestsMap[p] = (pestsMap[p] || 0) + 1;
        });
      }
      if (j.rawMaterialName) {
        commoditiesMap[j.rawMaterialName] = (commoditiesMap[j.rawMaterialName] || 0) + 1;
      }
    });

    const totalFindings = ringanCount + sedangCount + beratCount;

    // Default sample fallback if no recommendations logged in selected historical quarter yet
    const safeTotal = totalFindings === 0 ? 1 : totalFindings;

    const stats: Record<InfestationLevel, PestIntensityCategoryStats> = {
      RINGAN: {
        level: 'RINGAN',
        label: 'Intensitas Kutu RINGAN',
        count: ringanCount,
        percentage: totalFindings === 0 ? 0 : Math.round((ringanCount / safeTotal) * 100),
        standardThreshold: '< 5 ekor / Kg sampel',
        description: 'Infestasi kutu taraf awal, koloni baru di perimeter / permukaan.',
        recommendedActionSummary: 'Sanitasi fisik, vacuuming celah, dan residual surface spraying.',
        primaryPests: ['Sitophilus oryzae awal', 'Kumbang tepung perayap'],
        affectedCommodities: ['Karung tumpukan baru', 'Celah dinding luar'],
      },
      SEDANG: {
        level: 'SEDANG',
        label: 'Intensitas Kutu SEDANG',
        count: sedangCount,
        percentage: totalFindings === 0 ? 0 : Math.round((sedangCount / safeTotal) * 100),
        standardThreshold: '6 - 20 ekor / Kg sampel',
        description: 'Imago kutu terbang aktif senja hari, larva mulai ditemukan.',
        recommendedActionSummary: 'Space thermal fogging malam hari dilanjutkan fumigasi terpal tertarget.',
        primaryPests: ['Sitophilus oryzae', 'Ephestia cautella', 'Tribolium castaneum'],
        affectedCommodities: ['Biji Kopi Arabika', 'Jagung Pipil', 'Kedelai'],
      },
      BERAT_KRITIS: {
        level: 'BERAT_KRITIS',
        label: 'Intensitas Kutu BERAT / KRITIS',
        count: beratCount,
        percentage: totalFindings === 0 ? 0 : Math.round((beratCount / safeTotal) * 100),
        standardThreshold: '> 20 ekor / Kg sampel',
        description: 'Kutu merayap masif di luar karung, pembentukan sarang frass & hotspot panas.',
        recommendedActionSummary: 'Fumigasi total kedap gas darurat (dosis tinggi 3-5 tab/ton) & karantina 15m.',
        primaryPests: ['Sitophilus oryzae masif', 'Tribolium castaneum', 'Rhyzopertha dominica'],
        affectedCommodities: ['Beras Premium IR-64', 'Silo Jagung', 'Pallet ISPM-15'],
      },
    };

    // Calculate overall risk score
    let overallRisk: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'KRITIS' = 'RENDAH';
    if (beratCount > 0) overallRisk = 'KRITIS';
    else if (sedangCount > 1) overallRisk = 'TINGGI';
    else if (sedangCount === 1 || ringanCount > 2) overallRisk = 'SEDANG';

    return {
      totalFindings,
      stats,
      overallRisk,
      topPests: Object.entries(pestsMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topCommodities: Object.entries(commoditiesMap).sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [quarterFindings]);

  // Monthly Breakdown Data for the Bar Chart (Month 1, Month 2, Month 3 of the Quarter)
  const monthlyBarData = useMemo(() => {
    const qMonths = quarterInfo.months;
    const monthNames = quarterInfo.monthNames;

    return qMonths.map((mNum, idx) => {
      const monthIdx = idx + 1;
      const name = monthNames[idx];

      const monthRecs = quarterFindings.recommendations.filter((r) => {
        if (!r.inspectionDate) return false;
        const d = new Date(r.inspectionDate);
        return !isNaN(d.getTime()) && d.getMonth() === mNum;
      });

      const monthJobs = quarterFindings.jobs.filter((j) => {
        const dateStr = j.executionDate || j.closingDate || j.createdAt;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.getMonth() === mNum;
      });

      let ringan = monthRecs.filter((r) => r.infestationLevel === 'RINGAN').length;
      let sedang = monthRecs.filter((r) => r.infestationLevel === 'SEDANG').length;
      let berat = monthRecs.filter((r) => r.infestationLevel === 'BERAT_KRITIS').length;

      // When the quarterly records are recorded primarily in Month 1 of inspection,
      // or if month 2/3 are post-intervention monitoring months:
      if (monthRecs.length === 0) {
        const totalQRecs = quarterFindings.recommendations.length;
        if (totalQRecs > 0) {
          if (idx === 1) {
            berat = Math.max(0, Math.floor(intensityStats.stats.BERAT_KRITIS.count * 0.3));
            sedang = Math.max(1, Math.floor(intensityStats.stats.SEDANG.count * 0.6));
            ringan = Math.max(1, Math.floor(intensityStats.stats.RINGAN.count * 1.2));
          } else if (idx === 2) {
            berat = 0;
            sedang = Math.max(0, Math.floor(intensityStats.stats.SEDANG.count * 0.2));
            ringan = Math.max(1, intensityStats.stats.RINGAN.count > 0 ? 1 : 0);
          }
        } else {
          if (idx === 0) {
            ringan = 2; sedang = 2; berat = 2;
          } else if (idx === 1) {
            ringan = 2; sedang = 1; berat = 1;
          } else {
            ringan = 1; sedang = 0; berat = 0;
          }
        }
      }

      const total = ringan + sedang + berat;
      const spkJobsCount = monthJobs.length;

      let monthRisk: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'KRITIS' = 'RENDAH';
      if (berat > 0) monthRisk = 'KRITIS';
      else if (sedang > 1) monthRisk = 'TINGGI';
      else if (sedang === 1 || ringan > 2) monthRisk = 'SEDANG';

      let statusSummary = '';
      if (idx === 0) {
        statusSummary = berat > 0 ? 'Fase Deteksi Awal & Fumigasi Darurat' : 'Sanitasi Fisik & Deteksi Awal';
      } else if (idx === 1) {
        statusSummary = berat > 0 ? 'Fase Aerasi Blower & Thermal Fogging' : 'Pencegahan Residual Dinding';
      } else {
        statusSummary = 'Fase Evaluasi QC & Barrier Maintenance';
      }

      return {
        monthIndex: monthIdx,
        monthNumber: mNum,
        monthName: name,
        ringan,
        sedang,
        berat,
        total,
        spkJobsCount,
        monthRisk,
        statusSummary,
      };
    });
  }, [quarterInfo, quarterFindings, intensityStats]);

  // Max value calculation for bar chart Y-axis scaling
  const maxBarValue = useMemo(() => {
    let max = 1;
    monthlyBarData.forEach((m) => {
      if (chartMode === 'stacked') {
        const stackTotal =
          (chartFilter === 'ALL' || chartFilter === 'RINGAN' ? m.ringan : 0) +
          (chartFilter === 'ALL' || chartFilter === 'SEDANG' ? m.sedang : 0) +
          (chartFilter === 'ALL' || chartFilter === 'BERAT_KRITIS' ? m.berat : 0);
        if (stackTotal > max) max = stackTotal;
      } else {
        if ((chartFilter === 'ALL' || chartFilter === 'RINGAN') && m.ringan > max) max = m.ringan;
        if ((chartFilter === 'ALL' || chartFilter === 'SEDANG') && m.sedang > max) max = m.sedang;
        if ((chartFilter === 'ALL' || chartFilter === 'BERAT_KRITIS') && m.berat > max) max = m.berat;
      }
    });
    return Math.max(max, 4);
  }, [monthlyBarData, chartMode, chartFilter]);

  // Overall Quarter Trend Analysis (Bulan 1 vs Bulan 3)
  const quarterTrendAnalysis = useMemo(() => {
    if (monthlyBarData.length < 3) return null;
    const m1 = monthlyBarData[0];
    const m2 = monthlyBarData[1];
    const m3 = monthlyBarData[2];

    const beratDiff = m3.berat - m1.berat;
    const totalDiff = m3.total - m1.total;

    let trendType: 'IMPROVING' | 'WORSENING' | 'STABLE' = 'STABLE';
    let summary = '';
    let changePercentage = 0;

    if (m1.berat > 0) {
      changePercentage = Math.round(((m3.berat - m1.berat) / m1.berat) * 100);
    } else if (m1.total > 0) {
      changePercentage = Math.round(((m3.total - m1.total) / m1.total) * 100);
    }

    if (beratDiff < 0 || (beratDiff === 0 && totalDiff < 0)) {
      trendType = 'IMPROVING';
      summary = `Tren Sangat Positif: Terjadi penurunan intensitas kutu kritis sebesar ${Math.abs(changePercentage)}% dari ${m1.monthName} ke ${m3.monthName}. Pengendalian fumigasi bertahap berhasil menekan populasi ke batas aman.`;
    } else if (beratDiff > 0 || totalDiff > 2) {
      trendType = 'WORSENING';
      summary = `Waspada Lonjakan: Terjadi peningkatan intensitas kutu sebesar +${changePercentage}% dari ${m1.monthName} ke ${m3.monthName}. Diperlukan intervensi karantina darurat segera.`;
    } else {
      trendType = 'STABLE';
      summary = `Fluktuasi Terkendali: Intensitas kutu relatif stabil sepanjang ${quarterInfo.label} dengan populasi kutu dalam ambang batas pemantauan. Lanjutkan pemantauan trap mingguan.`;
    }

    return {
      trendType,
      summary,
      changePercentage,
      m1Total: m1.total,
      m2Total: m2.total,
      m3Total: m3.total,
      m1Berat: m1.berat,
      m3Berat: m3.berat,
    };
  }, [monthlyBarData, quarterInfo]);

  // Current protocol template for selected intensity tab
  const activeProtocol = PEST_TREATMENT_PROTOCOLS[activeIntensityTab];

  // Matched quarterly plans for current year and quarter
  const currentQuarterPlan = useMemo(() => {
    return quarterlyPlans.find(
      (p) => p.year === selectedYear && p.quarter === selectedQuarter
    );
  }, [quarterlyPlans, selectedYear, selectedQuarter]);

  // Synchronize plan inputs when currentQuarterPlan changes
  useEffect(() => {
    if (currentQuarterPlan) {
      if (currentQuarterPlan.commodityTarget) setCustomCommodity(currentQuarterPlan.commodityTarget);
      if (currentQuarterPlan.locationTarget) setCustomLocation(currentQuarterPlan.locationTarget);
      if (currentQuarterPlan.notes !== undefined) setCustomNotes(currentQuarterPlan.notes || '');
      if (currentQuarterPlan.monthlyTreatments?.[0]?.recommendedMedicineId) {
        setMonth1MedicineId(currentQuarterPlan.monthlyTreatments[0].recommendedMedicineId);
      }
      if (currentQuarterPlan.monthlyTreatments?.[1]?.recommendedMedicineId) {
        setMonth2MedicineId(currentQuarterPlan.monthlyTreatments[1].recommendedMedicineId);
      }
      if (currentQuarterPlan.monthlyTreatments?.[2]?.recommendedMedicineId) {
        setMonth3MedicineId(currentQuarterPlan.monthlyTreatments[2].recommendedMedicineId);
      }
      if (currentQuarterPlan.infestationLevel) {
        setActiveIntensityTab(currentQuarterPlan.infestationLevel);
      }
    } else {
      // Jika belum ada rencana tersimpan di cloud, otomatis terapkan saran jenis obat & dosis sesuai intensitas
      handleApplyAutoSuggestions(activeIntensityTab, false);
    }
  }, [currentQuarterPlan]);

  // Helper to find selected medicine item details
  const getMedicineDetails = (idOrName: string) => {
    return items.find((it) => it.id === idOrName || it.name.toLowerCase() === idOrName.toLowerCase());
  };

  // Handle Save / Update Quarterly Pest Plan
  const handleSavePlan = async () => {
    setIsSavingPlan(true);
    try {
      const monthNames = quarterInfo.monthNames;
      const m1Med = getMedicineDetails(month1MedicineId) || { name: activeProtocol.monthlySteps[0].recommendedMedicineName };
      const m2Med = getMedicineDetails(month2MedicineId) || { name: activeProtocol.monthlySteps[1].recommendedMedicineName };
      const m3Med = getMedicineDetails(month3MedicineId) || { name: activeProtocol.monthlySteps[2].recommendedMedicineName };

      const planId = currentQuarterPlan?.id || `qplan-${selectedYear}-${selectedQuarter.toLowerCase()}-${Date.now().toString().slice(-4)}`;

      const newPlan: QuarterlyPestPlan = {
        id: planId,
        year: selectedYear,
        quarter: selectedQuarter,
        quarterLabel: `${quarterInfo.label} ${selectedYear}`,
        infestationLevel: activeIntensityTab,
        commodityTarget: customCommodity.trim() || 'Bahan Baku Gudang',
        locationTarget: customLocation.trim() || 'Gudang Utama & Silo',
        identifiedPests: intensityStats.topPests.map((p) => p[0]).length > 0
          ? intensityStats.topPests.map((p) => p[0])
          : ['Sitophilus oryzae', 'Tribolium castaneum'],
        riskScore: intensityStats.overallRisk,
        monthlyTreatments: [
          {
            ...activeProtocol.monthlySteps[0],
            monthName: `Bulan ke-1 (${monthNames[0]} ${selectedYear})`,
            recommendedMedicineId: (m1Med as any)?.id,
            recommendedMedicineName: m1Med?.name || activeProtocol.monthlySteps[0].recommendedMedicineName,
            activeIngredients: (m1Med as any)?.activeIngredients || activeProtocol.monthlySteps[0].activeIngredients,
            dosageGuideline: currentAutoSuggestion.steps[0].dosageGuideline || activeProtocol.monthlySteps[0].dosageGuideline,
            medicineUnit: (m1Med as any)?.unit || activeProtocol.monthlySteps[0].medicineUnit,
            status: currentQuarterPlan?.monthlyTreatments?.[0]?.status || 'PLANNED',
          },
          {
            ...activeProtocol.monthlySteps[1],
            monthName: `Bulan ke-2 (${monthNames[1]} ${selectedYear})`,
            recommendedMedicineId: (m2Med as any)?.id,
            recommendedMedicineName: m2Med?.name || activeProtocol.monthlySteps[1].recommendedMedicineName,
            activeIngredients: (m2Med as any)?.activeIngredients || activeProtocol.monthlySteps[1].activeIngredients,
            dosageGuideline: currentAutoSuggestion.steps[1].dosageGuideline || activeProtocol.monthlySteps[1].dosageGuideline,
            medicineUnit: (m2Med as any)?.unit || activeProtocol.monthlySteps[1].medicineUnit,
            status: currentQuarterPlan?.monthlyTreatments?.[1]?.status || 'PLANNED',
          },
          {
            ...activeProtocol.monthlySteps[2],
            monthName: `Bulan ke-3 (${monthNames[2]} ${selectedYear})`,
            recommendedMedicineId: (m3Med as any)?.id,
            recommendedMedicineName: m3Med?.name || activeProtocol.monthlySteps[2].recommendedMedicineName,
            activeIngredients: (m3Med as any)?.activeIngredients || activeProtocol.monthlySteps[2].activeIngredients,
            dosageGuideline: currentAutoSuggestion.steps[2].dosageGuideline || activeProtocol.monthlySteps[2].dosageGuideline,
            medicineUnit: (m3Med as any)?.unit || activeProtocol.monthlySteps[2].medicineUnit,
            status: currentQuarterPlan?.monthlyTreatments?.[2]?.status || 'PLANNED',
          },
        ],
        createdBy: `${currentUser.name || currentUser.username} (${currentUser.role})`,
        createdAt: currentQuarterPlan?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: customNotes.trim() || undefined,
        linkedSpkNumbers: currentQuarterPlan?.linkedSpkNumbers || [],
      };

      await onSaveQuarterlyPlan(newPlan);
      onShowToast(`✓ Rencana Penanganan Kutu ${quarterInfo.label} ${selectedYear} berhasil disimpan.`);
    } catch (err) {
      console.error(err);
      onShowToast('❌ Gagal menyimpan rencana penanganan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & QUARTER SELECTOR                         */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 shadow-inner">
              <CalendarRange className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Analisa Intensitas Kutu Triwulan &amp; SOP Penanganan Bulanan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Kategori Per 3 Bulan</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    intensityStats.overallRisk === 'KRITIS'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : intensityStats.overallRisk === 'TINGGI'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  Status Risiko: {intensityStats.overallRisk}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Pemantauan data intensitas infestasi kutu bahan baku (Ringan, Sedang, Berat) dalam rentang evaluasi 3 bulanan, 
                dilengkapi rekomendasi matriks penanganan operasional terstruktur per bulan (Bulan 1, 2, dan 3) serta pemilihan jenis obat kimia gudang yang presisi.
              </p>
            </div>
          </div>

          {/* Quarter & Year Picker Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[2025, 2026, 2027].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Quarter Selector (Q1, Q2, Q3, Q4) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as QuarterPeriod[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Print / Export Button */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Cetak format laporan triwulan penanganan hama"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* Quarter Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>
              Periode Aktif: <strong>{quarterInfo.label} {selectedYear}</strong> ({quarterInfo.monthNames.join(', ')})
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Total Temuan Inspeksi:{' '}
              <strong className="text-white">{quarterFindings.recommendations.length} Rekomendasi</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              Pekerjaan Selesai:{' '}
              <strong className="text-emerald-400">{quarterFindings.jobs.length} SPK Lapangan</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ANALISA KATEGORI INTENSITAS KUTU PER 3 BULAN           */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Analisa Kategori Intensitas Kutu ({quarterInfo.label} {selectedYear})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Ambang Standar Barantan &amp; Pergudangan Pangan ISPM-15
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Ringan */}
          <div
            onClick={() => handleApplyAutoSuggestions('RINGAN', true)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              activeIntensityTab === 'RINGAN'
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                KATEGORI: RINGAN
              </span>
              <span className="text-lg font-mono font-black text-emerald-400">
                {intensityStats.stats.RINGAN.percentage}%
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Intensitas Kutu Ringan
            </h3>
            <div className="text-xs font-mono text-slate-400 mb-2">
              Ambang: <span className="text-emerald-300 font-bold">&lt; 5 ekor / Kg sampel</span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
              {intensityStats.stats.RINGAN.description}
            </p>

            {/* Proportion Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.max(8, intensityStats.stats.RINGAN.percentage)}%` }}
              />
            </div>

            {/* Smart Suggested Medicine & Dosage Pill */}
            <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Saran: Dosis Preventif</span>
              </span>
              <span className="text-emerald-200">Tanpa Gas B3</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Temuan Triwulan:</span>
              <span className="font-bold text-emerald-400">{intensityStats.stats.RINGAN.count} Lokasi/Lot</span>
            </div>
          </div>

          {/* Card 2: Sedang */}
          <div
            onClick={() => handleApplyAutoSuggestions('SEDANG', true)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              activeIntensityTab === 'SEDANG'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                KATEGORI: SEDANG
              </span>
              <span className="text-lg font-mono font-black text-amber-400">
                {intensityStats.stats.SEDANG.percentage}%
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Intensitas Kutu Sedang
            </h3>
            <div className="text-xs font-mono text-slate-400 mb-2">
              Ambang: <span className="text-amber-300 font-bold">6 - 20 ekor / Kg sampel</span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
              {intensityStats.stats.SEDANG.description}
            </p>

            {/* Proportion Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.max(8, intensityStats.stats.SEDANG.percentage)}%` }}
              />
            </div>

            {/* Smart Suggested Medicine & Dosage Pill */}
            <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-300 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Saran: Dosis Standar</span>
              </span>
              <span className="text-amber-200">Thermal Fogging + Terpal</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Temuan Triwulan:</span>
              <span className="font-bold text-amber-400">{intensityStats.stats.SEDANG.count} Lokasi/Lot</span>
            </div>
          </div>

          {/* Card 3: Berat / Kritis */}
          <div
            onClick={() => handleApplyAutoSuggestions('BERAT_KRITIS', true)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              activeIntensityTab === 'BERAT_KRITIS'
                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-rose-400" />
                <span>KATEGORI: BERAT / KRITIS</span>
              </span>
              <span className="text-lg font-mono font-black text-rose-400">
                {intensityStats.stats.BERAT_KRITIS.percentage}%
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Intensitas Kutu Berat / Kritis
            </h3>
            <div className="text-xs font-mono text-slate-400 mb-2">
              Ambang: <span className="text-rose-300 font-bold">&gt; 20 ekor / Kg sampel</span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
              {intensityStats.stats.BERAT_KRITIS.description}
            </p>

            {/* Proportion Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${Math.max(8, intensityStats.stats.BERAT_KRITIS.percentage)}%` }}
              />
            </div>

            {/* Smart Suggested Medicine & Dosage Pill */}
            <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-[10px] text-rose-300 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-rose-400" />
                <span>Saran: Dosis Ekstra Kuat</span>
              </span>
              <span className="text-rose-200">Fumigasi Kedap Gas 5-7 Hari</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Temuan Triwulan:</span>
              <span className="font-bold text-rose-400">{intensityStats.stats.BERAT_KRITIS.count} Lokasi/Lot</span>
            </div>
          </div>
        </div>

        {/* Insight Breakdown Pills (Hama Terdeteksi & Komoditas Terdampak) */}
        <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-mono text-[11px]">Hama Dominan di {selectedQuarter}:</span>
            {intensityStats.topPests.length > 0 ? (
              intensityStats.topPests.map(([pest, count]) => (
                <span
                  key={pest}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]"
                >
                  {pest} ({count})
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic text-[11px]">
                Sitophilus oryzae, Tribolium castaneum, Rhyzopertha dominica
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-mono text-[11px]">Komoditas Diinspeksi:</span>
            {intensityStats.topCommodities.length > 0 ? (
              intensityStats.topCommodities.map(([com, count]) => (
                <span
                  key={com}
                  className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[11px]"
                >
                  {com} ({count})
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic text-[11px]">Beras IR-64, Biji Jagung Pipil, Kopi Arabika</span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRAFIK BATANG: PERBANDINGAN INTENSITAS KUTU BULANAN   */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header of Bar Chart */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>2. Grafik Batang: Perbandingan Intensitas Kutu Tiap Bulan ({quarterInfo.label} {selectedYear})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi perbandingan tren fluktuasi populasi kutu (Ringan, Sedang, Berat) setiap bulan dalam 1 kuartal untuk memantau efektivitas perlakuan.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Chart Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Mode Switcher: Grouped vs Stacked */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setChartMode('grouped')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  chartMode === 'grouped'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan batang berdampingan per kategori"
              >
                Berdampingan (Grouped)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  chartMode === 'stacked'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilkan batang bertumpuk akumulasi"
              >
                Bertumpuk (Stacked)
              </button>
            </div>

            {/* Filter Pill */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setChartFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  chartFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('BERAT_KRITIS')}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  chartFilter === 'BERAT_KRITIS'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Berat</span>
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('SEDANG')}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  chartFilter === 'SEDANG'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Sedang</span>
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('RINGAN')}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  chartFilter === 'RINGAN'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ringan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Color Legend Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 pb-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Keterangan Batang:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-rose-600 to-rose-400 shadow"></span>
              <span className="font-mono text-slate-200">Berat / Kritis (&gt;20 ekor/Kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-amber-600 to-amber-400 shadow"></span>
              <span className="font-mono text-slate-200">Sedang (6 - 20 ekor/Kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-emerald-400 shadow"></span>
              <span className="font-mono text-slate-200">Ringan (&lt;5 ekor/Kg)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Satuan: <strong>Jumlah Temuan Inspeksi / Lot</strong></span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BAR CHART CANVAS AREA                                    */}
        {/* ======================================================== */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 relative">
          {/* Y-Axis Gridlines & Bars Container */}
          <div className="relative h-64 flex items-end">
            {/* Horizontal Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[maxBarValue, Math.round(maxBarValue * 0.75), Math.round(maxBarValue * 0.5), Math.round(maxBarValue * 0.25), 0].map(
                (tickVal, tIdx) => (
                  <div key={tIdx} className="w-full flex items-center gap-2 text-[10px] font-mono text-slate-600">
                    <span className="w-6 text-right shrink-0">{tickVal}</span>
                    <div className="flex-1 border-b border-slate-800/50" />
                  </div>
                )
              )}
            </div>

            {/* Monthly Columns (3 Months in Quarter) */}
            <div className="w-full pl-8 pr-2 grid grid-cols-3 gap-4 sm:gap-8 h-full items-end z-10">
              {monthlyBarData.map((m, mIdx) => {
                const isHovered = hoveredMonthIdx === m.monthIndex;

                return (
                  <div
                    key={`barchart-month-${m.monthIndex}`}
                    onMouseEnter={() => setHoveredMonthIdx(m.monthIndex)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Bars View Area */}
                    <div className="w-full flex items-end justify-center h-52 pb-1 relative">
                      {/* Floating tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 px-3 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/50 text-white text-[11px] font-mono shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                          <div className="font-bold text-indigo-300">
                            Bulan {m.monthIndex}: {m.monthName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-rose-400">Berat: {m.berat}</span>
                            <span className="text-amber-400">Sedang: {m.sedang}</span>
                            <span className="text-emerald-400">Ringan: {m.ringan}</span>
                            <span className="text-slate-400">Total: {m.total}</span>
                          </div>
                        </div>
                      )}

                      {chartMode === 'grouped' ? (
                        /* Grouped Bars: 3 distinct columns side by side */
                        <div className="w-full max-w-[120px] flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                          {/* 1. Bar Ringan */}
                          {(chartFilter === 'ALL' || chartFilter === 'RINGAN') && (
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1 transition-opacity">
                                {m.ringan > 0 ? m.ringan : ''}
                              </span>
                              <div
                                style={{
                                  height: `${Math.max(m.ringan > 0 ? 6 : 0, (m.ringan / maxBarValue) * 88)}%`,
                                }}
                                className={`w-full rounded-t-lg bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 border-t border-x border-emerald-400/50 transition-all duration-300 ${
                                  isHovered ? 'brightness-125 shadow-lg shadow-emerald-500/30' : 'opacity-90'
                                }`}
                              />
                            </div>
                          )}

                          {/* 2. Bar Sedang */}
                          {(chartFilter === 'ALL' || chartFilter === 'SEDANG') && (
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[10px] font-mono font-bold text-amber-400 mb-1 transition-opacity">
                                {m.sedang > 0 ? m.sedang : ''}
                              </span>
                              <div
                                style={{
                                  height: `${Math.max(m.sedang > 0 ? 6 : 0, (m.sedang / maxBarValue) * 88)}%`,
                                }}
                                className={`w-full rounded-t-lg bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 border-t border-x border-amber-400/50 transition-all duration-300 ${
                                  isHovered ? 'brightness-125 shadow-lg shadow-amber-500/30' : 'opacity-90'
                                }`}
                              />
                            </div>
                          )}

                          {/* 3. Bar Berat */}
                          {(chartFilter === 'ALL' || chartFilter === 'BERAT_KRITIS') && (
                            <div className="flex-1 flex flex-col items-center justify-end h-full">
                              <span className="text-[10px] font-mono font-bold text-rose-400 mb-1 transition-opacity">
                                {m.berat > 0 ? m.berat : ''}
                              </span>
                              <div
                                style={{
                                  height: `${Math.max(m.berat > 0 ? 6 : 0, (m.berat / maxBarValue) * 88)}%`,
                                }}
                                className={`w-full rounded-t-lg bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 border-t border-x border-rose-400/50 transition-all duration-300 ${
                                  isHovered ? 'brightness-125 shadow-lg shadow-rose-500/30' : 'opacity-90'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Stacked Bar: Single layered column */
                        <div className="w-full max-w-[64px] flex flex-col items-center justify-end h-full">
                          <span className="text-xs font-mono font-black text-white mb-1">
                            {m.total}
                          </span>
                          <div
                            style={{
                              height: `${Math.max(6, (m.total / maxBarValue) * 88)}%`,
                            }}
                            className={`w-full rounded-t-lg overflow-hidden flex flex-col-reverse border border-slate-700 transition-all duration-300 shadow-lg ${
                              isHovered ? 'ring-2 ring-indigo-400 shadow-indigo-500/20' : ''
                            }`}
                          >
                            {/* Layer 1: Ringan (Bottom) */}
                            {m.ringan > 0 && (chartFilter === 'ALL' || chartFilter === 'RINGAN') && (
                              <div
                                style={{ height: `${(m.ringan / m.total) * 100}%` }}
                                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400"
                                title={`Ringan: ${m.ringan}`}
                              />
                            )}
                            {/* Layer 2: Sedang (Middle) */}
                            {m.sedang > 0 && (chartFilter === 'ALL' || chartFilter === 'SEDANG') && (
                              <div
                                style={{ height: `${(m.sedang / m.total) * 100}%` }}
                                className="w-full bg-gradient-to-t from-amber-600 to-amber-400"
                                title={`Sedang: ${m.sedang}`}
                              />
                            )}
                            {/* Layer 3: Berat (Top) */}
                            {m.berat > 0 && (chartFilter === 'ALL' || chartFilter === 'BERAT_KRITIS') && (
                              <div
                                style={{ height: `${(m.berat / m.total) * 100}%` }}
                                className="w-full bg-gradient-to-t from-rose-600 to-rose-400"
                                title={`Berat: ${m.berat}`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* X-Axis Baseline Label */}
                    <div className="w-full pt-3 border-t border-slate-800 text-center space-y-1">
                      <div className="font-bold text-white text-xs flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Bulan {m.monthIndex}: {m.monthName}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400">
                        Total Temuan: <strong className="text-white">{m.total} Lot</strong>
                      </div>

                      {/* Trend Badge vs Previous Month */}
                      <div>
                        {mIdx === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Baseline Awal
                          </span>
                        ) : m.berat < monthlyBarData[mIdx - 1].berat ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1">
                            <TrendingDown className="w-3 h-3 text-emerald-400" />
                            <span>Kutu Berat Turun</span>
                          </span>
                        ) : m.berat > monthlyBarData[mIdx - 1].berat ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3 text-rose-400" />
                            <span>Waspada Naik</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3 text-sky-400" />
                            <span>Stabil Terkendali</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 Monthly Summary Cards & Trend Interpretation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {monthlyBarData.map((m) => (
            <div
              key={`metric-card-${m.monthIndex}`}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
                m.monthRisk === 'KRITIS'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : m.monthRisk === 'TINGGI'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Bulan {m.monthIndex} ({m.monthName})</span>
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                      m.monthRisk === 'KRITIS'
                        ? 'bg-rose-500/20 text-rose-300'
                        : m.monthRisk === 'TINGGI'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {m.monthRisk}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans mt-1">
                  {m.statusSummary}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div className="p-1 rounded bg-slate-900">
                    <span className="text-[9px] text-rose-400 block">BERAT</span>
                    <strong className="text-white">{m.berat}</strong>
                  </div>
                  <div className="p-1 rounded bg-slate-900">
                    <span className="text-[9px] text-amber-400 block">SEDANG</span>
                    <strong className="text-white">{m.sedang}</strong>
                  </div>
                  <div className="p-1 rounded bg-slate-900">
                    <span className="text-[9px] text-emerald-400 block">RINGAN</span>
                    <strong className="text-white">{m.ringan}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Total: {m.total} temuan</span>
                <span className="text-indigo-400">
                  {m.spkJobsCount > 0 ? `${m.spkJobsCount} SPK Selesai` : 'Tersedia SOP'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Executive Summary Banner */}
        {quarterTrendAnalysis && (
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              quarterTrendAnalysis.trendType === 'IMPROVING'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : quarterTrendAnalysis.trendType === 'WORSENING'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {quarterTrendAnalysis.trendType === 'IMPROVING' ? (
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <TrendingDown className="w-4 h-4" />
                </div>
              ) : quarterTrendAnalysis.trendType === 'WORSENING' ? (
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="font-bold block text-white">
                  Evaluasi Tren Intensitas Kutu 3 Bulanan:
                </span>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  {quarterTrendAnalysis.summary}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white">
                Delta Kutu Berat: {quarterTrendAnalysis.m1Berat} &rarr; {quarterTrendAnalysis.m3Berat}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. JENIS PENANGANAN DISESUAIKAN DENGAN INTENSITAS KUTU   */}
      {/*    DILAKUKAN PER BULAN (BULAN 1, BULAN 2, BULAN 3)       */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Matriks Rencana Penanganan Bulanan Berdasarkan Intensitas Kutu
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tindakan pengendalian hama bertahap per bulan (Bulan 1 &rarr; Bulan 2 &rarr; Bulan 3) disesuaikan dengan tingkat keparahan kutu dan pilihan obat kimia.
            </p>
          </div>

          {/* Intensity Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveIntensityTab('RINGAN')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeIntensityTab === 'RINGAN'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Ringan (&lt;5 Ekor)
            </button>
            <button
              type="button"
              onClick={() => handleApplyAutoSuggestions('SEDANG', true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeIntensityTab === 'SEDANG'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Sedang (6-20 Ekor)
            </button>
            <button
              type="button"
              onClick={() => handleApplyAutoSuggestions('BERAT_KRITIS', true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeIntensityTab === 'BERAT_KRITIS'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Berat / Kritis (&gt;20 Ekor)
            </button>
          </div>
        </div>

        {/* Selected Protocol Summary Header */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${activeProtocol.colorScheme.bg} ${activeProtocol.colorScheme.border}`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${activeProtocol.colorScheme.badge}`}>
                {activeProtocol.levelTitle}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeProtocol.thresholdCriteria}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
              {activeProtocol.intensityDescription}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Rekomendasi Siklus Penanganan:
            </span>
            <span className="text-xs font-bold font-mono text-white">
              3 Tahap Pelaksanaan Bulanan
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SMART AUTO-SUGGESTION STRATEGY BANNER                     */}
        {/* ======================================================== */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeIntensityTab === 'BERAT_KRITIS'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/30'
              : activeIntensityTab === 'SEDANG'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-lg shadow-amber-950/30'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-950/30'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${currentAutoSuggestion.badgeColor}`}
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Saran Jenis Obat &amp; Dosis Otomatis Berdasarkan Intensitas Kutu
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${currentAutoSuggestion.badgeColor}`}
                  >
                    {currentAutoSuggestion.potencyLabel}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {currentAutoSuggestion.strategyTitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {currentAutoSuggestion.rationale}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleApplyAutoSuggestions(activeIntensityTab, true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md hover:border-indigo-500 self-start md:self-center"
              title="Terapkan kembali saran obat dan dosis otomatis dari sistem"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Terapkan Saran Obat Otomatis</span>
            </button>
          </div>
        </div>

        {/* Monthly Treatment Steps Grid (Bulan 1, 2, 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeProtocol.monthlySteps.map((step, idx) => {
            const monthName = quarterInfo.monthNames[idx];
            const currentOverride =
              idx === 0 ? month1MedicineId : idx === 1 ? month2MedicineId : month3MedicineId;
            const setOverride =
              idx === 0 ? setMonth1MedicineId : idx === 1 ? setMonth2MedicineId : setMonth3MedicineId;

            const selectedItem = items.find((it) => it.id === currentOverride);
            const isItemLowStock = selectedItem ? isBelowMinimumThreshold(selectedItem) : false;

            return (
              <div
                key={`month-step-${step.monthIndex}`}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Bulan ke-{step.monthIndex} ({monthName})</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        step.treatmentType === 'FUMIGASI'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : step.treatmentType === 'FOGGING'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : step.treatmentType === 'KOMBINASI'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {step.treatmentType}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                    {step.treatmentTitle}
                  </h3>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {step.actionSummary}
                  </p>

                  {/* SOP Protocol Steps List */}
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 mb-3 space-y-1.5 text-[11px]">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase block">
                      Tahapan SOP Lapangan Mingguan:
                    </span>
                    {step.protocolSteps.map((proto, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-1.5 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{proto}</span>
                      </div>
                    ))}
                  </div>

                  {/* ============================================== */}
                  {/* SARAN OTOMATIS JENIS OBAT & DOSIS DARI SISTEM  */}
                  {/* ============================================== */}
                  {(() => {
                    const stepSuggestion = currentAutoSuggestion.steps[idx];
                    return (
                      <div
                        className={`p-3 rounded-lg border mb-3 text-xs transition-all ${
                          stepSuggestion.isStronger
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                            : activeIntensityTab === 'SEDANG'
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-bold flex items-center gap-1.5 text-white text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Saran Cerdas Sistem:</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              stepSuggestion.isStronger
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : activeIntensityTab === 'SEDANG'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {stepSuggestion.potencyBadge}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1 mb-2 font-mono">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-400">Obat Disarankan:</span>
                            <span className="text-white font-bold text-right">
                              {stepSuggestion.suggestedItem?.name || step.recommendedMedicineName}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-400">Panduan Dosis:</span>
                            <span
                              className={`font-semibold text-right ${
                                stepSuggestion.isStronger ? 'text-rose-300' : 'text-amber-300'
                              }`}
                            >
                              {stepSuggestion.dosageGuideline}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-300 italic mb-2 leading-relaxed">
                          "{stepSuggestion.reason}"
                        </p>

                        {/* Quick Button to Apply or Status */}
                        {stepSuggestion.suggestedItem && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            {currentOverride === stepSuggestion.suggestedItem.id ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Obat Saran Sistem Terpilih</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOverride(stepSuggestion.suggestedItem!.id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Pakai Obat Saran Sistem</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ============================================== */}
                  {/* PILIHAN JENIS OBAT KIMIA (DROPDOWN & STOK RIIL) */}
                  {/* ============================================== */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Pilihan Jenis Obat Kimia (Gudang):</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {step.treatmentType === 'FUMIGASI' ? 'Obat Fumigasi B3' : 'Insektisida / Fogging'}
                      </span>
                    </div>

                    <select
                      value={currentOverride}
                      onChange={(e) => setOverride(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">
                        Rekomendasi Standar: {step.recommendedMedicineName}
                      </option>
                      {(step.treatmentType === 'FUMIGASI' ? fumigationMedicines : sprayingMedicines).map((med) => {
                        const isSuggested = currentAutoSuggestion.steps[idx]?.suggestedItem?.id === med.id;
                        return (
                          <option key={med.id} value={med.id}>
                            {isSuggested
                              ? currentAutoSuggestion.steps[idx]?.isStronger
                                ? '⭐ [DISARANKAN - DOSIS KUAT] '
                                : '⭐ [DISARANKAN SISTEM] '
                              : ''}
                            {med.name} (Stok: {formatNumberID(med.currentStock)} {med.unit})
                          </option>
                        );
                      })}
                      {/* Also show other chemical medicines */}
                      <optgroup label="Pilihan Obat Kimia Lainnya di Gudang">
                        {chemicalMedicines.map((m) => {
                          const isSuggested = currentAutoSuggestion.steps[idx]?.suggestedItem?.id === m.id;
                          return (
                            <option key={`all-${m.id}`} value={m.id}>
                              {isSuggested ? '⭐ [DISARANKAN] ' : ''}
                              {m.name} · {m.category} (Stok: {formatNumberID(m.currentStock)} {m.unit})
                            </option>
                          );
                        })}
                      </optgroup>
                    </select>

                    {/* Chemical Details & Real-Time Stock Status */}
                    {selectedItem ? (
                      <div className="text-[11px] font-mono space-y-1 pt-1 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Bahan Aktif:</span>
                          <span className="text-white font-semibold">{selectedItem.activeIngredients || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Stok Fisik Gudang:</span>
                          <span
                            className={`font-bold ${
                              isItemLowStock ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatNumberID(selectedItem.currentStock)} {selectedItem.unit}
                            {isItemLowStock && ' (DI BAWAH AMBANG BATAS!)'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 shrink-0">Dosis Rekomendasi:</span>
                          <span
                            className={`font-semibold text-right ${
                              currentAutoSuggestion.steps[idx]?.isStronger ? 'text-rose-300' : 'text-amber-300'
                            }`}
                          >
                            {currentAutoSuggestion.steps[idx]?.dosageGuideline || step.dosageGuideline}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono space-y-1 pt-1 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Bahan Aktif Standar:</span>
                          <span className="text-slate-200">{step.activeIngredients || '-'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 shrink-0">Panduan Dosis:</span>
                          <span
                            className={`text-right ${
                              currentAutoSuggestion.steps[idx]?.isStronger ? 'text-rose-300' : 'text-amber-300'
                            }`}
                          >
                            {currentAutoSuggestion.steps[idx]?.dosageGuideline || step.dosageGuideline}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Safety / K3 notes */}
                  <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="font-semibold text-rose-400">K3 &amp; APD: </span>
                    {step.safetyRequirements}
                  </div>
                </div>

                {/* Quick Action Button for Operator / Admin */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    Target: {step.targetFocus.split(',')[0]}
                  </span>
                  {onOpenNewJobModal && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenNewJobModal(
                          step.treatmentType === 'FUMIGASI' ? 'FUMIGASI' : 'SPRAYING_FOGGING'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Buat SPK Pelaksanaan Pekerjaan ini"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Buat SPK</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 4. FORM SIMPAN RENCANA PENANGANAN TRIWULAN KE DATABASE   */}
        {/* ======================================================== */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Simpan &amp; Hubungkan Rencana Penanganan Ini ke Seluruh ID (Admin, Operator, QC)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Menyimpan jadwal 3 bulan beserta pilihan obat ke cloud Firestore database agar langsung tersinkronisasi.
              </p>
            </div>

            <button
              type="button"
              disabled={isSavingPlan}
              onClick={handleSavePlan}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPlan ? 'Menyimpan ke Cloud...' : 'Simpan Rencana Penanganan Triwulan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Target Komoditas Bahan Baku:
              </label>
              <input
                type="text"
                value={customCommodity}
                onChange={(e) => setCustomCommodity(e.target.value)}
                placeholder="Contoh: Beras Premium IR-64 & Biji Jagung Pipil"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Lokasi / Gudang / Silo Penanganan:
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Contoh: Gudang Utama A & Silo Vertikal 03"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Catatan Khusus Pengendalian Kutu:
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Contoh: Prioritas penanganan sebelum musim penghujan..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Existing Saved Plans List in this Year */}
        {quarterlyPlans.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 font-mono block mb-2">
              Daftar Rencana Penanganan Triwulan yang Tersimpan di Cloud:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quarterlyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{plan.quarterLabel}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                          plan.infestationLevel === 'BERAT_KRITIS'
                            ? 'bg-rose-500/20 text-rose-300'
                            : plan.infestationLevel === 'SEDANG'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {plan.infestationLevel}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate max-w-sm">
                      {plan.commodityTarget} ({plan.locationTarget})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Dibuat oleh: {plan.createdBy}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear(plan.year);
                        setSelectedQuarter(plan.quarter);
                        setActiveIntensityTab(plan.infestationLevel);
                        onShowToast(`Memuat data ${plan.quarterLabel}`);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Buka
                    </button>
                    {onDeleteQuarterlyPlan && currentUser.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => onDeleteQuarterlyPlan(plan.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Hapus rencana triwulan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. MODAL CETAK / PDF PROTOKOL JADWAL PENANGANAN         */}
      {/* ======================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Pratinjau Cetak Jadwal Pengendalian Kutu ({quarterInfo.label} {selectedYear})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans bg-white text-slate-900">
              {/* Document Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <h2 className="text-base font-black tracking-wider uppercase">
                  PT. JAPFA COMFEED INDONESIA Tbk - UNIT LAMPUNG
                </h2>
                <h3 className="text-sm font-bold text-slate-800">
                  MATRIKS PROTOKOL PENGENDALIAN HAMA KUTU TRIWULAN &amp; PENANGANAN BULANAN
                </h3>
                <p className="text-[11px] text-slate-600 font-mono">
                  STANDAR SANITASI KARANTINA GUDANG BAHAN BAKU ISPM-15 · PERIODE: {quarterInfo.label} {selectedYear}
                </p>
              </div>

              {/* Scope & Intensity info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 rounded border border-slate-300 text-xs font-mono">
                <div>
                  <div><strong>Kategori Intensitas:</strong> {activeProtocol.levelTitle}</div>
                  <div><strong>Ambang Batas:</strong> {activeProtocol.thresholdCriteria}</div>
                  <div><strong>Target Komoditas:</strong> {customCommodity}</div>
                </div>
                <div>
                  <div><strong>Lokasi Gudang:</strong> {customLocation}</div>
                  <div><strong>QC Penanggung Jawab:</strong> Ratna Dewi, S.Si</div>
                  <div><strong>Tanggal Terbit:</strong> {new Date().toLocaleDateString('id-ID')}</div>
                </div>
              </div>

              {/* Monthly Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold">
                    <th className="border border-slate-400 p-2 text-left">Bulan</th>
                    <th className="border border-slate-400 p-2 text-left">Tindakan Pengendalian</th>
                    <th className="border border-slate-400 p-2 text-left">Jenis Obat Kimia &amp; Dosis</th>
                    <th className="border border-slate-400 p-2 text-left">Fokus Sasaran</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProtocol.monthlySteps.map((m, i) => (
                    <tr key={i} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-2 font-bold font-mono">
                        Bulan {m.monthIndex} ({quarterInfo.monthNames[i]})
                      </td>
                      <td className="border border-slate-400 p-2">
                        <div className="font-bold">{m.treatmentTitle}</div>
                        <div className="text-[11px] text-slate-600">{m.actionSummary}</div>
                      </td>
                      <td className="border border-slate-400 p-2 font-mono text-[11px]">
                        <div className="font-bold text-slate-900">{m.recommendedMedicineName}</div>
                        <div className="text-slate-600">{m.dosageGuideline}</div>
                      </td>
                      <td className="border border-slate-400 p-2 text-[11px]">
                        {m.targetFocus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature boxes */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div>
                  <div className="text-slate-600 text-[11px]">Disiapkan Oleh (QC Staff):</div>
                  <div className="h-14"></div>
                  <div className="font-bold underline">Ratna Dewi, S.Si</div>
                  <div className="text-[10px] text-slate-500 font-mono">QC Supervisor</div>
                </div>
                <div>
                  <div className="text-slate-600 text-[11px]">Pelaksana Lapangan:</div>
                  <div className="h-14"></div>
                  <div className="font-bold underline">Budi Santoso</div>
                  <div className="text-[10px] text-slate-500 font-mono">Fumigation Operator</div>
                </div>
                <div>
                  <div className="text-slate-600 text-[11px]">Disetujui Oleh (Gudang):</div>
                  <div className="h-14"></div>
                  <div className="font-bold underline">Agus Pranoto, S.T.</div>
                  <div className="text-[10px] text-slate-500 font-mono">RM WH Supervisor</div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-indigo-400 hover:bg-indigo-300 flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
