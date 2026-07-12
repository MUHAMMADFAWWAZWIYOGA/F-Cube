import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { DocumentManager } from './components/DocumentManager';
import { NeedsLogger } from './components/NeedsLogger';
import type { NeedItem } from './components/NeedsLogger';
import { Bell, X, Info, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string; // ISO String
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: string[]; // e.g. ["Mon", "Tue", "Wed"]
  isActive: boolean;
  habitId?: string;
  lastTriggeredDate?: string; // YYYY-MM-DD to prevent double triggers in the same minute
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>('my-monitor-notifications', [
    {
      id: 'init-notification',
      title: 'System Synced',
      message: "F'Cube Monitor is initialized. All database items are secured on-device.",
      time: new Date().toISOString(),
      read: false,
      type: 'success'
    }
  ]);
  const [reminders, setReminders] = useLocalStorage<ReminderItem[]>('my-monitor-reminders', []);
  const [needs] = useLocalStorage<NeedItem[]>('my-monitor-needs', []);

  const [showDrawer, setShowDrawer] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Clock Update Effect
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Notifications Permission request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Background Reminder Monitor
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayDay = daysOfWeek[now.getDay()];
      const todayDateStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

      let updatedReminders = [...reminders];
      let needsStateSave = false;

      reminders.forEach((rem, idx) => {
        if (!rem.isActive) return;
        
        // Match current time and check if it runs on this weekday
        const matchesTime = rem.time === currentHHMM;
        const matchesDay = rem.days.length === 0 || rem.days.includes(todayDay);
        const alreadyTriggered = rem.lastTriggeredDate === todayDateStr;

        if (matchesTime && matchesDay && !alreadyTriggered) {
          needsStateSave = true;
          updatedReminders[idx] = {
            ...rem,
            lastTriggeredDate: todayDateStr
          };

          // Trigger local in-app notification
          const newNotif: NotificationItem = {
            id: crypto.randomUUID(),
            title: `Reminder: ${rem.title}`,
            message: `It is ${rem.time}. Time to complete your tasks!`,
            time: new Date().toISOString(),
            read: false,
            type: 'info'
          };
          setNotifications(prev => [newNotif, ...prev]);

          // Trigger OS notification if allowed
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`F'Cube Monitor - ${rem.title}`, {
              body: `Scheduled reminder at ${rem.time}`,
              icon: '/favicon.ico'
            });
          }

          // Play a gentle beep (Audio Synthesis API)
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(880, context.currentTime); // Pitch A5
            gain.gain.setValueAtTime(0.05, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.15);
          } catch (e) {
            console.warn('Audio feedback failed:', e);
          }
        }
      });

      if (needsStateSave) {
        setReminders(updatedReminders);
      }
    };

    // Run checker every 15 seconds
    const checkerInterval = setInterval(checkReminders, 15000);
    return () => clearInterval(checkerInterval);
  }, [reminders, setReminders, setNotifications]);

  // Alert builder (aggregates notifications on dashboard item statuses)
  useEffect(() => {
    // Generate notification if high priority needs items are pending
    const highPriorityNeeds = needs.filter(item => item.priority === 'high' && item.status === 'needed');
    if (highPriorityNeeds.length > 0) {
      const needAlertId = `needs-alert-${highPriorityNeeds.length}`;
      // Check if notification already exists
      const exists = notifications.some(n => n.id === needAlertId);
      if (!exists) {
        const newNotif: NotificationItem = {
          id: needAlertId,
          title: 'High Priority Resource Pending',
          message: `You have ${highPriorityNeeds.length} high priority item(s) pending in your Needs Logger.`,
          time: new Date().toISOString(),
          read: false,
          type: 'alert'
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }
  }, [needs, notifications, setNotifications]);

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'habits':
        return <HabitTracker />;
      case 'notes':
        return <DocumentManager />;
      case 'needs':
        return <NeedsLogger />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex bg-transparent min-h-screen font-sans">
      {/* Desktop Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-slate-900 font-extrabold text-sm md:text-base tracking-tight select-none">
              Workspace Monitor
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex items-center space-x-4">
            {/* Clock Widget */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold bg-slate-100/80 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeStr || 'Loading...'}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setShowDrawer(true);
                handleMarkAllRead();
              }}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-bounce" />
              )}
            </button>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {renderActiveTab()}
        </main>
      </div>

      {/* Mobile Nav Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Notification Slide Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity duration-300" 
          />

          {/* Sliding container */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Notifications & Logs</h3>
                <p className="text-[10px] text-slate-400">System alerts and alerts</p>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs">No notifications recorded.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const typeColors = {
                    info: 'bg-blue-50 border-blue-100 text-blue-800',
                    alert: 'bg-rose-50 border-rose-100 text-rose-800',
                    success: 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  };

                  const typeIcons = {
                    info: Info,
                    alert: AlertCircle,
                    success: CheckCircle2
                  };

                  const Icon = typeIcons[notif.type];

                  return (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-shadow hover:shadow-xs ${typeColors[notif.type]}`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-xs leading-none">{notif.title}</h4>
                        <p className="text-[11px] leading-relaxed opacity-85">{notif.message}</p>
                        <span className="text-[9px] opacity-60 block pt-1">
                          {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer Actions */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleClearNotifications}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl transition-colors text-center shadow-xs"
                >
                  Clear All Notification Logs
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
