import React, { useMemo } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const formatDateLocal = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', []);
  const [notes] = useLocalStorage<DocumentNote[]>('my-monitor-notes', []);
  const [needs, setNeeds] = useLocalStorage<NeedItem[]>('my-monitor-needs', []);

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

  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Terminal Title Bar */}
      <div className="border border-[#1c2b3a] bg-[#0b1623] p-4 relative">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px] font-bold text-[#8b9bb4]">
            <span>// UNIT: CORE_STATISTICS</span>
            <span>{dateFormatted}</span>
          </div>
          <h2 className="text-base font-bold text-[#f0f0f0] tracking-wider mt-1">
            TERMINAL STATUS: <span className="text-[#00ff9d]">ONLINE</span>
          </h2>
          <p className="text-[#8b9bb4] text-[10px] leading-relaxed mt-1">
            Data secured on device. Caching systems active.
          </p>
        </div>
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
              className="bg-[#00ff9d] h-full transition-all duration-300" 
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
              className={`h-full transition-all duration-300 ${habitStats.lapsedBad > 0 ? 'bg-[#ff9f30]' : 'bg-[#00ff9d]'}`} 
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
                className="bg-[#00ff9d] h-full transition-all duration-300" 
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
