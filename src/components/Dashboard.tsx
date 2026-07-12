import React, { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Habit } from './HabitTracker';
import type { DocumentNote } from './DocumentManager';
import type { NeedItem } from './NeedsLogger';
import { 
  TrendingUp, 
  Flame, 
  BookOpen, 
  ShoppingBag, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Award,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

// Local helper to format dates consistently as YYYY-MM-DD
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
    // For bad habits, history[date] === true means they failed/lapsed.
    // "Avoided" means no record (lapsed === false)
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

    // Check completion counts for the last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateLocal(d);

      habits.forEach(habit => {
        if (habit.type === 'good') {
          // Success if checked
          if (habit.history[dateStr]) actualCompletions++;
        } else {
          // Success if NOT checked
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
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Top Welcome Panel - Clean Slate Accent Design */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-xs border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 px-3 py-1 rounded-full w-max text-xs font-semibold text-emerald-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateFormatted}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, <span className="text-emerald-400">Optimizer!</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md">
              Everything is running offline. Keep your local records clean and progress will follow.
            </p>
          </div>

          <div className="flex bg-slate-800/40 backdrop-blur-md border border-slate-750 px-5 py-4 rounded-xl items-center space-x-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Routine</span>
              <p className="font-extrabold text-white text-lg leading-none">
                {habitStats.completedGood}/{habitStats.totalGood} Done
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Dashboard Widget stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Good Habits rate */}
        <div className="app-card p-5 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routines Today</span>
              <h4 className="text-2xl font-black text-slate-900">{habitStats.goodCompletionPercent}%</h4>
            </div>
            <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${habitStats.goodCompletionPercent}%` }} 
            />
          </div>
        </div>

        {/* Bad habits rate */}
        <div className="app-card p-5 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avoided Lapses</span>
              <h4 className="text-2xl font-black text-slate-900">{habitStats.badAvoidedPercent}%</h4>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${habitStats.lapsedBad > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {habitStats.lapsedBad > 0 ? <ShieldAlert className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${habitStats.lapsedBad > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${habitStats.badAvoidedPercent}%` }} 
            />
          </div>
        </div>

        {/* Notes total */}
        <button 
          onClick={() => setActiveTab('notes')}
          className="app-card p-5 flex flex-col justify-between text-left group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Knowledge Base</span>
              <h4 className="text-2xl font-black text-slate-900">{notes.length}</h4>
            </div>
            <div className="h-9 w-9 bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800 rounded-lg flex items-center justify-center transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 flex items-center gap-1 mt-3">
            Open catalog <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        {/* Needs cost estimate summary */}
        <button
          onClick={() => setActiveTab('needs')}
          className="app-card p-5 flex flex-col justify-between text-left group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Budget</span>
              <h4 className="text-lg font-black text-slate-900 truncate max-w-[150px]">
                Rp {budgetStats.neededTotal.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="h-9 w-9 bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800 rounded-lg flex items-center justify-center transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 flex items-center gap-1 mt-3">
            Open inventory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      {/* Middle Dashboard Layout: Checklist & Needs Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Today's Quick Checklist</h3>
            <span className="text-[11px] font-bold text-slate-400">Click to check</span>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-10">
              <Flame className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No habits configured. Create habits in the Habit Tracker tab.</p>
              <button 
                onClick={() => setActiveTab('habits')}
                className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-850 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                Go configure habits
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {habits.map(habit => {
                const isChecked = !!habit.history[todayStr];
                const isGood = habit.type === 'good';
                return (
                  <div key={habit.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-sm truncate ${isChecked && isGood ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {habit.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="capitalize">{habit.type} habit</span>
                      </p>
                    </div>

                    <button
                      onClick={() => toggleHabitStatus(habit.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                        isGood 
                          ? isChecked 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
                          : isChecked
                            ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                      }`}
                    >
                      {isGood 
                        ? isChecked ? 'Completed' : 'Check Done'
                        : isChecked ? 'Lapsed' : 'Avoided Success'
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Alerts Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                Needs Alerts <AlertTriangle className="w-4 h-4 text-amber-500" />
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">High Priority</span>
            </div>

            {highPriorityAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/10 mx-auto mb-2" />
                <p className="text-xs">No pending high priority items.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {highPriorityAlerts.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate leading-snug">{item.name}</p>
                      <p className="text-[10px] text-slate-400 block pt-0.5">Est. Rp {item.estimatedCost.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => purchaseNeedItem(item.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-1.5 rounded-lg shrink-0 transition-colors"
                    >
                      Acquired
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs mt-3">
            <span className="text-slate-400 font-medium">Pending High Priority:</span>
            <span className="font-extrabold text-slate-900">{highPriorityAlerts.length} item(s)</span>
          </div>
        </div>
      </div>

      {/* Bottom Dashboard Layout - Consistency Insights */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Consistency Insights</h3>
          <p className="text-slate-500 text-xs mt-1">Deep analysis of your productive trends and patterns.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consistency score card */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">7-Day Consistency Index</span>
              <h4 className="text-3xl font-black text-slate-900">{consistencyIndex}%</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Your overall routines adherence rate over the previous week.
              </p>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                style={{ width: `${consistencyIndex}%` }} 
              />
            </div>
          </div>

          {/* Budget allocation breakdown */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Distribution</span>
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No item prices logged.</p>
            ) : (
              <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                {categoryBreakdown.map(([cat, cost]) => (
                  <div key={cat} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">{cat}</span>
                    <span className="text-slate-900 font-bold">Rp {cost.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core consistency guidelines */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                Local Focus Guidelines <Sparkles className="w-3 h-3 text-emerald-500" />
              </span>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                "Small daily progress builds long-term success. Focus on checking your checklist daily, writing documentation, and logging needs."
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block pt-1 border-t border-slate-200">
              Offline Guardian Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
