import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, Check, X, Flame, Sparkles, AlertCircle, Bell, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReminderItem } from '../App';

export interface Habit {
  id: string;
  name: string;
  description: string;
  type: 'good' | 'bad';
  frequency: 'daily';
  createdAt: string;
  history: { [dateStr: string]: boolean };
}

const formatDateLocal = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', []);
  const [reminders, setReminders] = useLocalStorage<ReminderItem[]>('my-monitor-reminders', []);

  // Habit creation states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'good' | 'bad'>('good');
  const [showAddForm, setShowAddForm] = useState(false);

  // Active reminders expanded sections
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // Reminder creation states (temporary per habit)
  const [remTime, setRemTime] = useState('08:00');
  const [remDays, setRemDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Last 7 days calendar
  const last7Days = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  })();

  const calculateStreak = (history: { [dateStr: string]: boolean }) => {
    let streak = 0;
    const today = new Date();
    
    let checkDate = new Date(today);
    let dateStr = formatDateLocal(checkDate);

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
    if (confirm('Are you sure you want to delete this habit? All history and reminders will be erased.')) {
      setHabits(habits.filter(h => h.id !== id));
      setReminders(reminders.filter(r => r.habitId !== id));
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

  // Add a reminder to a specific habit
  const handleAddReminder = (habitId: string, habitName: string) => {
    if (!remTime) return;

    const newReminder: ReminderItem = {
      id: crypto.randomUUID(),
      title: `${habitName} Habit Alert`,
      time: remTime,
      days: remDays,
      isActive: true,
      habitId
    };

    setReminders([...reminders, newReminder]);
    
    // Reset inputs
    setRemTime('08:00');
    setRemDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(reminders.filter(r => r.id !== reminderId));
  };

  const toggleReminderActive = (reminderId: string) => {
    setReminders(
      reminders.map(r => r.id === reminderId ? { ...r, isActive: !r.isActive } : r)
    );
  };

  const toggleDayInReminder = (day: string) => {
    if (remDays.includes(day)) {
      setRemDays(remDays.filter(d => d !== day));
    } else {
      setRemDays([...remDays, day]);
    }
  };

  const goodHabits = habits.filter(h => h.type === 'good');
  const badHabits = habits.filter(h => h.type === 'bad');

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 pb-24 md:pb-6">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Habit & Alerts Manager <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Build good routines, avoid bad habits, and schedule notification alarms.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors px-4 py-2 rounded-xl font-medium text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Habit Create Form */}
      {showAddForm && (
        <form onSubmit={handleAddHabit} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Drink water, Study react, Avoid caffeine"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Habit Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('good')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    type === 'good'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  Good Habit (Build)
                </button>
                <button
                  type="button"
                  onClick={() => setType('bad')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    type === 'bad'
                      ? 'bg-rose-50 border-rose-200 text-rose-800 ring-2 ring-rose-500/10'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
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
              placeholder="Why is this habit important to you?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs transition-all"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              Create Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits Catalog list */}
      <div className="grid grid-cols-1 gap-6">
        {/* Good Habits */}
        <div className="space-y-3.5">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Good Habits (Routines)</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{goodHabits.length}</span>
          </div>

          {goodHabits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center shadow-2xs">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-450 text-xs">No good routines set yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {goodHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                const isExpanded = expandedHabitId === habit.id;
                const habitReminders = reminders.filter(r => r.habitId === habit.id);

                return (
                  <div key={habit.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Name & Desc */}
                      <div className="space-y-1 max-w-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{habit.name}</h4>
                          {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 stroke-amber-600" />
                              <span>{streak}d Streak</span>
                            </div>
                          )}
                        </div>
                        {habit.description && <p className="text-slate-400 text-xs leading-relaxed">{habit.description}</p>}
                      </div>

                      {/* Action controllers */}
                      <div className="flex items-center space-x-4 ml-auto lg:ml-0 overflow-x-auto py-1">
                        <div className="flex space-x-1">
                          {last7Days.map((day) => {
                            const dateStr = formatDateLocal(day);
                            const isCompleted = !!habit.history[dateStr];
                            const isToday = formatDateLocal(new Date()) === dateStr;
                            return (
                              <button
                                key={dateStr}
                                onClick={() => toggleDay(habit.id, dateStr)}
                                className={`w-8.5 h-10.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : isToday
                                    ? 'bg-slate-50 text-slate-800 border border-slate-200 border-dashed'
                                    : 'bg-slate-50/50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                }`}
                              >
                                <span className="text-[8px] uppercase tracking-tighter opacity-80">
                                  {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </span>
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 mt-0.5 stroke-[2.5]" />
                                ) : (
                                  <span className="text-[10px] font-bold mt-0.5">{day.getDate()}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Expand Reminders Button */}
                        <button
                          onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold ${
                            habitReminders.length > 0 
                              ? 'bg-blue-50 border-blue-200 text-blue-800' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title="Configure alert reminders"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{habitReminders.length}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Reminders Sub-Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 pt-4 mt-2 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>Alert Reminders for this Habit</span>
                        </div>

                        {/* Reminders list */}
                        {habitReminders.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No alert schedules set. Configure an alarm below.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {habitReminders.map(rem => (
                              <div key={rem.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-slate-800 text-xs">{rem.time}</p>
                                  <p className="text-[9px] text-slate-450">Runs on: {rem.days.join(', ') || 'Everyday'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleReminderActive(rem.id)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                      rem.isActive 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                        : 'bg-slate-200 text-slate-650'
                                    }`}
                                  >
                                    {rem.isActive ? 'Active' : 'Muted'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    className="text-slate-350 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Reminder Form */}
                        <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Set New Alarm</span>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            {/* Time input */}
                            <input
                              type="time"
                              value={remTime}
                              onChange={(e) => setRemTime(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-max"
                            />

                            {/* Days buttons */}
                            <div className="flex flex-wrap gap-1">
                              {weekdays.map(day => {
                                const selected = remDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInReminder(day)}
                                    className={`w-7.5 h-7.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all ${
                                      selected 
                                        ? 'bg-slate-900 text-white' 
                                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    {day.slice(0, 2)}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddReminder(habit.id, habit.name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl ml-auto sm:ml-0 transition-colors w-full sm:w-max text-center"
                            >
                              Add Alarm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bad Habits */}
        <div className="space-y-3.5 pt-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bad Habits (Avoid Checklist)</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{badHabits.length}</span>
          </div>

          {badHabits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center shadow-2xs">
              <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-450 text-xs">No avoid routines set yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {badHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                const isExpanded = expandedHabitId === habit.id;
                const habitReminders = reminders.filter(r => r.habitId === habit.id);

                return (
                  <div key={habit.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Name & Desc */}
                      <div className="space-y-1 max-w-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{habit.name}</h4>
                          {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <Bell className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />
                              <span>{streak}d Avoided</span>
                            </div>
                          )}
                        </div>
                        {habit.description && <p className="text-slate-400 text-xs leading-relaxed">{habit.description}</p>}
                      </div>

                      {/* Action controllers */}
                      <div className="flex items-center space-x-4 ml-auto lg:ml-0 overflow-x-auto py-1">
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold uppercase pr-1">
                          <span>Lapsed?</span>
                        </div>
                        <div className="flex space-x-1">
                          {last7Days.map((day) => {
                            const dateStr = formatDateLocal(day);
                            // Avoided = history[dateStr] is empty
                            // Lapsed = history[dateStr] === true
                            const isLapsed = !!habit.history[dateStr];
                            const isToday = formatDateLocal(new Date()) === dateStr;
                            return (
                              <button
                                key={dateStr}
                                onClick={() => toggleDay(habit.id, dateStr)}
                                className={`w-8.5 h-10.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                                  isLapsed
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : isToday
                                    ? 'bg-slate-50 text-slate-800 border border-slate-200 border-dashed'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                                }`}
                                title={isLapsed ? "Lapsed (Avoidance Failed)" : "Avoided Successfully"}
                              >
                                <span className="text-[8px] uppercase tracking-tighter opacity-80">
                                  {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </span>
                                {isLapsed ? (
                                  <X className="w-3.5 h-3.5 mt-0.5 stroke-[2.5]" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-600 stroke-[2.5]" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Expand Reminders Button */}
                        <button
                          onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold ${
                            habitReminders.length > 0 
                              ? 'bg-blue-50 border-blue-200 text-blue-800' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title="Configure alert reminders"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{habitReminders.length}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Reminders Sub-Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 pt-4 mt-2 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>Alert Reminders for this Habit</span>
                        </div>

                        {/* Reminders list */}
                        {habitReminders.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No alert schedules set. Configure an alarm below.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {habitReminders.map(rem => (
                              <div key={rem.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-slate-800 text-xs">{rem.time}</p>
                                  <p className="text-[9px] text-slate-450">Runs on: {rem.days.join(', ') || 'Everyday'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleReminderActive(rem.id)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                      rem.isActive 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                        : 'bg-slate-200 text-slate-650'
                                    }`}
                                  >
                                    {rem.isActive ? 'Active' : 'Muted'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    className="text-slate-350 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Reminder Form */}
                        <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
                          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Set New Alarm</span>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            {/* Time input */}
                            <input
                              type="time"
                              value={remTime}
                              onChange={(e) => setRemTime(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-max"
                            />

                            {/* Days buttons */}
                            <div className="flex flex-wrap gap-1">
                              {weekdays.map(day => {
                                const selected = remDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInReminder(day)}
                                    className={`w-7.5 h-7.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all ${
                                      selected 
                                        ? 'bg-slate-900 text-white' 
                                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    {day.slice(0, 2)}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddReminder(habit.id, habit.name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl ml-auto sm:ml-0 transition-colors w-full sm:w-max text-center"
                            >
                              Add Alarm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
export default HabitTracker;
