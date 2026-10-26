import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Flame, Droplets, HeartPulse, FileText } from 'lucide-react';

interface MSDSSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MSDSSafetyModal: React.FC<MSDSSafetyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'PH3' | 'CH3BR' | 'BBM' | 'INSECT'>('PH3');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Panduan Tanggap Darurat & Keselamatan K3 HazMat Gudang
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PH3')}
            className={`py-2 px-3 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'PH3'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☠️ Aluminium Phosphide (Fosfin PH3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CH3BR')}
            className={`py-2 px-3 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'CH3BR'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☣️ Methyl Bromide (CH3Br)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BBM')}
            className={`py-2 px-3 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'BBM'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 Solar B35 & Pertamax 92
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INSECT')}
            className={`py-2 px-3 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'INSECT'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠️ Insektisida (Malathion/Cyper)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 text-xs text-slate-300 space-y-4 max-h-[70vh] overflow-y-auto leading-relaxed">
          {activeTab === 'PH3' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 font-medium">
                PERINGATAN TINGGI: Aluminium Phosphide (Phostoxin/Quickphos) bereaksi spontan dengan uap air menghasilkan gas Fosfin (PH3) yang sangat beracun dan mudah meledak pada konsentrasi pekat (&gt;18.000 ppm).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Alat Pelindung Diri (APD) Wajib
                  </h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Masker Full-Face Mask (misal: 3M 6800).</li>
                    <li>Canister Filter Gas Beracun standar ABEK2P3.</li>
                    <li>Detektor Gas PH3 portabel digital dengan alarm.</li>
                    <li>Sarung tangan katun bersih kering saat memegang kaleng.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    Pertolongan Pertama (First Aid)
                  </h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Pindahkan korban ke udara segar seketika.</li>
                    <li>Baringkan korban dan hangatkan tubuhnya.</li>
                    <li>Bila sesak napas, berikan bantuan oksigen murni.</li>
                    <li>Segera bawa ke Rumah Sakit terdekat (informasikan paparan gas Fosfin).</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <h5 className="font-bold text-amber-400 mb-1">Penyimpanan di Gudang:</h5>
                <p>
                  Simpan hanya di bunker/ruangan berventilasi baik khusus bahan kimia berbahaya. Dilarang keras kontak dengan air, hujan, atau kelembaban tinggi. Jangan biarkan kaleng terbuka di dalam ruangan tertutup.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CH3BR' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 font-medium">
                Methyl Bromide (CH3Br) adalah gas tak berwarna dan tak berbau. Dilengkapi 2% Chloropicrin sebagai agen peringatan (pedas di mata/tenggorokan). Merupakan depresan sistem saraf pusat kuat.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white">Protokol Penanganan Tabung</h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Pastikan katup silinder terlindung dengan tutup pengaman (cap).</li>
                    <li>Ikat tabung silinder tegak pada rak besi anti goyang.</li>
                    <li>Gunakan vaporiser (pemanas) saat mengalirkan gas untuk mencegah pembekuan selang.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white">Batas Aman Clearance Ekspor</h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Kawasan fumigasi baru boleh dibuka setelah aerasi mencapai konsentrasi &lt; 5 ppm.</li>
                    <li>Gunakan detektor halide lamp atau photoionization detector (PID).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BBM' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 font-medium">
                Solar B35 dan Pertamax 92 adalah hidrokarbon mudah menyala. Uap Pertamax lebih berat dari udara dan dapat terakumulasi di sudut lantai gudang.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Penanggulangan Kebakaran
                  </h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Gunakan APAR jenis Foam (Busa AFFF) atau Dry Chemical Powder (ABC).</li>
                    <li>DILARANG menggunakan air langsung karena minyak akan mengapung dan memperluas kobaran.</li>
                    <li>Putus suplai listrik genset dan pompa transfer BBM seketika.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    Tumpahan Minyak (Spill Control)
                  </h5>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    <li>Gunakan oil spill kit: serbuk gergaji kering atau absorbent pad.</li>
                    <li>Bendung aliran dengan sandbag agar tidak masuk got/saluran air.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INSECT' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-500/30 text-yellow-300 font-medium">
                Insektisida Organofosfat (Malathion) dan Sintetik Piretroid (Cypermethrin/Deltamethrin). Malathion menghambat enzim asetilkolinesterase; Cypermethrin mengiritasi saluran napas dan mata.
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <h5 className="font-bold text-white">Gejala Keracunan & Antidotum</h5>
                <p>
                  Gejala Malathion: Mual, pusing berputar, miosis (pupil mengecil), keringat dingin, kram perut. <strong>Antidotum spesifik:</strong> Atropin Sulfat di bawah pengawasan dokter medis darurat.
                </p>
                <p>
                  Jika terkena kulit: Segera cuci dengan air mengalir dan sabun deterjen lembut minimal 15 menit. Lepaskan pakaian yang terkontaminasi.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Panduan K3
          </button>
        </div>
      </div>
    </div>
  );
};
