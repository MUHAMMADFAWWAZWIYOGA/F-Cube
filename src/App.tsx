import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { DocumentManager } from './components/DocumentManager';
import { NeedsLogger } from './components/NeedsLogger';
import { generatePinHash } from './utils/crypto';
import { Bell, X, Lock, Download, Upload, Shield } from 'lucide-react';

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
  // Security PIN states
  const [pin, setPin] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [storedPinHash, setStoredPinHash] = useState<string>(() => {
    return localStorage.getItem('my-monitor-pin-hash') || '';
  });

  // Lockscreen keypad input buffers
  const [inputPin, setInputPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempNewPin, setTempNewPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active Tab View State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Encrypted LocalStorage states (synced using the session PIN key)
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>('my-monitor-notifications', [
    {
      id: 'init-notification',
      title: 'SYS.READY',
      message: "F'Cube Monitor pocket terminal active. AES-seeded encryption layers initialized.",
      time: new Date().toISOString(),
      read: false,
      type: 'success'
    }
  ], pin);
  const [reminders, setReminders] = useLocalStorage<ReminderItem[]>('my-monitor-reminders', [], pin);
  const [needs] = useLocalStorage<any[]>('my-monitor-needs', [], pin);

  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'logs' | 'settings'>('logs');
  const [timeStr, setTimeStr] = useState('');

  // Request Persistent Storage API
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log("F'Cube Monitor storage persistent cache verified.");
        } else {
          console.warn("F'Cube Monitor storage persistent cache rejected.");
        }
      });
    }
  }, []);

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

  // Background Reminder Alarm checker
  useEffect(() => {
    if (isLocked || !pin) return; // Only process when session is decrypted

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

          // Trigger in-app log entry
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

          // Trigger synth audio beep
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(1200, context.currentTime); // 1.2KHz tone
            gain.gain.setValueAtTime(0.04, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.15);
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
  }, [reminders, setReminders, setNotifications, isLocked, pin]);

  // Priority needs outstanding warning builder
  useEffect(() => {
    if (isLocked || !pin) return;

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
  }, [needs, notifications, setNotifications, isLocked, pin]);

  // Lock function (purges in-memory keys and sets lock flag)
  const handleLock = () => {
    setPin('');
    setInputPin('');
    setIsLocked(true);
    setErrorMessage('');
    setShowDrawer(false);
  };

  // Lockscreen Keypad actions
  const handleKeyPress = (val: string) => {
    setErrorMessage('');
    if (inputPin.length >= 4) return;
    const newBuf = inputPin + val;
    setInputPin(newBuf);

    if (newBuf.length === 4) {
      // Auto submit check
      if (storedPinHash) {
        // Unlock mode
        generatePinHash(newBuf).then((hash) => {
          if (hash === storedPinHash) {
            setPin(newBuf);
            setIsLocked(false);
            setInputPin('');
          } else {
            setErrorMessage('ACCESS DENIED // INVALID PIN');
            setInputPin('');
            if ('vibrate' in navigator) navigator.vibrate(100);
          }
        });
      } else {
        // Setup PIN mode
        if (setupStep === 'create') {
          setTempNewPin(newBuf);
          setSetupStep('confirm');
          setInputPin('');
        } else {
          if (newBuf === tempNewPin) {
            generatePinHash(newBuf).then((hash) => {
              localStorage.setItem('my-monitor-pin-hash', hash);
              setStoredPinHash(hash);
              setPin(newBuf);
              setIsLocked(false);
              setInputPin('');
              setSetupStep('create');
              setTempNewPin('');
            });
          } else {
            setErrorMessage('MISMATCH // RE-ENTER PIN');
            setInputPin('');
            setSetupStep('create');
            setTempNewPin('');
          }
        }
      }
    }
  };

  const handleKeyClear = () => {
    setInputPin('');
    setErrorMessage('');
  };

  const handleKeyBackspace = () => {
    setInputPin(inputPin.slice(0, -1));
    setErrorMessage('');
  };

  // Export encrypted storage JSON file to download
  const handleExportBackup = () => {
    const backup = {
      pinHash: localStorage.getItem('my-monitor-pin-hash') || '',
      habits: localStorage.getItem('my-monitor-habits') || '',
      notes: localStorage.getItem('my-monitor-notes') || '',
      needs: localStorage.getItem('my-monitor-needs') || '',
      reminders: localStorage.getItem('my-monitor-reminders') || '',
      notifications: localStorage.getItem('my-monitor-notifications') || ''
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fcube-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import local storage JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const backup = JSON.parse(evt.target?.result as string);
        if (backup && backup.pinHash !== undefined) {
          if (backup.pinHash) localStorage.setItem('my-monitor-pin-hash', backup.pinHash);
          if (backup.habits) localStorage.setItem('my-monitor-habits', backup.habits);
          if (backup.notes) localStorage.setItem('my-monitor-notes', backup.notes);
          if (backup.needs) localStorage.setItem('my-monitor-needs', backup.needs);
          if (backup.reminders) localStorage.setItem('my-monitor-reminders', backup.reminders);
          if (backup.notifications) localStorage.setItem('my-monitor-notifications', backup.notifications);
          
          alert('SYSTEM RESTORED SUCCESS // SYSTEM REBOOT');
          window.location.reload();
        } else {
          alert('RESTORE FAILURE: INVALID DATA');
        }
      } catch (err) {
        alert('RESTORE FAILURE: PARSE ERROR');
      }
    };
    reader.readAsText(file);
  };

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
        return <Dashboard setActiveTab={setActiveTab} pin={pin} />;
      case 'habits':
        return <HabitTracker pin={pin} />;
      case 'notes':
        return <DocumentManager pin={pin} />;
      case 'needs':
        return <NeedsLogger pin={pin} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} pin={pin} />;
    }
  };

  // 1. Render Lockscreen if no PIN entered yet
  if (isLocked) {
    const isSetup = !storedPinHash;
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent py-0 md:py-8">
        <div className="w-full max-w-md h-screen md:h-[820px] bg-[#0b1623] text-[#f0f0f0] flex flex-col justify-between p-6 md:border-2 md:border-[#1c2b3a] md:shadow-2xl">
          
          {/* Header info */}
          <div className="text-center space-y-2 mt-8">
            <div className="inline-flex items-center justify-center p-3.5 bg-[#1c2b3a]/30 border border-[#1c2b3a] mb-2">
              <Shield className="w-8 h-8 text-[#ff9f30] animate-pulse" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#f0f0f0]">F'CUBE SECURED GATEWAY</h2>
            <p className="text-[8px] text-[#8b9bb4] tracking-wider uppercase">// DATA DECRYPTION UTILITY</p>
          </div>

          {/* Main keypad buffer display */}
          <div className="space-y-4 my-auto">
            <div className="text-center">
              <span className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block mb-2">
                {isSetup 
                  ? setupStep === 'create' ? 'DEFINE NEW SECURITY PIN' : 'CONFIRM YOUR NEW PIN'
                  : 'SYSTEM LOCKED // VERIFY SECURITY PIN'
                }
              </span>

              {/* Dots grid indicator */}
              <div className="flex justify-center space-x-4 my-3.5">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 border transition-all duration-150 ${
                      inputPin.length > idx 
                        ? 'bg-[#ff9f30] border-[#ff9f30]' 
                        : 'bg-transparent border-[#1c2b3a]'
                    }`}
                  />
                ))}
              </div>

              {/* Error messages */}
              {errorMessage && (
                <p className="text-[8px] font-bold text-[#ff9f30] mt-1 uppercase tracking-wider animate-pulse">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Matrix number pad */}
            <div className="max-w-[280px] mx-auto grid grid-cols-3 gap-2.5 pt-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="bg-[#1c2b3a]/40 hover:bg-[#ff9f30] hover:text-[#0b1623] border border-[#1c2b3a] py-3 text-xs font-bold transition-colors text-center text-[#f0f0f0]"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeyClear}
                className="bg-[#1c2b3a]/20 border border-[#1c2b3a] text-[#8b9bb4] hover:text-white py-3 text-[9px] font-bold transition-colors text-center"
              >
                CLR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="bg-[#1c2b3a]/40 hover:bg-[#ff9f30] hover:text-[#0b1623] border border-[#1c2b3a] py-3 text-xs font-bold transition-colors text-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeyBackspace}
                className="bg-[#1c2b3a]/20 border border-[#1c2b3a] text-[#8b9bb4] hover:text-white py-3 text-[9px] font-bold transition-colors text-center"
              >
                DEL
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[7px] text-[#8b9bb4] uppercase tracking-wider mb-2">
            Local encryption only. PIN hashes are stored locally.
          </div>
        </div>
      </div>
    );
  }

  // 2. Render App Shell if unlocked
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent py-0 md:py-8">
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
            <div className="text-[9px] text-[#8b9bb4] font-bold bg-[#1c2b3a] px-2 py-0.5">
              {timeStr || 'SYS.CLOCK'}
            </div>

            {/* Lock Button */}
            <button
              onClick={handleLock}
              className="p-1 text-[#8b9bb4] hover:text-[#ff9f30] transition-colors"
              title="Lock Terminal"
            >
              <Lock className="w-4.5 h-4.5" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setDrawerTab('logs');
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

        {/* Console Drawer (Logs / Backup settings) */}
        {showDrawer && (
          <div className="absolute inset-0 z-50 overflow-hidden">
            <div 
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-[#0b1623]/60 backdrop-blur-xs transition-opacity duration-300" 
            />

            <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0b1623] border-l border-[#1c2b3a] flex flex-col animate-slide-in-right">
              {/* Tabs selector inside drawer */}
              <div className="border-b border-[#1c2b3a] flex shrink-0">
                <button
                  onClick={() => setDrawerTab('logs')}
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider text-center border-r border-[#1c2b3a] ${
                    drawerTab === 'logs' ? 'bg-[#1c2b3a] text-white' : 'text-[#8b9bb4] hover:text-white'
                  }`}
                >
                  SYSTEM LOGS
                </button>
                <button
                  onClick={() => setDrawerTab('settings')}
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider text-center ${
                    drawerTab === 'settings' ? 'bg-[#1c2b3a] text-white' : 'text-[#8b9bb4] hover:text-white'
                  }`}
                >
                  BACKUP CTRL
                </button>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="px-3 text-[#8b9bb4] hover:text-white hover:bg-[#1c2b3a]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                {drawerTab === 'logs' ? (
                  <div className="space-y-3">
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
                ) : (
                  // Backup controller panel
                  <div className="space-y-5 text-xs">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-[#f0f0f0] tracking-wide uppercase">// SECURITY ENCRYPTION</h4>
                      <p className="text-[10px] text-[#8b9bb4] leading-relaxed">
                        All database partitions are encrypted locally using AES-seeded stream values derived from your security PIN.
                      </p>
                    </div>

                    <div className="border border-[#1c2b3a] p-3 space-y-3">
                      <div>
                        <span className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">// DATA EXPORT</span>
                        <p className="text-[9px] text-[#8b9bb4] mt-0.5 leading-relaxed">
                          Download a copy of the database bundle to your device. The backup file remains secure and encrypted.
                        </p>
                      </div>
                      <button
                        onClick={handleExportBackup}
                        className="w-full bg-[#1c2b3a] hover:bg-[#ff9f30] hover:text-[#0b1623] text-white font-bold text-[9px] tracking-wider py-2 flex items-center justify-center gap-1.5 border border-[#1c2b3a] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD BACKUP</span>
                      </button>
                    </div>

                    <div className="border border-[#1c2b3a] p-3 space-y-3">
                      <div>
                        <span className="text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider block">// DATA IMPORT</span>
                        <p className="text-[9px] text-[#8b9bb4] mt-0.5 leading-relaxed text-wrap">
                          Restore a previously downloaded database bundle. This will replace the current local storage records.
                        </p>
                      </div>
                      <label className="w-full bg-[#1c2b3a] hover:bg-[#ff9f30] hover:text-[#0b1623] text-white font-bold text-[9px] tracking-wider py-2 flex items-center justify-center gap-1.5 border border-[#1c2b3a] transition-colors cursor-pointer text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>CHOOSE BACKUP FILE</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer bottom actions */}
              {drawerTab === 'logs' && notifications.length > 0 && (
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
