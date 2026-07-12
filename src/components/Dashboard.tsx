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
  ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

// Local helper to format date as YYYY-MM-DD
const getTodayDateString = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', []);
  const [notes] = useLocalStorage<DocumentNote[]>('my-monitor-notes', []);
  const [needs] = useLocalStorage<NeedItem[]>('my-monitor-needs', []);

  const todayStr = getTodayDateString();

  // Habit metrics calculation
  const habitStats = useMemo(() => {
    const goodHabits = habits.filter(h => h.type === 'good');
    const badHabits = habits.filter(h => h.type === 'bad');

    const totalGood = goodHabits.length;
    const completedGood = goodHabits.filter(h => !!h.history[todayStr]).length;

    const totalBad = badHabits.length;
    // For a bad habit, "true" in history means we LAPSED (e.g. failed to avoid). 
    // So "successfully avoided" means it is NOT true (e.g. history[todayStr] is falsy).
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

  // Needs cost calculations
  const outstandingBudget = useMemo(() => {
    return needs
      .filter(item => item.status !== 'purchased')
      .reduce((sum, item) => sum + (item.estimatedCost * item.qty), 0);
  }, [needs]);

  // Today's habits listing
  const todayHabitsList = useMemo(() => {
    return habits;
  }, [habits]);

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

  // Get current date string for header (e.g. "Sunday, July 12")
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-0 py-6 pb-24 md:pb-6">
      {/* Dashboard Greeting Panel */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-slate-800">
        {/* Glow overlay styling */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 px-3 py-1 rounded-full w-max text-xs font-semibold text-emerald-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateFormatted}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, <span className="gradient-text bg-gradient-to-r from-emerald-400 to-teal-300">Productive Mind!</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md">
              Welcome back to your local workspace. All databases are securely saved directly in your device.
            </p>
          </div>

          <div className="flex bg-slate-800/50 backdrop-blur-md border border-slate-750 px-5 py-4 rounded-2xl items-center space-x-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/15">
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

      {/* Overview Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Good Habits Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routines Success</span>
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

        {/* Bad Habits Lapsed Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avoided Lapses</span>
              <h4 className="text-2xl font-black text-slate-900">{habitStats.badAvoidedPercent}%</h4>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${habitStats.lapsedBad > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
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

        {/* Knowledge Base Note Counts */}
        <button 
          onClick={() => setActiveTab('notes')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-300 transition-all group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Knowledge Base</span>
              <h4 className="text-2xl font-black text-slate-900">{notes.length}</h4>
            </div>
            <div className="h-9 w-9 bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-lg flex items-center justify-center transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 mt-3">
            Open documents catalog <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        {/* Outstanding Needs Logger Costs */}
        <button
          onClick={() => setActiveTab('needs')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-300 transition-all group"
        >
          <div className="flex justify-between items-start w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Needs Budget</span>
              <h4 className="text-lg font-black text-slate-900 truncate max-w-[150px]">
                Rp {outstandingBudget.toLocaleString('id-ID')}
              </h4>
            </div>
            <div className="h-9 w-9 bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-lg flex items-center justify-center transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 mt-3">
            Open inventory logger <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      {/* Main Dashboard Details (Quick Habits Checklist & Motivation Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick habit checklists for today */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Today's Quick Checklist</h3>
            <span className="text-xs font-semibold text-slate-400">Mark done direct</span>
          </div>

          {todayHabitsList.length === 0 ? (
            <div className="text-center py-8">
              <Flame className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No habits configured. Create habits in the Habit Tracker tab.</p>
              <button 
                onClick={() => setActiveTab('habits')}
                className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                Go configure habits
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto pr-1">
              {todayHabitsList.map(habit => {
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
                            ? 'bg-red-50 border-red-250 text-red-600 font-bold'
                            : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-red-500 hover:text-white hover:border-red-500'
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

        {/* Motivational Side Widget */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between h-full min-h-[250px] relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Local Consistency</h4>
              <p className="text-slate-600 text-sm leading-relaxed italic">
                "Consistency beats intensity. What you track is what you control. Keep your local records clean and progress will follow."
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-4 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-800">
              C
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-700 leading-none">Offline Guardian</p>
              <p className="text-[9px] text-slate-400">F'Cube Personal Engine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
