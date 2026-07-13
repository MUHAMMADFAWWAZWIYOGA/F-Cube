import React from 'react';
import { LayoutDashboard, Flame, BookOpen, ClipboardList } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'habits', label: 'HABITS', icon: Flame },
    { id: 'notes', label: 'NOTES', icon: BookOpen },
    { id: 'needs', label: 'NEEDS', icon: ClipboardList },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-[#0b1623] border-t border-[#1c2b3a] text-[#f0f0f0] z-40 flex justify-around items-center h-16">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[8px] font-bold tracking-wider transition-all duration-150 relative ${
              isActive ? 'text-[#ff9f30]' : 'text-[#8b9bb4] hover:text-[#f0f0f0]'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-10 h-0.5 bg-[#ff9f30]" />
            )}
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#ff9f30]' : 'text-[#8b9bb4]'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
export default BottomNav;
