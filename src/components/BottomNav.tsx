import React from 'react';
import { LayoutDashboard, Flame, BookOpen, ClipboardList } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'notes', label: 'Knowledge', icon: BookOpen },
    { id: 'needs', label: 'Needs', icon: ClipboardList },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-850 text-white z-50 md:hidden flex justify-around items-center h-16 pb-safe">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all duration-150 relative ${
              isActive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-10 h-0.5 bg-emerald-400 rounded-full animate-pulse" />
            )}
            <Icon className={`w-5.5 h-5.5 mb-1 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
export default BottomNav;
