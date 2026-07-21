import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, BookOpen } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export interface CalendarActivity {
  id: string;
  title: string;
  time: string; // "HH:MM" or "All Day"
  description: string;
  completed: boolean;
  dateStr: string; // "YYYY-MM-DD"
}

interface CalendarTrackerProps {
  pin: string;
}

const formatDateLocal = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const CalendarTracker: React.FC<CalendarTrackerProps> = ({ pin }) => {
  // Sync calendar activities with local storage (encrypted using user pin)
  const [activities, setActivities] = useLocalStorage<CalendarActivity[]>('my-monitor-calendar', [], pin);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Calendar View Date states
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  // New activity form states
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newDescription, setNewDescription] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Seed default items if empty to help the user get started
  React.useEffect(() => {
    if (activities.length === 0) {
      const today = new Date();
      const todayStr = formatDateLocal(today);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateLocal(tomorrow);

      const seedData: CalendarActivity[] = [
        {
          id: 'seed-act-1',
          title: 'Daily morning brief & report checking',
          time: '08:30',
          description: 'Check terminal logs and verify active routines.',
          completed: true,
          dateStr: todayStr
        },
        {
          id: 'seed-act-2',
          title: "F'Cube System synchronization",
          time: '13:00',
          description: 'Synchronize backup nodes and decrypt storage database.',
          completed: false,
          dateStr: todayStr
        },
        {
          id: 'seed-act-3',
          title: 'Weekly progress evaluation',
          time: '15:00',
          description: 'Perform visual inspection of consistency indices.',
          completed: false,
          dateStr: tomorrowStr
        }
      ];
      setActivities(seedData);
    }
  }, [activities, setActivities]);

  // Generate calendar days for the grid (7 cols x 6 rows = 42 cells)
  const calendarCells = useMemo(() => {
    const cells = [];
    
    // First day of current month (0 = Sun, 1 = Mon, ...)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    // Total days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Total days in previous month
    const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 1. Previous month overlapping days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = totalDaysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, day);
      cells.push({
        date: prevDate,
        dayNum: day,
        isCurrentMonth: false,
        dateStr: formatDateLocal(prevDate)
      });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const currDate = new Date(currentYear, currentMonth, i);
      cells.push({
        date: currDate,
        dayNum: i,
        isCurrentMonth: true,
        dateStr: formatDateLocal(currDate)
      });
    }

    // 3. Next month overlapping days (to fill 42 cells)
    const remainingSlots = 42 - cells.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      cells.push({
        date: nextDate,
        dayNum: i,
        isCurrentMonth: false,
        dateStr: formatDateLocal(nextDate)
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Map activities by date string for high performance lookups
  const activitiesByDate = useMemo(() => {
    const map: { [dateStr: string]: CalendarActivity[] } = {};
    activities.forEach((act) => {
      if (!map[act.dateStr]) {
        map[act.dateStr] = [];
      }
      map[act.dateStr].push(act);
    });
    return map;
  }, [activities]);

  const selectedDateStr = formatDateLocal(selectedDate);
  const selectedDayActivities = activitiesByDate[selectedDateStr] || [];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Add activity handler
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newActivity: CalendarActivity = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      time: newTime || 'All Day',
      description: newDescription.trim(),
      completed: false,
      dateStr: selectedDateStr
    };

    setActivities([...activities, newActivity]);
    setNewTitle('');
    setNewTime('12:00');
    setNewDescription('');
    setShowAddForm(false);
  };

  // Delete activity handler
  const handleDeleteActivity = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteActivity = () => {
    if (!deleteConfirmId) return;
    setActivities(activities.filter(act => act.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  // Toggle activity completion state
  const toggleActivityCompleted = (id: string) => {
    setActivities(
      activities.map(act => act.id === id ? { ...act, completed: !act.completed } : act)
    );
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const weekdayShort = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  // Activity stats calculation
  const monthlyCompletionRate = useMemo(() => {
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const thisMonthActivities = activities.filter(act => act.dateStr.startsWith(currentMonthStr));
    if (thisMonthActivities.length === 0) return 0;
    const completed = thisMonthActivities.filter(act => act.completed).length;
    return Math.round((completed / thisMonthActivities.length) * 100);
  }, [activities, currentYear, currentMonth]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-[#0b1623] border border-[#1c2b3a] p-4 text-xs">
        <div>
          <h2 className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-1.5">
            SYS.CALENDAR <Calendar className="w-3.5 h-3.5 text-[#ff9f30]" />
          </h2>
          <p className="text-[#8b9bb4] text-[9px] mt-0.5 uppercase">Daily Event Planner & Monitor</p>
        </div>
        <div className="bg-[#1c2b3a] text-[#ff9f30] px-2 py-1 font-bold text-[9px] border border-[#1c2b3a]">
          M.COMPL // {monthlyCompletionRate}%
        </div>
      </div>

      {/* Main Calendar Month Grid */}
      <div className="app-card p-4 space-y-4">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between border-b border-[#1c2b3a] pb-3">
          <button 
            type="button"
            onClick={prevMonth}
            className="p-1.5 border border-[#1c2b3a] hover:border-[#ff9f30] hover:text-[#ff9f30] bg-[#1c2b3a]/30 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs tracking-widest text-[#f0f0f0]">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            type="button"
            onClick={nextMonth}
            className="p-1.5 border border-[#1c2b3a] hover:border-[#ff9f30] hover:text-[#ff9f30] bg-[#1c2b3a]/30 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayShort.map((day, idx) => (
            <span 
              key={day} 
              className={`text-[8px] font-bold py-1.5 ${
                idx === 0 ? 'text-[#ff9f30]' : idx === 6 ? 'text-[#ff9f30]' : 'text-[#8b9bb4]'
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            const hasEvents = (activitiesByDate[cell.dateStr] || []).length > 0;
            const isToday = formatDateLocal(new Date()) === cell.dateStr;
            const isSelected = selectedDateStr === cell.dateStr;
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDate(cell.date);
                  setShowAddForm(false);
                }}
                className={`h-11 border flex flex-col items-center justify-between p-1.5 transition-all text-left relative group cursor-pointer ${
                  cell.isCurrentMonth 
                    ? 'bg-transparent text-[#f0f0f0] border-[#1c2b3a]' 
                    : 'bg-[#1c2b3a]/10 text-[#8b9bb4]/40 border-[#1c2b3a]/30'
                } ${
                  isSelected 
                    ? 'border-[#ff9f30] bg-[#ff9f30]/5 text-[#ff9f30]' 
                    : 'hover:border-[#ff9f30]/70'
                }`}
              >
                {/* Day number */}
                <div className="flex justify-between items-start w-full">
                  <span className={`text-[9px] font-bold leading-none ${isToday && cell.isCurrentMonth ? 'text-[#00ff9d]' : ''}`}>
                    {cell.dayNum}
                  </span>
                  
                  {/* Today tiny indicator dot */}
                  {isToday && (
                    <span className="w-1.5 h-1.5 bg-[#00ff9d] border border-[#0b1623]" title="Today" />
                  )}
                </div>

                {/* Event indicator dot */}
                {hasEvents && (
                  <span className={`w-1.5 h-1.5 ${isSelected ? 'bg-[#ff9f30]' : 'bg-[#ff9f30]/60 animate-pulse'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day View Details */}
      <div className="app-card p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-2 text-[9px] font-bold text-[#8b9bb4]">
          <span>// DAY_SCHEDULE: {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-[#ff9f30] hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD ACTIVITY</span>
          </button>
        </div>

        {/* Add Event Form */}
        {showAddForm && (
          <form onSubmit={handleAddActivity} className="border border-[#1c2b3a] p-3 space-y-3.5 bg-[#1c2b3a]/10 text-xs animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Activity Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="E.g., Client meeting, gym, system review"
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-2 py-1.5 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Time</label>
                <div className="relative flex items-center">
                  <Clock className="absolute left-2 w-3.5 h-3.5 text-[#8b9bb4]" />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#0b1623] text-[#f0f0f0] pl-7 pr-2 py-1.5 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Option</label>
                <button
                  type="button"
                  onClick={() => setNewTime(newTime === 'All Day' ? '12:00' : 'All Day')}
                  className={`w-full py-1.5 border font-bold text-[9px] transition-all cursor-pointer ${
                    newTime === 'All Day'
                      ? 'bg-[#1c2b3a] border-[#ff9f30] text-[#ff9f30]'
                      : 'bg-[#0b1623] border-[#1c2b3a] text-[#8b9bb4] hover:bg-[#1c2b3a]'
                  }`}
                >
                  ALL DAY EVENT
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Notes / Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Details of the event..."
                rows={2}
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-2 py-1.5 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-[9px] font-bold text-[#8b9bb4] hover:bg-[#1c2b3a] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 text-[9px] font-bold bg-[#ff9f30] text-[#0b1623] cursor-pointer"
              >
                REGISTER
              </button>
            </div>
          </form>
        )}

        {/* Selected Day Activities List */}
        {selectedDayActivities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#1c2b3a] bg-[#1c2b3a]/5">
            <BookOpen className="w-5 h-5 text-[#1c2b3a] mx-auto mb-1.5" />
            <p className="text-[#8b9bb4] text-[10px] uppercase tracking-wide">No activities registered for this day.</p>
          </div>
        ) : (
          <div className="space-y-2.5 divide-y divide-[#1c2b3a]/40">
            {selectedDayActivities.map((act, index) => {
              return (
                <div 
                  key={act.id} 
                  className={`flex gap-3 text-xs justify-between items-start ${index > 0 ? 'pt-2.5' : ''}`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {/* Time Badge */}
                    <div className="flex items-center gap-1 bg-[#1c2b3a] border border-[#1c2b3a] px-1.5 py-0.5 text-[8px] font-bold text-[#ff9f30] shrink-0 uppercase tracking-tighter">
                      <Clock className="w-2.5 h-2.5 text-[#ff9f30]" />
                      <span>{act.time}</span>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`font-bold truncate ${act.completed ? 'text-[#8b9bb4] line-through' : 'text-[#f0f0f0]'}`}>
                        {act.title}
                      </h4>
                      {act.description && (
                        <p className="text-[9px] text-[#8b9bb4] mt-0.5 leading-relaxed">{act.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActivityCompleted(act.id)}
                      className={`px-2 py-0.5 text-[8px] font-bold transition-all border cursor-pointer ${
                        act.completed
                          ? 'bg-[#1c2b3a] border-[#1c2b3a] text-[#00ff9d]'
                          : 'bg-transparent border-[#1c2b3a] text-[#f0f0f0] hover:border-[#ff9f30] hover:text-[#ff9f30]'
                      }`}
                    >
                      {act.completed ? 'COMPLETED' : 'EXECUTE'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1 border border-[#1c2b3a] hover:border-red-500 hover:text-red-500 text-[#8b9bb4] transition-colors cursor-pointer"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="HAPUS KEGIATAN // DELETE ACTIVITY"
        message="Apakah Anda yakin ingin menghapus agenda kegiatan ini dari kalender?"
        onConfirm={confirmDeleteActivity}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
export default CalendarTracker;
