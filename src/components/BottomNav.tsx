import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  Sparkles, 
  ChevronUp, 
  X, 
  CheckCircle2, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navStage: 0 | 1 | 2; // 0: Hidden line handle, 1: Standard bottom bar, 2: Full Command Hub overlay
  setNavStage: (stage: 0 | 1 | 2) => void;
  unreadCount?: number;
  addSystemLog?: (title: string, message: string, type?: 'info' | 'alert' | 'success') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  setActiveTab,
  navStage,
  setNavStage,
  addSystemLog
}) => {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'DASHBOARD', 
      icon: LayoutDashboard, 
      tag: 'CORE',
      code: 'SYS.ANALYTICS',
      desc: 'Ringkasan performa harian, motivasi operator, dan statistik sistem.'
    },
    { 
      id: 'habits', 
      label: 'HABITS', 
      icon: Flame, 
      tag: 'DAILY',
      code: 'ROUTINE.STREAK',
      desc: 'Pelacak kebiasaan harian, statistik konsistensi, dan pengingat.'
    },
    { 
      id: 'calendar', 
      label: 'CALENDAR', 
      icon: Calendar, 
      tag: 'PLAN',
      code: 'EVENT.MATRIX',
      desc: 'Penjadwalan kegiatan harian dengan fitur finger drag selector.'
    },
    { 
      id: 'notes', 
      label: 'NOTES', 
      icon: BookOpen, 
      tag: 'DOCS',
      code: 'VAULT.NOTES',
      desc: 'Pengelola dokumen terenkripsi AES-256 dan spesifikasi teknis.'
    },
    { 
      id: 'needs', 
      label: 'FINANCE', 
      icon: ClipboardList, 
      tag: 'LOGS',
      code: 'FINANCE.LOGS',
      desc: 'Pencatatan Keuangan, Grafik Analitik, & Inventaris Kebutuhan.'
    },
  ];

  // Touch Drag / Swipe Up Detection on Bottom Bar
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const distanceY = touchStartY - touchEndY; // Positive if dragged UP

    if (distanceY > 30) {
      // Swipe UP: advance stage (0 -> 1 -> 2)
      if (navStage === 0) setNavStage(1);
      else if (navStage === 1) setNavStage(2);
    } else if (distanceY < -30) {
      // Swipe DOWN: retract stage (2 -> 1 -> 0)
      if (navStage === 2) setNavStage(1);
      else if (navStage === 1) setNavStage(0);
    }
    setTouchStartY(null);
  };

  const handleTabClick = (id: string, label: string) => {
    setPressedId(id);
    setActiveTab(id);
    if (addSystemLog) {
      addSystemLog('MODULE ACTIVATED', `Navigasi ke modul ${label}.`, 'info');
    }
    setTimeout(() => setPressedId(null), 400);
  };

  const handleSelectBagan = (id: string, label: string) => {
    setActiveTab(id);
    setNavStage(1); // Return to stage 1 bottom bar
    if (addSystemLog) {
      addSystemLog('COMMAND HUB LAUNCH', `Modul "${label}" diaktifkan via Command Hub Bagan.`, 'info');
    }
  };

  return (
    <>
      {/* TAHAP 2: Full Command Hub Bagan 5 Fitur Overlay */}
      {navStage === 2 && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#0b1623]/85 backdrop-blur-md animate-fade-slide-up select-none p-3 sm:p-5">
          {/* Scanline background overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px]" />
          
          <div className="w-full max-w-2xl mx-auto bg-[#0b1623] border-2 border-[#ff9f30] shadow-[0_0_40px_rgba(255,159,48,0.35)] rounded-3xl p-5 space-y-4 relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header Hub Bar */}
            <div className="flex items-center justify-between border-b border-[#1c2b3a] pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#ff9f30]/15 border border-[#ff9f30] rounded-xl">
                  <Layers className="w-5 h-5 text-[#ff9f30] animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-widest text-[#f0f0f0] uppercase flex items-center gap-2">
                    // TAHAP 2: COMMAND HUB BAGAN FITUR
                    <Sparkles className="w-3.5 h-3.5 text-[#00ff9d] animate-spin [animation-duration:8s]" />
                  </h3>
                  <p className="text-[9px] text-[#8b9bb4] uppercase tracking-wider mt-0.5">
                    Sentuh salah satu bagan fitur untuk navigasi langsung
                  </p>
                </div>
              </div>

              <button
                onClick={() => setNavStage(1)}
                className="p-1.5 text-[#8b9bb4] hover:text-white hover:bg-[#1c2b3a] border border-[#1c2b3a] transition-all rounded-full cursor-pointer"
                title="Tutup ke Tahap 1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid 5 Bagan Fitur Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto py-1 pr-1">
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectBagan(item.id, item.label)}
                    className={`p-4 border text-left transition-all duration-200 cursor-pointer rounded-2xl relative group flex items-start space-x-3.5 active:scale-95 ${
                      isCurrent
                        ? 'bg-[#ff9f30]/15 border-[#ff9f30] shadow-[0_0_20px_rgba(255,159,48,0.25)] scale-[1.02]'
                        : 'bg-[#1c2b3a]/20 border-[#1c2b3a] hover:border-[#ff9f30]/60 hover:bg-[#1c2b3a]/40 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Icon Box */}
                    <div className={`p-3 border shrink-0 transition-all rounded-xl ${
                      isCurrent 
                        ? 'bg-[#ff9f30] text-[#0b1623] border-[#ff9f30] shadow-md animate-icon-wiggle' 
                        : 'bg-[#1c2b3a]/40 text-[#ff9f30] border-[#1c2b3a] group-hover:border-[#ff9f30]/80'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold tracking-widest text-[#00ff9d] uppercase">
                          0{idx + 1} // {item.code}
                        </span>
                        {isCurrent && (
                          <span className="bg-[#00ff9d] text-[#0b1623] px-2 py-0.5 font-bold text-[7px] tracking-wider rounded-full uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> AKTIF
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-[#f0f0f0] tracking-wider uppercase flex items-center justify-between">
                        <span>{item.label}</span>
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isCurrent ? 'text-[#ff9f30] translate-x-1' : 'text-[#8b9bb4] group-hover:translate-x-1'}`} />
                      </h4>

                      <p className="text-[9.5px] text-[#8b9bb4] leading-snug line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hub Footer Note */}
            <div className="border-t border-[#1c2b3a] pt-3 flex justify-between items-center text-[8px] font-mono text-[#8b9bb4]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#ff9f30]" /> SENTUH UNTUK KEMBALI KE BAR TAHAP 1
              </span>
              <button
                onClick={() => setNavStage(1)}
                className="text-[#ff9f30] hover:underline uppercase font-bold"
              >
                [ KEMBALI KE DOCK BAR ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAHAP 0: Auto-Hide Line Handle (Hanya garis tipis bercahaya yang bisa ditarik) */}
      {navStage === 0 && (
        <div className="fixed md:absolute bottom-0 left-0 right-0 z-40 flex justify-center items-end pb-1 select-none animate-fade-slide-up">
          <button
            type="button"
            onClick={() => setNavStage(1)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="group bg-[#0b1623] border border-[#ff9f30] text-[#ff9f30] hover:text-white hover:bg-[#ff9f30] px-5 py-1 text-[8px] font-extrabold tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(255,159,48,0.5)] flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 animate-pulse"
            title="Ketuk atau Tarik Ke Atas untuk Membuka Bar Navigasi (Tahap 1)"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#ff9f30] group-hover:text-white animate-bounce" />
            <span>TAHAP 0: TARIK KE ATAS // UNLOCK NAV DOCK</span>
          </button>
        </div>
      )}

      {/* TAHAP 1: Standard Cyber Dock Navigation Bar */}
      {navStage === 1 && (
        <nav 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed md:absolute bottom-0 left-0 right-0 cyber-nav-dock cyber-nav-dock-responsive z-40 flex justify-around items-center h-20 px-2 select-none transition-all duration-300 animate-fade-slide-up"
        >
          {/* Background Cyber Scanline line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff9f30] to-transparent animate-pulse" />

          {/* Pull-Up Handle to Advance to Stage 2 (Bagan Command Hub) */}
          <button
            type="button"
            onClick={() => setNavStage(2)}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-50 bg-[#0b1623] border border-[#ff9f30] text-[#ff9f30] hover:text-white hover:bg-[#ff9f30] px-3 py-0.5 text-[7.5px] font-extrabold tracking-widest uppercase rounded-full shadow-[0_0_12px_rgba(255,159,48,0.4)] flex items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95"
            title="Tarik ke atas / Klik untuk Bagan Fitur Lengkap (Tahap 2)"
          >
            <ChevronUp className="w-3 h-3 text-[#ff9f30] animate-bounce" />
            <span>TAHAP 1: TARIK KE ATAS // BAGAN 5 FITUR</span>
          </button>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPressed = pressedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id, item.label)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 relative group cursor-pointer ${
                  isActive 
                    ? 'text-[#ff9f30]' 
                    : 'text-[#8b9bb4] hover:text-[#f0f0f0]'
                }`}
              >
                {/* Active Indicator Top Glow Line & Dot */}
                {isActive && (
                  <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#ff9f30] shadow-[0_0_12px_#ff9f30] rounded-full" />
                    <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-ping" />
                  </>
                )}

                {/* Glowing Animated Icon Container */}
                <div className={`p-1.5 transition-all duration-200 relative flex items-center justify-center rounded-xl ${
                  isActive 
                    ? 'bg-[#ff9f30]/15 border border-[#ff9f30]/80 shadow-[0_0_18px_rgba(255,159,48,0.4)] scale-110' 
                    : 'bg-transparent border border-transparent group-hover:border-[#1c2b3a] group-hover:bg-[#1c2b3a]/40'
                } ${isPressed ? 'animate-icon-wiggle' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'text-[#ff9f30] stroke-[2.5]' : 'text-[#8b9bb4] group-hover:scale-110'
                  }`} />
                  
                  {isActive && (
                    <Sparkles className="w-2.5 h-2.5 text-[#00ff9d] absolute -top-1 -right-1 animate-spin [animation-duration:6s]" />
                  )}
                </div>

                {/* Label Text */}
                <span className={`text-[8px] font-bold tracking-widest mt-1 transition-all ${
                  isActive ? 'text-[#ff9f30] font-extrabold scale-105' : 'text-[#8b9bb4] group-hover:text-[#f0f0f0]'
                }`}>
                  {item.label}
                </span>

                {/* Micro Tag Badge */}
                <span className={`text-[6px] font-mono tracking-tighter opacity-70 uppercase transition-opacity ${
                  isActive ? 'text-[#00ff9d] opacity-100 font-bold' : 'text-[#8b9bb4] group-hover:opacity-100'
                }`}>
                  {item.tag}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};

export default BottomNav;
