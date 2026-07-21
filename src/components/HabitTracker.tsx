import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, Check, X, Flame, Sparkles, Bell, Clock } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
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

interface HabitTrackerProps {
  pin: string;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ pin }) => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('my-monitor-habits', [], pin);
  const [reminders, setReminders] = useLocalStorage<ReminderItem[]>('my-monitor-reminders', [], pin);

  // Deletion modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Creation states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'good' | 'bad'>('good');
  const [showAddForm, setShowAddForm] = useState(false);

  // Expansions
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // Reminder creation states (temporary)
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
    setDeleteConfirmId(id);
  };

  const confirmDeleteHabit = () => {
    if (!deleteConfirmId) return;
    setHabits(habits.filter(h => h.id !== deleteConfirmId));
    setReminders(reminders.filter(r => r.habitId !== deleteConfirmId));
    setDeleteConfirmId(null);
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

  const handleAddReminder = (habitId: string, habitName: string) => {
    if (!remTime) return;

    const newReminder: ReminderItem = {
      id: crypto.randomUUID(),
      title: `${habitName} Alert`,
      time: remTime,
      days: remDays,
      isActive: true,
      habitId
    };

    setReminders([...reminders, newReminder]);
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
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-[#0b1623] border border-[#1c2b3a] p-4 text-xs">
        <div>
          <h2 className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-1.5">
            SYS.ROUTINES <Sparkles className="w-3.5 h-3.5 text-[#00ff9d]" />
          </h2>
          <p className="text-[#8b9bb4] text-[9px] mt-0.5 uppercase">ROUTINE TRACKER & ALARMS</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 bg-[#ff9f30] text-[#0b1623] px-2.5 py-1.5 font-bold text-[10px] tracking-wide"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD NEW</span>
        </button>
      </div>

      {/* Habit Creation Form */}
      {showAddForm && (
        <form onSubmit={handleAddHabit} className="bg-[#0b1623] border border-[#1c2b3a] p-4 space-y-4 animate-fadeIn text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Habit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Read documentation, Avoid caffeine"
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Habit Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('good')}
                className={`py-2 text-[10px] font-bold border transition-all ${
                  type === 'good'
                    ? 'bg-[#1c2b3a] border-[#ff9f30] text-[#ff9f30]'
                    : 'bg-[#0b1623] border-[#1c2b3a] text-[#8b9bb4] hover:bg-[#1c2b3a]'
                }`}
              >
                GOOD ROUTINE
              </button>
              <button
                type="button"
                onClick={() => setType('bad')}
                className={`py-2 text-[10px] font-bold border transition-all ${
                  type === 'bad'
                    ? 'bg-[#1c2b3a] border-[#ff9f30] text-[#ff9f30]'
                    : 'bg-[#0b1623] border-[#1c2b3a] text-[#8b9bb4] hover:bg-[#1c2b3a]'
                }`}
              >
                AVOID LAPSE
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Maintain streak for 14 days"
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2.5 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold text-[#8b9bb4] hover:bg-[#1c2b3a]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-[10px] font-bold bg-[#ff9f30] text-[#0b1623]"
            >
              CREATE
            </button>
          </div>
        </form>
      )}

      {/* Habits Catalog List */}
      <div className="space-y-5">
        {/* Good Habits */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2 text-[9px] font-bold text-[#8b9bb4]">
            <div className="h-1.5 w-1.5 bg-[#00ff9d]" />
            <span>GOOD ROUTINES [{goodHabits.length}]</span>
          </div>

          {goodHabits.length === 0 ? (
            <div className="bg-[#0b1623] border border-[#1c2b3a] p-6 text-center">
              <p className="text-[#8b9bb4] text-[10px]">NO ACTIVE GOOD ROUTINES DEFINED.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goodHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                const isExpanded = expandedHabitId === habit.id;
                const habitReminders = reminders.filter(r => r.habitId === habit.id);

                return (
                  <div key={habit.id} className="app-card p-3.5 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[#f0f0f0] text-xs leading-snug">{habit.name}</h4>
                          {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-[8px] font-bold text-[#ff9f30] bg-[#1c2b3a] px-2 py-0.5 border border-[#1c2b3a]">
                              <Flame className="w-3 h-3 text-[#ff9f30]" />
                              <span>{streak}D STREAK</span>
                            </div>
                          )}
                        </div>
                        {habit.description && <p className="text-[#8b9bb4] text-[10px] leading-relaxed">{habit.description}</p>}
                      </div>

                      {/* 7 days grid checklist */}
                      <div className="flex items-center justify-between gap-2 border-t border-[#1c2b3a]/50 pt-2 flex-wrap">
                        <div className="flex space-x-1">
                          {last7Days.map((day) => {
                            const dateStr = formatDateLocal(day);
                            const isCompleted = !!habit.history[dateStr];
                            const isToday = formatDateLocal(new Date()) === dateStr;
                            return (
                              <button
                                key={dateStr}
                                onClick={() => toggleDay(habit.id, dateStr)}
                                className={`w-8 h-9 rounded-none flex flex-col items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-[#00ff9d] text-[#0b1623]'
                                    : isToday
                                    ? 'bg-[#1c2b3a]/50 text-[#f0f0f0] border border-[#ff9f30] border-dashed'
                                    : 'bg-[#1c2b3a]/30 text-[#8b9bb4] border border-[#1c2b3a]'
                                }`}
                              >
                                <span className="text-[7px] font-bold uppercase tracking-tighter opacity-80">
                                  {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </span>
                                {isCompleted ? (
                                  <Check className="w-3 h-3 mt-0.5 stroke-[2.5]" />
                                ) : (
                                  <span className="text-[9px] font-bold mt-0.5">{day.getDate()}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                            className={`p-1 border text-[8px] font-bold flex items-center gap-1 ${
                              habitReminders.length > 0 
                                ? 'bg-[#1c2b3a] border-[#ff9f30] text-[#ff9f30]' 
                                : 'bg-transparent border-[#1c2b3a] text-[#8b9bb4] hover:text-[#f0f0f0]'
                            }`}
                            title="Reminders"
                          >
                            <Bell className="w-3 h-3" />
                            <span>{habitReminders.length}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="text-[#8b9bb4] hover:text-[#ff9f30] p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alarm settings */}
                    {isExpanded && (
                      <div className="border-t border-[#1c2b3a] pt-3.5 space-y-3">
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-[#8b9bb4]">
                          <Clock className="w-3.5 h-3.5 text-[#ff9f30]" />
                          <span>ALARM SCHEDULES</span>
                        </div>

                        {habitReminders.length === 0 ? (
                          <p className="text-[9px] text-[#8b9bb4] italic">No alarms set for this routine.</p>
                        ) : (
                          <div className="space-y-2">
                            {habitReminders.map(rem => (
                              <div key={rem.id} className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] flex items-center justify-between gap-2 text-[10px]">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[#f0f0f0]">{rem.time}</p>
                                  <p className="text-[8px] text-[#8b9bb4] uppercase">Run: {rem.days.join(', ') || 'EVERYDAY'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleReminderActive(rem.id)}
                                    className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                      rem.isActive 
                                        ? 'bg-[#00ff9d] text-[#0b1623]' 
                                        : 'bg-[#0b1623] border border-[#1c2b3a] text-[#8b9bb4]'
                                    }`}
                                  >
                                    {rem.isActive ? 'ACTIVE' : 'MUTED'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    className="text-[#8b9bb4] hover:text-[#ff9f30] p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="bg-[#1c2b3a]/10 border border-[#1c2b3a] p-3 space-y-2.5">
                          <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">// ADD ALARM</span>
                          <div className="flex flex-col gap-2">
                            <input
                              type="time"
                              value={remTime}
                              onChange={(e) => setRemTime(e.target.value)}
                              className="px-2 py-1 bg-[#0b1623] border border-[#1c2b3a] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#ff9f30] w-full"
                            />

                            <div className="flex justify-between gap-1 w-full overflow-x-auto py-1">
                              {weekdays.map(day => {
                                const selected = remDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInReminder(day)}
                                    className={`w-6.5 h-6.5 text-[8px] font-bold uppercase transition-all ${
                                      selected 
                                        ? 'bg-[#ff9f30] text-[#0b1623]' 
                                        : 'bg-[#0b1623] border border-[#1c2b3a] text-[#8b9bb4]'
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
                              className="bg-[#ff9f30] text-[#0b1623] font-bold text-[9px] py-1.5 transition-colors text-center w-full"
                            >
                              ADD SCHEDULE
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
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2 text-[9px] font-bold text-[#8b9bb4]">
            <div className="h-1.5 w-1.5 bg-[#ff9f30]" />
            <span>AVOID LAPSE CHECKLIST [{badHabits.length}]</span>
          </div>

          {badHabits.length === 0 ? (
            <div className="bg-[#0b1623] border border-[#1c2b3a] p-6 text-center">
              <p className="text-[#8b9bb4] text-[10px]">NO ACTIVE AVOIDANCE SCHEDULES DEFINED.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {badHabits.map((habit) => {
                const streak = calculateStreak(habit.history);
                const isExpanded = expandedHabitId === habit.id;
                const habitReminders = reminders.filter(r => r.habitId === habit.id);

                return (
                  <div key={habit.id} className="app-card p-3.5 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[#f0f0f0] text-xs leading-snug">{habit.name}</h4>
                          {streak > 0 && (
                            <div className="flex items-center gap-0.5 text-[8px] font-bold text-[#00ff9d] bg-[#1c2b3a] px-2 py-0.5 border border-[#1c2b3a]">
                              <Check className="w-3 h-3 text-[#00ff9d]" />
                              <span>{streak}D AVOIDED</span>
                            </div>
                          )}
                        </div>
                        {habit.description && <p className="text-[#8b9bb4] text-[10px] leading-relaxed">{habit.description}</p>}
                      </div>

                      {/* 7 days grid checklist */}
                      <div className="flex items-center justify-between gap-2 border-t border-[#1c2b3a]/50 pt-2 flex-wrap">
                        <div className="flex space-x-1">
                          {last7Days.map((day) => {
                            const dateStr = formatDateLocal(day);
                            const isLapsed = !!habit.history[dateStr];
                            const isToday = formatDateLocal(new Date()) === dateStr;
                            return (
                              <button
                                key={dateStr}
                                onClick={() => toggleDay(habit.id, dateStr)}
                                className={`w-8 h-9 rounded-none flex flex-col items-center justify-center transition-all ${
                                  isLapsed
                                    ? 'bg-[#ff9f30] text-[#0b1623]'
                                    : isToday
                                    ? 'bg-[#1c2b3a]/50 text-[#f0f0f0] border border-[#ff9f30] border-dashed'
                                    : 'bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/30 hover:bg-[#00ff9d]/30'
                                }`}
                                title={isLapsed ? "Lapsed" : "Avoided Success"}
                              >
                                <span className="text-[7px] font-bold uppercase tracking-tighter opacity-80">
                                  {day.toLocaleDateString('en-US', { weekday: 'narrow' })}
                                </span>
                                {isLapsed ? (
                                  <X className="w-3 h-3 mt-0.5 stroke-[2.5]" />
                                ) : (
                                  <Check className="w-3 h-3 mt-0.5 stroke-[2.5]" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                            className={`p-1 border text-[8px] font-bold flex items-center gap-1 ${
                              habitReminders.length > 0 
                                ? 'bg-[#1c2b3a] border-[#ff9f30] text-[#ff9f30]' 
                                : 'bg-transparent border-[#1c2b3a] text-[#8b9bb4] hover:text-[#f0f0f0]'
                            }`}
                            title="Reminders"
                          >
                            <Bell className="w-3 h-3" />
                            <span>{habitReminders.length}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="text-[#8b9bb4] hover:text-[#ff9f30] p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alarm settings */}
                    {isExpanded && (
                      <div className="border-t border-[#1c2b3a] pt-3.5 space-y-3">
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-[#8b9bb4]">
                          <Clock className="w-3.5 h-3.5 text-[#ff9f30]" />
                          <span>ALARM SCHEDULES</span>
                        </div>

                        {habitReminders.length === 0 ? (
                          <p className="text-[9px] text-[#8b9bb4] italic">No alarms set for this routine.</p>
                        ) : (
                          <div className="space-y-2">
                            {habitReminders.map(rem => (
                              <div key={rem.id} className="p-2.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] flex items-center justify-between gap-2 text-[10px]">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[#f0f0f0]">{rem.time}</p>
                                  <p className="text-[8px] text-[#8b9bb4] uppercase">Run: {rem.days.join(', ') || 'EVERYDAY'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleReminderActive(rem.id)}
                                    className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                      rem.isActive 
                                        ? 'bg-[#00ff9d] text-[#0b1623]' 
                                        : 'bg-[#0b1623] border border-[#1c2b3a] text-[#8b9bb4]'
                                    }`}
                                  >
                                    {rem.isActive ? 'ACTIVE' : 'MUTED'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    className="text-[#8b9bb4] hover:text-[#ff9f30] p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="bg-[#1c2b3a]/10 border border-[#1c2b3a] p-3 space-y-2.5">
                          <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">// ADD ALARM</span>
                          <div className="flex flex-col gap-2">
                            <input
                              type="time"
                              value={remTime}
                              onChange={(e) => setRemTime(e.target.value)}
                              className="px-2 py-1 bg-[#0b1623] border border-[#1c2b3a] text-xs text-[#f0f0f0] focus:outline-none focus:border-[#ff9f30] w-full"
                            />

                            <div className="flex justify-between gap-1 w-full overflow-x-auto py-1">
                              {weekdays.map(day => {
                                const selected = remDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInReminder(day)}
                                    className={`w-6.5 h-6.5 text-[8px] font-bold uppercase transition-all ${
                                      selected 
                                        ? 'bg-[#ff9f30] text-[#0b1623]' 
                                        : 'bg-[#0b1623] border border-[#1c2b3a] text-[#8b9bb4]'
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
                              className="bg-[#ff9f30] text-[#0b1623] font-bold text-[9px] py-1.5 transition-colors text-center w-full"
                            >
                              ADD SCHEDULE
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

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="HAPUS KEBIASAAN // DELETE HABIT"
        message="Apakah Anda yakin ingin menghapus kebiasaan ini? Semua riwayat pelacakan dan jadwal pengingat terkait akan dihapus secara permanen dari sistem."
        onConfirm={confirmDeleteHabit}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
export default HabitTracker;
