import React from 'react';
import { LayoutDashboard, Flame, Calendar, BookOpen, ClipboardList, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  setActiveTab,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, tag: 'CORE' },
    { id: 'habits', label: 'HABITS', icon: Flame, tag: 'DAILY' },
    { id: 'calendar', label: 'CALENDAR', icon: Calendar, tag: 'PLAN' },
    { id: 'notes', label: 'NOTES', icon: BookOpen, tag: 'DOCS' },
    { id: 'needs', label: 'NEEDS', icon: ClipboardList, tag: 'LOGS' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 cyber-nav-dock z-40 flex justify-around items-center h-20 px-2 select-none border-t-2 border-[#ff9f30]">
      {/* Background Cyber Scanline line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff9f30] to-transparent animate-pulse" />

      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 relative group ${
              isActive 
                ? 'text-[#ff9f30]' 
                : 'text-[#8b9bb4] hover:text-[#f0f0f0]'
            }`}
          >
            {/* Active Indicator Top Glow Line & Dot */}
            {isActive && (
              <>
                <div className="absolute -top-[2px] w-12 h-[3px] bg-[#ff9f30] shadow-[0_0_12px_#ff9f30]" />
                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-ping" />
              </>
            )}

            {/* Glowing Icon Container */}
            <div className={`p-1.5 transition-all duration-200 relative flex items-center justify-center ${
              isActive 
                ? 'bg-[#ff9f30]/15 border border-[#ff9f30]/80 shadow-[0_0_15px_rgba(255,159,48,0.35)] scale-110 animate-icon-pop' 
                : 'bg-transparent border border-transparent group-hover:border-[#1c2b3a] group-hover:bg-[#1c2b3a]/40'
            }`}>
              <Icon className={`w-5 h-5 transition-transform duration-200 ${
                isActive ? 'text-[#ff9f30] stroke-[2.5]' : 'text-[#8b9bb4] group-hover:scale-110'
              }`} />
              
              {isActive && (
                <Sparkles className="w-2.5 h-2.5 text-[#00ff9d] absolute -top-1 -right-1 animate-spin [animation-duration:6s]" />
              )}
            </div>

            {/* Label Text */}
            <span className={`text-[8px] font-bold tracking-widest mt-1 transition-all ${
              isActive ? 'text-[#ff9f30] font-extrabold scale-105' : 'text-[#8b9bb4] group-hover:text-[#f0f0f0]'
            }`}>
              {item.label}
            </span>

            {/* Micro Tag Badge */}
            <span className={`text-[6px] font-mono tracking-tighter opacity-70 uppercase transition-opacity ${
              isActive ? 'text-[#00ff9d] opacity-100 font-bold' : 'text-[#8b9bb4] group-hover:opacity-100'
            }`}>
              {item.tag}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
export default BottomNav;
