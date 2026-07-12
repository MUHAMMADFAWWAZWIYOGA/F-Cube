import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, Check, X, Flame, Sparkles, AlertCircle } from 'lucide-react';

export interface Habit {
  id: string;
  name: string;
  description: string;
  type: 'good' | 'bad';
  frequency: 'daily';
  createdAt: string;
  history: { [dateStr: string]: boolean };
}

// Local helper to format dates consistently as YYYY-MM-DD in local time
const formatDateLocal = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'good' | 'bad'>('good');
  const [showAddForm, setShowAddForm] = useState(false);

  // Generate the list of the last 7 days (ending with today)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Streak calculator
  const calculateStreak = (history: { [dateStr: string]: boolean }) => {
    let streak = 0;
    const today = new Date();
    
    let checkDate = new Date(today);
    let dateStr = formatDateLocal(checkDate);

    // If today is not completed, check if yesterday was completed to keep streak alive
    if (!history[dateStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = formatDateLocal(checkDate);
    }

    while (history[dateStr]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      dateStr = formatDateLocal(checkDate);
    }

    return streak;
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      type,
      frequency: 'daily',
      createdAt: new Date().toISOString(),
      history: {},
    };

    setHabits([...habits, newHabit]);
    setName('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  const toggleDay = (habitId: string, dateStr: string) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const history = { ...habit.history };
          if (history[dateStr]) {
            delete history[dateStr];
          } else {
            history[dateStr] = true;
          }
          return { ...habit, history };
        }
        return habit;
      })
    );
  };

  // Group habits by type
  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits = habits.filter((h) => h.type === 'bad');

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-0 py-6 pb-24 md:pb-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Habit Tracker <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Build good routines, avoid negative habits, and monitor your streaks.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Habit Create Form Drawer/Modal */}
      {showAddForm && (
        <form onSubmit={handleAddHabit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Read 15 pages, Drink water"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Habit Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('good')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    type === 'good'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Good Habit (Build)
                </button>
                <button
                  type="button"
                  onClick={() => setType('bad')}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    type === 'bad'
                      ? 'bg-red-50 border-red-200 text-red-800 ring-2 ring-red-500/10'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Bad Habit (Avoid)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this important? Give details..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Create Habit
            </button>
          </div>
        </form>
      )}

      {/* Main Habits Container */}
      <div className="grid grid-cols-1 gap-6">
        {/* Good Habits Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Good Habits (Daily Routines)</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{goodHabits.length}</span>
          </div>

          {goodHabits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No good habits registered. Add some to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {goodHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                return (
                  <div key={habit.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-base">{habit.name}</h4>
                        {streak > 0 && (
                          <div className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-amber-600" />
                            <span>{streak}d Streak</span>
                          </div>
                        )}
                      </div>
                      {habit.description && <p className="text-slate-500 text-xs leading-relaxed">{habit.description}</p>}
                    </div>

                    {/* Completion 7-day strip */}
                    <div className="flex items-center space-x-4 ml-auto lg:ml-0 overflow-x-auto py-1">
                      <div className="flex space-x-1.5">
                        {last7Days.map((day) => {
                          const dateStr = formatDateLocal(day);
                          const isCompleted = !!habit.history[dateStr];
                          const isToday = formatDateLocal(new Date()) === dateStr;
                          return (
                            <button
                              key={dateStr}
                              onClick={() => toggleDay(habit.id, dateStr)}
                              className={`w-9 h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                  : isToday
                                  ? 'bg-slate-100 text-slate-800 border-2 border-slate-200 border-dashed'
                                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-tighter opacity-80">
                                {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                              </span>
                              {isCompleted ? (
                                <Check className="w-4 h-4 mt-0.5 stroke-[2.5]" />
                              ) : (
                                <span className="text-xs font-bold mt-0.5">{day.getDate()}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bad Habits Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bad Habits (Avoid Checklist)</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{badHabits.length}</span>
          </div>

          {badHabits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No bad habits registered. Tracking bad habits helps you avoid them!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {badHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                return (
                  <div key={habit.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-base">{habit.name}</h4>
                        {streak > 0 && (
                          <div className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5 stroke-emerald-600 fill-emerald-50" />
                            <span>{streak}d Avoided</span>
                          </div>
                        )}
                      </div>
                      {habit.description && <p className="text-slate-500 text-xs leading-relaxed">{habit.description}</p>}
                    </div>

                    {/* Completion 7-day strip */}
                    <div className="flex items-center space-x-4 ml-auto lg:ml-0 overflow-x-auto py-1">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider pr-1">
                        <span>Lapsed?</span>
                      </div>
                      <div className="flex space-x-1.5">
                        {last7Days.map((day) => {
                          const dateStr = formatDateLocal(day);
                          // For a bad habit, "true" in history means we successfully AVOIDED it.
                          // Let's display check icon for avoided (success) and X icon for lapsed (unavoided).
                          const isAvoided = !!habit.history[dateStr];
                          const isToday = formatDateLocal(new Date()) === dateStr;
                          return (
                            <button
                              key={dateStr}
                              onClick={() => toggleDay(habit.id, dateStr)}
                              className={`w-9 h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                                isAvoided
                                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                                  : isToday
                                  ? 'bg-slate-100 text-slate-800 border-2 border-slate-200 border-dashed'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                              }`}
                              title={isAvoided ? "Avoided failed (Lapsed)" : "Avoided successfully"}
                            >
                              <span className="text-[9px] uppercase tracking-tighter opacity-80">
                                {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                              </span>
                              {isAvoided ? (
                                <X className="w-4 h-4 mt-0.5 stroke-[2.5]" />
                              ) : (
                                <Check className="w-4 h-4 mt-0.5 text-emerald-600 stroke-[2.5]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// Add a clean ShieldCheck icon definition if Lucide lacks it, or import from lucide-react. We imported ShieldCheck in Sidebar, so let's import it here as well.
import { ShieldCheck } from 'lucide-react';
export default HabitTracker;
