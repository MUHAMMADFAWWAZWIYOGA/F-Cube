import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { DocumentManager } from './components/DocumentManager';
import { NeedsLogger } from './components/NeedsLogger';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Desktop Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content Frame */}
      <main className="flex-1 min-h-screen overflow-x-hidden relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {renderActiveTab()}
        </div>
      </main>

      {/* Mobile Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
