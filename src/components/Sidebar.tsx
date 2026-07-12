import React from 'react';
import { LayoutDashboard, Flame, BookOpen, ClipboardList, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habit Tracker', icon: Flame },
    { id: 'notes', label: 'Knowledge Base', icon: BookOpen },
    { id: 'needs', label: 'Needs Logger', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen hidden md:flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="flex flex-col">
        {/* App Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-850">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group hover:rotate-12 transition-transform duration-350 cursor-pointer">
            <span className="font-bold text-lg text-slate-950">M</span>
          </div>
          <div>
            <h1 className="font-bold text-md leading-none text-slate-100">F'Cube Monitor</h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Local First</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-emerald-400'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400'
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* PWA / Offline Status Indicator */}
      <div className="p-4 border-t border-slate-850">
        <div className="flex items-center space-x-3 bg-slate-850 px-4 py-3 rounded-xl border border-slate-800/80">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200">Device Storage</p>
            <p className="text-[10px] text-slate-500 truncate">100% Offline Secured</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
