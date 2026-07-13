import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { DocumentManager } from './components/DocumentManager';
import { NeedsLogger } from './components/NeedsLogger';
import type { NeedItem } from './components/NeedsLogger';
import { Bell, X } from 'lucide-react';

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
  lastTriggeredDate?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>('my-monitor-notifications', [
    {
      id: 'init-notification',
      title: 'SYS.READY',
      message: "F'Cube Monitor pocket terminal active. On-device local database secured.",
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
            title: `ALARM: ${rem.title.toUpperCase()}`,
            message: `Time trigger reached: ${rem.time}. Execute routine.`,
            time: new Date().toISOString(),
            read: false,
            type: 'info'
          };
          setNotifications(prev => [newNotif, ...prev]);

          // Trigger OS notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`F'Cube Alert - ${rem.title}`, {
              body: `Scheduled alarm at ${rem.time}`,
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
            osc.frequency.setValueAtTime(1000, context.currentTime); // 1000Hz tone
            gain.gain.setValueAtTime(0.04, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.12);
          } catch (e) {
            console.warn('Audio synthesis alert failed:', e);
          }
        }
      });

      if (needsStateSave) {
        setReminders(updatedReminders);
      }
    };

    const checkerInterval = setInterval(checkReminders, 15000);
    return () => clearInterval(checkerInterval);
  }, [reminders, setReminders, setNotifications]);

  // Alert builder (aggregates notifications on dashboard item statuses)
  useEffect(() => {
    const highPriorityNeeds = needs.filter(item => item.priority === 'high' && item.status === 'needed');
    if (highPriorityNeeds.length > 0) {
      const needAlertId = `needs-alert-${highPriorityNeeds.length}`;
      const exists = notifications.some(n => n.id === needAlertId);
      if (!exists) {
        const newNotif: NotificationItem = {
          id: needAlertId,
          title: 'WARN: UNACQUIRED RESOURCE',
          message: `Pending: ${highPriorityNeeds.length} high priority inventory item(s).`,
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
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent py-0 md:py-8">
      {/* Handheld Blueprint Terminal Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:h-[820px] bg-[#0b1623] text-[#f0f0f0] flex flex-col relative overflow-hidden md:border-2 md:border-[#1c2b3a] md:shadow-2xl">
        
        {/* Top Header Bar */}
        <header className="bg-[#0b1623] border-b border-[#1c2b3a] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[#f0f0f0] font-bold text-[10px] tracking-wider select-none">
              SYS.MONITOR // ALPHA
            </span>
            <div className="w-1.5 h-1.5 bg-[#00ff9d] animate-pulse" />
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Clock Widget */}
            <div className="text-[9px] text-[#8b9bb4] font-bold bg-[#1c2b3a] px-2 py-0.5 rounded-none">
              {timeStr || 'SYS.CLOCK'}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setShowDrawer(true);
                handleMarkAllRead();
              }}
              className="p-1 text-[#8b9bb4] hover:text-[#ff9f30] transition-colors relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff9f30]" />
              )}
            </button>
          </div>
        </header>

        {/* Content View Workspace */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          {renderActiveTab()}
        </main>

        {/* Mobile bottom nav bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Notification Drawer (Slide-over) */}
        {showDrawer && (
          <div className="absolute inset-0 z-50 overflow-hidden">
            <div 
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-[#0b1623]/60 backdrop-blur-xs transition-opacity duration-300" 
            />

            <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0b1623] border-l border-[#1c2b3a] flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="p-4 border-b border-[#1c2b3a] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#f0f0f0]">LOGS & NOTIFICATIONS</h3>
                  <p className="text-[9px] text-[#8b9bb4]">ON-DEVICE CONSOLE</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="text-[#8b9bb4] hover:text-white p-1 hover:bg-[#1c2b3a] rounded-none transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Logs list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-[#8b9bb4]">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-[#1c2b3a]" />
                    <p className="text-[10px]">No logs recorded.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const typeColors = {
                      info: 'bg-[#1c2b3a]/30 border-[#1c2b3a] text-[#8b9bb4]',
                      alert: 'bg-transparent border-[#ff9f30]/40 text-[#ff9f30]',
                      success: 'bg-[#1c2b3a]/50 border-[#00ff9d]/30 text-[#00ff9d]'
                    };

                    const typeLabels = {
                      info: 'INFO',
                      alert: 'WARN',
                      success: 'OK'
                    };

                    return (
                      <div 
                        key={notif.id} 
                        className={`p-3 border rounded-none flex flex-col gap-1.5 ${typeColors[notif.type]}`}
                      >
                        <div className="flex items-center justify-between text-[8px] font-bold">
                          <span>[{typeLabels[notif.type]}] // ENTRY</span>
                          <span>{new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h4 className="font-bold text-[11px] leading-snug">{notif.title}</h4>
                        <p className="text-[10px] opacity-80 leading-relaxed">{notif.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-[#1c2b3a] shrink-0">
                  <button
                    onClick={handleClearNotifications}
                    className="w-full bg-[#1c2b3a] hover:bg-[#ff9f30] hover:text-[#0b1623] text-white font-bold text-[10px] py-2 transition-colors text-center border border-[#1c2b3a]"
                  >
                    CLEAR LOGS
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
