import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, Link, ShoppingBag, ArrowUpDown, HelpCircle, CheckCircle, Eye } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export interface NeedItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  estimatedCost: number;
  link: string;
  priority: 'low' | 'medium' | 'high';
  status: 'needed' | 'purchased' | 'researched';
  notes: string;
  updatedAt: string;
}

interface NeedsLoggerProps {
  pin: string;
}

export const NeedsLogger: React.FC<NeedsLoggerProps> = ({ pin }) => {
  const [items, setItems] = useLocalStorage<NeedItem[]>('my-monitor-needs', [], pin);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [qty, setQty] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'needed' | 'purchased' | 'researched'>('needed');
  const [notes, setNotes] = useState('');

  // Filters & Sorting
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'priority'>('name');

  const categories = ['Hardware', 'Software', 'Tool', 'Subscription', 'Service', 'Other'];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: NeedItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      qty: Math.max(1, qty),
      estimatedCost: Math.max(0, estimatedCost),
      link: link.trim(),
      priority,
      status,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    
    // Reset form
    setName('');
    setCategory('Hardware');
    setQty(1);
    setEstimatedCost(0);
    setLink('');
    setPriority('medium');
    setStatus('needed');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteItem = () => {
    if (!deleteConfirmId) return;
    setItems(items.filter(item => item.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const cycleStatus = (id: string) => {
    const statusCycle: ('needed' | 'researched' | 'purchased')[] = ['needed', 'researched', 'purchased'];
    const updated = items.map(item => {
      if (item.id === id) {
        const nextIndex = (statusCycle.indexOf(item.status) + 1) % statusCycle.length;
        return {
          ...item,
          status: statusCycle[nextIndex],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    setItems(updated);
  };

  // Calculate costs
  const summaryStats = useMemo(() => {
    let neededTotal = 0;
    let purchasedTotal = 0;
    let totalItemsCount = items.length;
    let neededCount = 0;
    let purchasedCount = 0;

    items.forEach(item => {
      const itemCost = item.estimatedCost * item.qty;
      if (item.status === 'purchased') {
        purchasedTotal += itemCost;
        purchasedCount++;
      } else {
        neededTotal += itemCost;
        if (item.status === 'needed') {
          neededCount++;
        }
      }
    });

    return {
      neededTotal,
      purchasedTotal,
      totalItemsCount,
      neededCount,
      purchasedCount
    };
  }, [items]);

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  // Filter & Sort items
  const processedItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
        return matchesCategory && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'cost') {
          return (b.estimatedCost * b.qty) - (a.estimatedCost * a.qty);
        }
        if (sortBy === 'priority') {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
      });
  }, [items, filterCategory, filterStatus, filterPriority, sortBy]);

  return (
    <div className="space-y-4">
      {/* Title Widget */}
      <div className="flex justify-between items-center bg-[#0b1623] border border-[#1c2b3a] p-4 text-xs">
        <div>
          <h2 className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-1.5">
            SYS.INVENTORY <ShoppingBag className="w-3.5 h-3.5 text-[#00ff9d]" />
          </h2>
          <p className="text-[#8b9bb4] text-[9px] mt-0.5 uppercase">RESOURCE & NEEDS LOGGER</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 bg-[#ff9f30] text-[#0b1623] px-2.5 py-1.5 font-bold text-[10px] tracking-wide"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD NEW</span>
        </button>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="app-card p-3 flex flex-col justify-between">
          <span className="text-[7px] text-[#8b9bb4] font-bold uppercase tracking-wider block">PENDING BUDGET</span>
          <h3 className="text-xs font-bold text-[#ff9f30] mt-1">
            Rp {summaryStats.neededTotal.toLocaleString('id-ID')}
          </h3>
          <span className="text-[8px] text-[#8b9bb4] mt-1 block">{summaryStats.neededCount} ITEMS</span>
        </div>

        <div className="app-card p-3 flex flex-col justify-between">
          <span className="text-[7px] text-[#8b9bb4] font-bold uppercase tracking-wider block">ACQUIRED/SPENT</span>
          <h3 className="text-xs font-bold text-[#00ff9d] mt-1">
            Rp {summaryStats.purchasedTotal.toLocaleString('id-ID')}
          </h3>
          <span className="text-[8px] text-[#8b9bb4] mt-1 block">{summaryStats.purchasedCount} ITEMS</span>
        </div>

        <div className="app-card p-3 flex flex-col justify-between">
          <span className="text-[7px] text-[#8b9bb4] font-bold uppercase tracking-wider block">TOTAL ITEMS</span>
          <h3 className="text-xs font-bold text-[#f0f0f0] mt-1">
            {summaryStats.totalItemsCount}
          </h3>
          <span className="text-[8px] text-[#8b9bb4] mt-1 block">LOG ENTRIES</span>
        </div>
      </div>

      {/* Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-[#0b1623] border border-[#1c2b3a] p-4 space-y-3.5 animate-fadeIn text-xs">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Keyboard, Vercel Pro Plan"
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs uppercase"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Quantity</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Cost per unit (Rp)</label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs uppercase"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs uppercase"
            >
              <option value="needed">NEEDED</option>
              <option value="researched">RESEARCHED</option>
              <option value="purchased">PURCHASED</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Reference URL</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-wider block">Specifications / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Gray color, US layout..."
              rows={2}
              className="w-full bg-[#0b1623] text-[#f0f0f0] px-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-xs resize-none"
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
              LOG ITEM
            </button>
          </div>
        </form>
      )}

      {/* Filters workspace */}
      <div className="bg-[#0b1623] border border-[#1c2b3a] p-3.5 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-[#0b1623] border border-[#1c2b3a] px-2 py-1.5 text-[9px] font-bold text-[#8b9bb4] focus:outline-none focus:border-[#ff9f30]"
          >
            <option value="all">ALL CATEGORIES</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#0b1623] border border-[#1c2b3a] px-2 py-1.5 text-[9px] font-bold text-[#8b9bb4] focus:outline-none focus:border-[#ff9f30]"
          >
            <option value="all">ALL STATUSES</option>
            <option value="needed">NEEDED</option>
            <option value="researched">RESEARCHED</option>
            <option value="purchased">PURCHASED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-[#0b1623] border border-[#1c2b3a] px-2 py-1.5 text-[9px] font-bold text-[#8b9bb4] focus:outline-none focus:border-[#ff9f30]"
          >
            <option value="all">ALL PRIORITIES</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
          </select>
        </div>

        {/* Sorting option */}
        <div className="flex items-center justify-between gap-2 border-t border-[#1c2b3a]/50 pt-2 text-[9px] font-bold text-[#8b9bb4]">
          <span className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> SORT BY:
          </span>
          <div className="flex bg-[#1c2b3a]/50 p-0.5 border border-[#1c2b3a]">
            <button
              onClick={() => setSortBy('name')}
              className={`px-2 py-1 text-[8px] font-bold rounded-none transition-all ${
                sortBy === 'name' ? 'bg-[#ff9f30] text-[#0b1623]' : 'text-[#8b9bb4] hover:text-white'
              }`}
            >
              NAME
            </button>
            <button
              onClick={() => setSortBy('cost')}
              className={`px-2 py-1 text-[8px] font-bold rounded-none transition-all ${
                sortBy === 'cost' ? 'bg-[#ff9f30] text-[#0b1623]' : 'text-[#8b9bb4] hover:text-white'
              }`}
            >
              COST
            </button>
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2 py-1 text-[8px] font-bold rounded-none transition-all ${
                sortBy === 'priority' ? 'bg-[#ff9f30] text-[#0b1623]' : 'text-[#8b9bb4] hover:text-white'
              }`}
            >
              PRIORITY
            </button>
          </div>
        </div>
      </div>

      {/* Resource log items */}
      {processedItems.length === 0 ? (
        <div className="bg-[#0b1623] border border-[#1c2b3a] p-8 text-center">
          <ShoppingBag className="w-8 h-8 text-[#1c2b3a] mx-auto mb-1.5" />
          <p className="text-[#8b9bb4] text-[10px]">NO ITEMS RECORDED IN CATALOG.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {processedItems.map((item) => {
            const priorityColors = {
              high: 'bg-[#1c2b3a] text-[#ff9f30] border-[#ff9f30]/40',
              medium: 'bg-[#1c2b3a]/50 text-[#8b9bb4] border-[#1c2b3a]',
              low: 'bg-[#0b1623] text-[#8b9bb4] border-[#1c2b3a]'
            };

            const statusColors = {
              needed: 'bg-[#ff9f30]/20 text-[#ff9f30] border-[#ff9f30]/40',
              researched: 'bg-[#1c2b3a] text-[#8b9bb4] border-[#1c2b3a]',
              purchased: 'bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]/30'
            };

            const statusIcons = {
              needed: HelpCircle,
              researched: Eye,
              purchased: CheckCircle
            };

            const StatusIcon = statusIcons[item.status];

            return (
              <div key={item.id} className="app-card p-4 flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[9px] font-bold">
                    <span className="text-[#ff9f30] bg-[#1c2b3a]/30 border border-[#1c2b3a] px-1.5 py-0.2">
                      {item.category.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.2 border ${priorityColors[item.priority]}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <button
                        onClick={() => cycleStatus(item.id)}
                        className={`px-1.5 py-0.2 border flex items-center gap-1 transition-all ${statusColors[item.status]}`}
                        title="Click to cycle status"
                      >
                        <StatusIcon className="w-2.5 h-2.5" />
                        <span>{item.status.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Quantity */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline space-x-1.5">
                      <h4 className="font-bold text-[#f0f0f0] text-xs leading-snug">{item.name}</h4>
                      <span className="text-[#8b9bb4] text-[10px] font-bold">X{item.qty}</span>
                    </div>
                    {item.notes && <p className="text-[#8b9bb4] text-[10px] leading-relaxed mt-0.5">{item.notes}</p>}
                  </div>
                </div>

                {/* Footer details */}
                <div className="border-t border-[#1c2b3a]/50 pt-2.5 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="text-[7px] font-bold text-[#8b9bb4] uppercase block">EST. BUDGET</span>
                    <h5 className="font-bold text-[#f0f0f0]">
                      Rp {(item.estimatedCost * item.qty).toLocaleString('id-ID')}
                      {item.qty > 1 && (
                        <span className="text-[8px] text-[#8b9bb4] block font-medium mt-0.5">
                          (Rp {item.estimatedCost.toLocaleString('id-ID')} EACH)
                        </span>
                      )}
                    </h5>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8b9bb4] hover:text-[#00ff9d] p-1.5 hover:bg-[#1c2b3a] transition-colors"
                        title="Open URL"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-[#8b9bb4] hover:text-[#ff9f30] p-1.5 hover:bg-[#1c2b3a] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="HAPUS INVENTARIS // DELETE ITEM"
        message="Apakah Anda yakin ingin menghapus item inventaris kebutuhan ini?"
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
export default NeedsLogger;
