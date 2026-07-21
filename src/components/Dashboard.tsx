import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Habit } from './HabitTracker';
import type { DocumentNote } from './DocumentManager';
import type { NeedItem } from './NeedsLogger';
import { 
  Flame, 
  BookOpen, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight,
  Award,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const DASHBOARD_QUOTES = [
  { text: "Disiplin adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" },
  { text: "Tindakan adalah kunci dasar untuk semua kesuksesan.", author: "Pablo Picasso" },
  { text: "Jangan habiskan waktu memukul dinding, berharap mengubahnya menjadi pintu.", author: "Coco Chanel" },
  { text: "Cara terbaik untuk memprediksi masa depan adalah dengan menciptakannya.", author: "Peter Drucker" },
  { text: "Fokus pada prosesnya, bukan hanya pada hasil akhirnya.", author: "F'Cube Monitor" },
  { text: "Kecerdasan tanpa ambisi bagaikan burung tanpa sayap.", author: "Salvador Dali" },
  { text: "Kemajuan hari demi hari yang sedikit demi sedikit akan menghasilkan hasil yang luar biasa.", author: "Robin Sharma" }
];

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  pin: string;
  addSystemLog?: (title: string, message: string, type?: 'info' | 'alert' | 'success') => void;
}

const formatDateLocal = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, pin }) => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', [], pin);
  const [notes] = useLocalStorage<DocumentNote[]>('my-monitor-notes', [], pin);
  const [needs, setNeeds] = useLocalStorage<NeedItem[]>('my-monitor-needs', [], pin);

  const todayStr = formatDateLocal(new Date());

  // Habit metrics calculation
  const habitStats = useMemo(() => {
    const goodHabits = habits.filter(h => h.type === 'good');
    const badHabits = habits.filter(h => h.type === 'bad');

    const totalGood = goodHabits.length;
    const completedGood = goodHabits.filter(h => !!h.history[todayStr]).length;

    const totalBad = badHabits.length;
    const avoidedBad = badHabits.filter(h => !h.history[todayStr]).length;
    const lapsedBad = totalBad - avoidedBad;

    const goodCompletionPercent = totalGood > 0 ? Math.round((completedGood / totalGood) * 100) : 0;
    const badAvoidedPercent = totalBad > 0 ? Math.round((avoidedBad / totalBad) * 100) : 0;

    return {
      totalGood,
      completedGood,
      goodCompletionPercent,
      totalBad,
      avoidedBad,
      lapsedBad,
      badAvoidedPercent
    };
  }, [habits, todayStr]);

  // Budget calculations
  const budgetStats = useMemo(() => {
    let neededTotal = 0;
    let purchasedTotal = 0;
    
    needs.forEach(item => {
      const cost = item.estimatedCost * item.qty;
      if (item.status === 'purchased') {
        purchasedTotal += cost;
      } else {
        neededTotal += cost;
      }
    });

    return { neededTotal, purchasedTotal };
  }, [needs]);

  // High priority needs pending
  const highPriorityAlerts = useMemo(() => {
    return needs.filter(item => item.priority === 'high' && item.status === 'needed');
  }, [needs]);

  // Toggle habit checkbox directly from Dashboard
  const toggleHabitStatus = (habitId: string) => {
    setHabits(
      habits.map(habit => {
        if (habit.id === habitId) {
          const history = { ...habit.history };
          if (history[todayStr]) {
            delete history[todayStr];
          } else {
            history[todayStr] = true;
          }
          return { ...habit, history };
        }
        return habit;
      })
    );
  };

  // Mark a high priority need as purchased directly
  const purchaseNeedItem = (itemId: string) => {
    setNeeds(
      needs.map(item => item.id === itemId ? { ...item, status: 'purchased', updatedAt: new Date().toISOString() } : item)
    );
  };

  // 7-day consistency scoring index
  const consistencyIndex = useMemo(() => {
    if (habits.length === 0) return 100;

    const totalTrackableDays = 7;
    let totalPossibleCompletions = habits.length * totalTrackableDays;
    let actualCompletions = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateLocal(d);

      habits.forEach(habit => {
        if (habit.type === 'good') {
          if (habit.history[dateStr]) actualCompletions++;
        } else {
          if (!habit.history[dateStr]) actualCompletions++;
        }
      });
    }

    return Math.round((actualCompletions / totalPossibleCompletions) * 100);
  }, [habits]);

  // Category distribution analysis for Needs
  const categoryBreakdown = useMemo(() => {
    const breakdown: { [cat: string]: number } = {};
    needs.forEach(item => {
      const cost = item.estimatedCost * item.qty;
      breakdown[item.category] = (breakdown[item.category] || 0) + cost;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [needs]);

  const [quoteIdx, setQuoteIdx] = useState<number>(() => Math.floor(Math.random() * DASHBOARD_QUOTES.length));

  const handleNextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % DASHBOARD_QUOTES.length);
  };

  const currentQuote = DASHBOARD_QUOTES[quoteIdx];

  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-5 animate-fade-slide-up">
      {/* Quick Access Module Hub (5 Fitur Utama) */}
      <div className="bg-[#0b1623] border border-[#1c2b3a] p-4 rounded-2xl space-y-3 shadow-lg">
        <div className="flex justify-between items-center text-[9px] font-bold text-[#ff9f30] uppercase tracking-widest border-b border-[#1c2b3a] pb-2">
          <span>// QUICK ACCESS: 5 MODULE FITUR UTAMA</span>
          <span className="text-[#00ff9d]">{dateFormatted}</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="p-2.5 bg-[#ff9f30]/15 border border-[#ff9f30] text-[#ff9f30] rounded-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[7.5px] font-extrabold tracking-wider uppercase">CORE</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] hover:border-[#ff9f30] text-[#8b9bb4] hover:text-[#ff9f30] rounded-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-[#ff9f30]" />
            <span className="text-[7.5px] font-extrabold tracking-wider uppercase">HABITS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] hover:border-[#ff9f30] text-[#8b9bb4] hover:text-[#ff9f30] rounded-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#ff9f30]" />
            <span className="text-[7.5px] font-extrabold tracking-wider uppercase">CALENDAR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] hover:border-[#ff9f30] text-[#8b9bb4] hover:text-[#ff9f30] rounded-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#00ff9d]" />
            <span className="text-[7.5px] font-extrabold tracking-wider uppercase">NOTES</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('needs')}
            className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] hover:border-[#ff9f30] text-[#8b9bb4] hover:text-[#ff9f30] rounded-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#00ff9d]" />
            <span className="text-[7.5px] font-extrabold tracking-wider uppercase">FINANCE</span>
          </button>
        </div>
      </div>

      {/* Terminal Title Bar */}
      <div className="border border-[#1c2b3a] bg-[#0b1623] p-4 rounded-2xl relative shadow-lg">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px] font-bold text-[#8b9bb4]">
            <span>// UNIT: CORE_STATISTICS</span>
            <span>SYSTEM HEALTH // 100%</span>
          </div>
          <h2 className="text-base font-bold text-[#f0f0f0] tracking-wider mt-1 flex items-center justify-between">
            <span>TERMINAL STATUS: <span className="text-[#00ff9d] animate-pulse">ONLINE</span></span>
            <span className="text-[9px] font-mono text-[#ff9f30] bg-[#ff9f30]/10 px-2 py-0.5 border border-[#ff9f30]/30">
              OPERATOR LVL.{Math.max(1, Math.floor(consistencyIndex / 20))}
            </span>
          </h2>
          <p className="text-[#8b9bb4] text-[10px] leading-relaxed mt-1 flex flex-wrap items-center gap-1.5">
            <span>Data secured on device.</span>
            <span className="text-[#00ff9d] bg-[#1c2b3a]/50 px-1 font-bold text-[8px] tracking-tight uppercase border border-[#00ff9d]/25">
              AES_SEEDED_SECURED
            </span>
          </p>
        </div>
      </div>

      {/* Motivational Mindset Card */}
      <div className="border border-[#1c2b3a] bg-[#1c2b3a]/15 p-3.5 relative overflow-hidden group hover:border-[#ff9f30]/50 transition-all">
        <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-2 mb-2 text-[9px] font-bold text-[#8b9bb4]">
          <span className="flex items-center gap-1 text-[#ff9f30]">
            <Sparkles className="w-3 h-3 text-[#ff9f30] animate-spin [animation-duration:8s]" />
            // DAILY MOTIVATION & INSPIRATION
          </span>
          <button
            onClick={handleNextQuote}
            className="flex items-center gap-1 text-[8px] text-[#8b9bb4] hover:text-[#ff9f30] transition-colors px-1.5 py-0.5 border border-[#1c2b3a] bg-[#0b1623]"
            title="Ganti Motivasi"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>REROLL</span>
          </button>
        </div>
        <p className="text-xs italic text-[#f0f0f0] leading-relaxed select-none">
          "{currentQuote.text}"
        </p>
        <p className="text-[8px] font-bold text-[#ff9f30] tracking-widest uppercase text-right mt-1.5">
          — {currentQuote.author}
        </p>
      </div>

      {/* Grid Dashboard Widgets */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Good Habits rate */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">ROUTINES TODAY</span>
              <h4 className="text-lg font-bold text-[#f0f0f0]">{habitStats.goodCompletionPercent}%</h4>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#00ff9d]" />
          </div>
          <div className="w-full bg-[#1c2b3a] h-1.5 overflow-hidden">
            <div 
              className="shimmer-bar h-full transition-all duration-300" 
              style={{ width: `${habitStats.goodCompletionPercent}%` }} 
            />
          </div>
        </div>

        {/* Bad habits rate */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">AVOIDED LAPSE</span>
              <h4 className="text-lg font-bold text-[#f0f0f0]">{habitStats.badAvoidedPercent}%</h4>
            </div>
            {habitStats.lapsedBad > 0 ? (
              <ShieldAlert className="w-4 h-4 text-[#ff9f30]" />
            ) : (
              <Award className="w-4 h-4 text-[#00ff9d]" />
            )}
          </div>
          <div className="w-full bg-[#1c2b3a] h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${habitStats.lapsedBad > 0 ? 'bg-[#ff9f30]' : 'shimmer-bar'}`} 
              style={{ width: `${habitStats.badAvoidedPercent}%` }} 
            />
          </div>
        </div>

        {/* Notes total */}
        <button 
          onClick={() => setActiveTab('notes')}
          className="app-card p-3.5 flex flex-col justify-between text-left group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">DOCUMENTS</span>
              <h4 className="text-lg font-bold text-[#f0f0f0]">{notes.length}</h4>
            </div>
            <BookOpen className="w-4 h-4 text-[#8b9bb4] group-hover:text-[#ff9f30] transition-colors" />
          </div>
          <span className="text-[8px] font-bold text-[#8b9bb4] group-hover:text-[#ff9f30] flex items-center gap-1 mt-1">
            OPEN DATABASE <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        {/* Needs budget */}
        <button
          onClick={() => setActiveTab('needs')}
          className="app-card p-3.5 flex flex-col justify-between text-left group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">BUDGET REQ.</span>
              <h4 className="text-sm font-bold text-[#f0f0f0] truncate max-w-[120px]">
                Rp {budgetStats.neededTotal.toLocaleString('id-ID')}
              </h4>
            </div>
            <ShoppingBag className="w-4 h-4 text-[#8b9bb4] group-hover:text-[#ff9f30] transition-colors" />
          </div>
          <span className="text-[8px] font-bold text-[#8b9bb4] group-hover:text-[#ff9f30] flex items-center gap-1 mt-1">
            OPEN LIST <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      {/* Checklist */}
      <div className="app-card p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-2 text-[9px] font-bold text-[#8b9bb4]">
          <span>// TODAY_CHECKLIST</span>
          <span>SELECT DONE</span>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-6">
            <Flame className="w-6 h-6 text-[#1c2b3a] mx-auto mb-1" />
            <p className="text-[#8b9bb4] text-[10px]">No habits configured. Create habits in the HABITS tab.</p>
            <button 
              onClick={() => setActiveTab('habits')}
              className="mt-2 bg-[#1c2b3a] hover:bg-[#ff9f30] hover:text-[#0b1623] text-[#f0f0f0] text-[9px] font-bold px-2 py-1 transition-all border border-[#1c2b3a]"
            >
              CONFIGURE HABITS
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#1c2b3a] max-h-[220px] overflow-y-auto pr-1">
            {habits.map(habit => {
              const isChecked = !!habit.history[todayStr];
              const isGood = habit.type === 'good';
              return (
                <div key={habit.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h4 className={`font-bold truncate ${isChecked && isGood ? 'text-[#8b9bb4] line-through' : 'text-[#f0f0f0]'}`}>
                      {habit.name}
                    </h4>
                    <p className="text-[8px] text-[#8b9bb4] flex items-center gap-1 mt-0.5 uppercase">
                      <span className={`w-1 h-1 ${isGood ? 'bg-[#00ff9d]' : 'bg-[#ff9f30]'}`} />
                      <span>{habit.type} habit</span>
                    </p>
                  </div>

                  <button
                    onClick={() => toggleHabitStatus(habit.id)}
                    className={`px-2.5 py-1 text-[9px] font-bold transition-all border shrink-0 ${
                      isGood 
                        ? isChecked 
                          ? 'bg-[#1c2b3a] border-[#1c2b3a] text-[#00ff9d]' 
                          : 'bg-transparent border-[#1c2b3a] text-[#f0f0f0] hover:border-[#ff9f30] hover:text-[#ff9f30]'
                        : isChecked
                          ? 'bg-[#1c2b3a] border-[#ff9f30]/40 text-[#ff9f30]'
                          : 'bg-[#1c2b3a]/30 border-[#1c2b3a] text-[#00ff9d] hover:border-[#ff9f30]'
                    }`}
                  >
                    {isGood 
                      ? isChecked ? 'COMPLETED' : 'EXECUTE'
                      : isChecked ? 'LAPSED' : 'AVOIDED'
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Needs alerts */}
      <div className="app-card p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-2 text-[9px] font-bold text-[#8b9bb4]">
          <span>// WARN_INVENTORY_ACQUISITION</span>
          <span className="text-[#ff9f30] flex items-center gap-1">
            ALERT <AlertTriangle className="w-3 h-3 text-[#ff9f30]" />
          </span>
        </div>

        {highPriorityAlerts.length === 0 ? (
          <div className="text-center py-6 text-[#8b9bb4]">
            <CheckCircle2 className="w-6 h-6 text-[#00ff9d]/10 mx-auto mb-1" />
            <p className="text-[10px]">No pending high priority items.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {highPriorityAlerts.map(item => (
              <div key={item.id} className="p-2.5 bg-[#0b1623] border border-[#ff9f30]/30 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-[#f0f0f0] truncate leading-snug">{item.name}</p>
                  <p className="text-[8px] text-[#8b9bb4] block pt-0.5">Est. Rp {item.estimatedCost.toLocaleString('id-ID')}</p>
                </div>
                <button
                  onClick={() => purchaseNeedItem(item.id)}
                  className="bg-[#1c2b3a] hover:bg-[#ff9f30] hover:text-[#0b1623] text-white font-bold text-[8px] tracking-wider px-2 py-1 transition-colors border border-[#1c2b3a]"
                >
                  ACQUIRED
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consistency Index & Budget Allocations */}
      <div className="app-card p-4 space-y-4">
        <div className="text-[9px] font-bold text-[#8b9bb4] border-b border-[#1c2b3a] pb-2">
          <span>// ANALYTICS_SYSTEM</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-[10px] font-bold text-[#8b9bb4]">
              <span>7-DAY CONSISTENCY INDEX</span>
              <span className="text-[#00ff9d]">{consistencyIndex}%</span>
            </div>
            <div className="w-full bg-[#1c2b3a] h-2 overflow-hidden">
              <div 
                className="shimmer-bar h-full transition-all duration-300" 
                style={{ width: `${consistencyIndex}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-[#1c2b3a]/50 pt-3">
            <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">BUDGET ALLOCATION BY CATEGORY</span>
            {categoryBreakdown.length === 0 ? (
              <p className="text-[9px] text-[#8b9bb4] italic py-2 text-center">No cost items logged.</p>
            ) : (
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {categoryBreakdown.map(([cat, cost]) => (
                  <div key={cat} className="flex justify-between items-center text-[10px] text-[#8b9bb4]">
                    <span className="font-semibold">{cat.toUpperCase()}</span>
                    <span className="text-[#f0f0f0] font-bold">Rp {cost.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
