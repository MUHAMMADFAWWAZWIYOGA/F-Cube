import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Trash2, Link, ShoppingBag, CreditCard, Filter, ArrowUpDown, HelpCircle, CheckCircle, Clock, Eye } from 'lucide-react';

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

export const NeedsLogger: React.FC = () => {
  const [items, setItems] = useLocalStorage<NeedItem[]>('my-monitor-needs', []);

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

  // Categories list
  const categories = ['Hardware', 'Software', 'Tool', 'Subscription', 'Service', 'Other'];

  // Handle Add Item
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

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this resource log?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Toggle/cycle status
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

  // Priority ranking for sorting
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-0 py-6 pb-24 md:pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Resource & Needs Logger <ShoppingBag className="w-5 h-5 text-emerald-500" />
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            "Apa Saja Yang Dibutuhkan" — Log tools, subscriptions, hardware, or assets needed for your setups.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Need</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Outstanding Budget</span>
            <h3 className="text-xl font-bold text-slate-900">
              Rp {summaryStats.neededTotal.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] text-slate-500">{summaryStats.neededCount} items pending acquisition</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Invested / Spent</span>
            <h3 className="text-xl font-bold text-emerald-600">
              Rp {summaryStats.purchasedTotal.toLocaleString('id-ID')}
            </h3>
            <span className="text-[10px] text-emerald-500">{summaryStats.purchasedCount} items purchased</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Tracked Items</span>
            <h3 className="text-xl font-bold text-slate-950">
              {summaryStats.totalItemsCount}
            </h3>
            <span className="text-[10px] text-slate-500">Resource checklist inventory</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Keychron K2, Vercel Pro Plan"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Estimated Cost (Rp)</label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
              >
                <option value="needed">Needed</option>
                <option value="researched">Researched</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reference/Merchant Link (Optional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/product"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes / Specifications (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Grey color, ISO layout, requires USB-C adapter..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Log Resource
            </button>
          </div>
        </form>
      )}

      {/* Catalog Filters Workspace */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium text-slate-600 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium text-slate-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="needed">Needed</option>
            <option value="researched">Researched</option>
            <option value="purchased">Purchased</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium text-slate-600 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {/* Sorting option */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-400">Sort by:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                sortBy === 'name' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('cost')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                sortBy === 'cost' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cost
            </button>
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                sortBy === 'priority' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Priority
            </button>
          </div>
        </div>
      </div>

      {/* Resource Inventory List Cards */}
      {processedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-slate-800 font-bold text-base">No Items Logged</h4>
          <p className="text-slate-500 text-sm mt-1">
            There are no resources logged matching your current filters. Add items you need for your work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedItems.map((item) => {
            const priorityColors = {
              high: 'bg-red-50 text-red-700 border-red-100',
              medium: 'bg-amber-50 text-amber-700 border-amber-100',
              low: 'bg-slate-100 text-slate-600 border-slate-200'
            };

            const statusColors = {
              needed: 'bg-amber-500 text-white',
              researched: 'bg-blue-500 text-white',
              purchased: 'bg-emerald-500 text-white'
            };

            const statusIcons = {
              needed: HelpCircle,
              researched: Eye,
              purchased: CheckCircle
            };

            const StatusIcon = statusIcons[item.status];

            return (
              <div key={item.id} className="bg-white border border-slate-100 hover:border-slate-350 transition-all rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  {/* Top Metadata row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full capitalize ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                      <button
                        onClick={() => cycleStatus(item.id)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${statusColors[item.status]}`}
                        title="Click to cycle status: Needed -> Researched -> Purchased"
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{item.status}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Quantity */}
                  <div className="space-y-1">
                    <div className="flex items-baseline space-x-1.5">
                      <h4 className="font-bold text-slate-900 text-base leading-snug">{item.name}</h4>
                      <span className="text-slate-400 text-xs font-semibold">x{item.qty}</span>
                    </div>
                    {item.notes && <p className="text-slate-500 text-xs leading-relaxed">{item.notes}</p>}
                  </div>
                </div>

                {/* Footer Cost and Details */}
                <div className="border-t border-slate-50 pt-3 flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Cost</span>
                    <h5 className="font-extrabold text-slate-900 text-sm">
                      Rp {(item.estimatedCost * item.qty).toLocaleString('id-ID')}
                      {item.qty > 1 && (
                        <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                          (Rp {item.estimatedCost.toLocaleString('id-ID')} each)
                        </span>
                      )}
                    </h5>
                  </div>

                  <div className="flex items-center space-x-1">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-emerald-500 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        title="Open purchase URL link"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default NeedsLogger;
