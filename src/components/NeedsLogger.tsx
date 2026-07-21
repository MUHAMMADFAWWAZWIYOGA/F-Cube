import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export interface FinancialRecord {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  dateStr: string; // YYYY-MM-DD
  notes: string;
}

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
  addSystemLog?: (title: string, message: string, type?: 'info' | 'alert' | 'success') => void;
}

export const NeedsLogger: React.FC<NeedsLoggerProps> = ({ pin, addSystemLog }) => {
  // Sync financial records & inventory wishlist in encrypted local storage
  const [finances, setFinances] = useLocalStorage<FinancialRecord[]>('my-monitor-finances', [
    {
      id: 'init-inc-1',
      title: 'Monthly Income / Freelance Project',
      type: 'income',
      amount: 4500000,
      category: 'Income',
      dateStr: new Date().toISOString().slice(0, 10),
      notes: 'Initial monthly budget deposit'
    },
    {
      id: 'init-exp-1',
      title: 'Hosting & Domain Subscription',
      type: 'expense',
      amount: 250000,
      category: 'Subscriptions',
      dateStr: new Date().toISOString().slice(0, 10),
      notes: 'Server infrastructure'
    }
  ], pin);

  const [items, setItems] = useLocalStorage<NeedItem[]>('my-monitor-needs', [], pin);
  
  // Deletion modals state
  const [deleteFinanceId, setDeleteFinanceId] = useState<string | null>(null);
  const [deleteNeedId, setDeleteNeedId] = useState<string | null>(null);

  // Active Sub-Tab view: 'finances' or 'wishlist'
  const [viewTab, setViewTab] = useState<'finances' | 'wishlist'>('finances');

  // Form states for Financial Record Creation
  const [showFinForm, setShowFinForm] = useState(false);
  const [finTitle, setFinTitle] = useState('');
  const [finType, setFinType] = useState<'income' | 'expense'>('expense');
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finCategory, setFinCategory] = useState('General');
  const [finNotes, setFinNotes] = useState('');

  // Form states for Wishlist Needs
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [needName, setNeedName] = useState('');
  const [needCategory, setNeedCategory] = useState('Hardware');
  const [needCost, setNeedCost] = useState(0);
  const [needLink, setNeedLink] = useState('');

  // Filter state
  const [finFilter, setFinFilter] = useState<'all' | 'income' | 'expense'>('all');

  const finCategories = ['Income', 'Hardware', 'Software', 'Subscriptions', 'Food & Daily', 'Utilities', 'General'];
  const needCategories = ['Hardware', 'Software', 'Tool', 'Subscription', 'Service', 'Other'];

  // Financial calculations
  const totalIncome = useMemo(() => {
    return finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [finances]);

  const totalExpense = useMemo(() => {
    return finances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [finances]);

  const netBalance = totalIncome - totalExpense;

  const totalNeedsCost = useMemo(() => {
    return items
      .filter(i => i.status === 'needed')
      .reduce((sum, i) => sum + (i.estimatedCost * i.qty), 0);
  }, [items]);

  // Category breakdown for Expense Chart
  const expenseByCategory = useMemo(() => {
    const map: { [cat: string]: number } = {};
    finances.filter(f => f.type === 'expense').forEach(f => {
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return map;
  }, [finances]);

  // Handle Add Financial Record
  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finTitle.trim() || finAmount <= 0) return;

    const newRecord: FinancialRecord = {
      id: crypto.randomUUID(),
      title: finTitle.trim(),
      type: finType,
      amount: finAmount,
      category: finCategory,
      dateStr: new Date().toISOString().slice(0, 10),
      notes: finNotes.trim()
    };

    setFinances([newRecord, ...finances]);
    if (addSystemLog) {
      addSystemLog(
        'TRANSAKSI CATAT',
        `${finType === 'income' ? 'Pemasukan' : 'Pengeluaran'} "Rp ${finAmount.toLocaleString('id-ID')}" (${finTitle}) berhasil dicatat.`,
        finType === 'income' ? 'success' : 'alert'
      );
    }

    setFinTitle('');
    setFinAmount(0);
    setFinNotes('');
    setShowFinForm(false);
  };

  // Handle Delete Financial Record
  const confirmDeleteFinance = () => {
    if (!deleteFinanceId) return;
    const target = finances.find(f => f.id === deleteFinanceId);
    setFinances(finances.filter(f => f.id !== deleteFinanceId));
    if (addSystemLog && target) {
      addSystemLog('TRANSAKSI DIHAPUS', `Catatan transaksi "${target.title}" telah dihapus.`, 'alert');
    }
    setDeleteFinanceId(null);
  };

  // Handle Add Need Wishlist Item
  const handleAddNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!needName.trim()) return;

    const newItem: NeedItem = {
      id: crypto.randomUUID(),
      name: needName.trim(),
      category: needCategory,
      qty: 1,
      estimatedCost: Math.max(0, needCost),
      link: needLink.trim(),
      priority: 'medium',
      status: 'needed',
      notes: '',
      updatedAt: new Date().toISOString()
    };

    setItems([newItem, ...items]);
    if (addSystemLog) {
      addSystemLog('KEBUTUHAN DITAMBAHKAN', `Item wishlist "${newItem.name}" dicatat.`, 'success');
    }

    setNeedName('');
    setNeedCost(0);
    setNeedLink('');
    setShowNeedForm(false);
  };

  // Handle Delete Need Wishlist Item
  const confirmDeleteNeed = () => {
    if (!deleteNeedId) return;
    const target = items.find(i => i.id === deleteNeedId);
    setItems(items.filter(i => i.id !== deleteNeedId));
    if (addSystemLog && target) {
      addSystemLog('INVENTARIS DIHAPUS', `Item "${target?.name}" dihapus dari daftar kebutuhan.`, 'alert');
    }
    setDeleteNeedId(null);
  };

  const filteredFinances = useMemo(() => {
    if (finFilter === 'all') return finances;
    return finances.filter(f => f.type === finFilter);
  }, [finances, finFilter]);

  return (
    <div className="space-y-5 animate-fade-slide-up select-none">
      {/* Top Header Card */}
      <div className="flex justify-between items-center bg-[#0b1623] border border-[#1c2b3a] p-4 rounded-2xl text-xs">
        <div>
          <h2 className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-2">
            SYS.FINANCE & RESOURCES <Wallet className="w-4 h-4 text-[#ff9f30]" />
          </h2>
          <p className="text-[#8b9bb4] text-[9px] mt-0.5 uppercase">Pencatatan Keuangan, Visual Chart, & Inventory</p>
        </div>
        
        {/* Tab Switcher Buttons */}
        <div className="flex items-center bg-[#1c2b3a]/40 p-1 border border-[#1c2b3a] rounded-xl">
          <button
            type="button"
            onClick={() => setViewTab('finances')}
            className={`px-3 py-1 text-[9px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${
              viewTab === 'finances'
                ? 'bg-[#ff9f30] text-[#0b1623] shadow-md'
                : 'text-[#8b9bb4] hover:text-white'
            }`}
          >
            PENCATATAN KEUANGAN
          </button>
          <button
            type="button"
            onClick={() => setViewTab('wishlist')}
            className={`px-3 py-1 text-[9px] font-bold tracking-wider uppercase transition-all rounded-lg cursor-pointer ${
              viewTab === 'wishlist'
                ? 'bg-[#ff9f30] text-[#0b1623] shadow-md'
                : 'text-[#8b9bb4] hover:text-white'
            }`}
          >
            KEBUTUHAN ({items.length})
          </button>
        </div>
      </div>

      {/* Financial Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="app-card p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider">
            <span>PEMASUKAN / INCOME</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#00ff9d]" />
          </div>
          <p className="text-base font-extrabold text-[#00ff9d] truncate">
            Rp {totalIncome.toLocaleString('id-ID')}
          </p>
          <p className="text-[7.5px] text-[#8b9bb4]">Total kredit masuk</p>
        </div>

        <div className="app-card p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider">
            <span>PENGELUARAN / EXPENSE</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#ff9f30]" />
          </div>
          <p className="text-base font-extrabold text-[#ff9f30] truncate">
            Rp {totalExpense.toLocaleString('id-ID')}
          </p>
          <p className="text-[7.5px] text-[#8b9bb4]">Total debet keluar</p>
        </div>

        <div className="app-card p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider">
            <span>SALDO NETTO</span>
            <Wallet className="w-3.5 h-3.5 text-[#f0f0f0]" />
          </div>
          <p className={`text-base font-extrabold truncate ${netBalance >= 0 ? 'text-[#00ff9d]' : 'text-red-400'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-[7.5px] text-[#8b9bb4]">Keseimbangan saldo</p>
        </div>

        <div className="app-card p-4 rounded-2xl space-y-1">
          <div className="flex justify-between items-center text-[8px] font-bold text-[#8b9bb4] uppercase tracking-wider">
            <span>ESTIMASI KEBUTUHAN</span>
            <ShoppingBag className="w-3.5 h-3.5 text-[#ff9f30]" />
          </div>
          <p className="text-base font-extrabold text-[#f0f0f0] truncate">
            Rp {totalNeedsCost.toLocaleString('id-ID')}
          </p>
          <p className="text-[7.5px] text-[#8b9bb4]">Biaya wishlist item</p>
        </div>
      </div>

      {/* Main Tab View 1: PENCATATAN KEUANGAN & GRAFIK CHART */}
      {viewTab === 'finances' && (
        <div className="space-y-5">
          {/* Cyber Financial Analytics Chart Component */}
          <div className="app-card p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-3 text-xs">
              <span className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00ff9d]" />
                // GRAFIK CASHFLOW & PROPORSI PENGELUARAN
              </span>
              <span className="text-[9px] font-mono text-[#00ff9d] bg-[#00ff9d]/10 px-2.5 py-0.5 rounded-full border border-[#00ff9d]/30">
                LIVE ANALYTICS CHART
              </span>
            </div>

            {/* Income vs Expense Bar Chart Visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Cashflow Comparison Bar Chart */}
              <div className="space-y-3 bg-[#1c2b3a]/15 p-4 rounded-xl border border-[#1c2b3a]">
                <h4 className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-widest flex items-center justify-between">
                  <span>PEMASUKAN vs PENGELUARAN</span>
                  <span className="text-[#00ff9d]">
                    {totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}% EXPENSE RATIO
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {/* Income bar */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold mb-1">
                      <span className="text-[#00ff9d]">INCOME (+)</span>
                      <span>Rp {totalIncome.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full h-3.5 bg-[#1c2b3a] rounded-full overflow-hidden border border-[#1c2b3a]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00ff9d]/60 to-[#00ff9d] rounded-full transition-all duration-500 shadow-[0_0_10px_#00ff9d]"
                        style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Expense bar */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold mb-1">
                      <span className="text-[#ff9f30]">EXPENSE (-)</span>
                      <span>Rp {totalExpense.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full h-3.5 bg-[#1c2b3a] rounded-full overflow-hidden border border-[#1c2b3a]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff9f30]/60 to-[#ff9f30] rounded-full transition-all duration-500 shadow-[0_0_10px_#ff9f30]"
                        style={{ width: `${totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expense Category Breakdown */}
              <div className="space-y-2.5 bg-[#1c2b3a]/15 p-4 rounded-xl border border-[#1c2b3a]">
                <h4 className="text-[9px] font-bold text-[#8b9bb4] uppercase tracking-widest">
                  BREAKDOWN KATEGORI PENGELUARAN
                </h4>

                {Object.keys(expenseByCategory).length === 0 ? (
                  <p className="text-[9px] text-[#8b9bb4] italic py-2">Belum ada pengeluaran dicatat.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(expenseByCategory).map(([cat, amt]) => {
                      const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold">
                            <span className="text-[#f0f0f0]">{cat}</span>
                            <span className="text-[#ff9f30]">Rp {amt.toLocaleString('id-ID')} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-[#1c2b3a] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#ff9f30] rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List & Form */}
          <div className="app-card p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-3 text-xs">
              <span className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-2">
                // JURNAL TRANSAKSI KEUANGAN
              </span>
              <button
                type="button"
                onClick={() => setShowFinForm(!showFinForm)}
                className="flex items-center gap-1.5 bg-[#ff9f30] text-[#0b1623] hover:bg-[#e68a1f] px-3 py-1 font-bold text-[9px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>TAMBAH TRANSAKSI</span>
              </button>
            </div>

            {/* Form Tambah Transaksi */}
            {showFinForm && (
              <form onSubmit={handleAddFinance} className="bg-[#1c2b3a]/30 border border-[#1c2b3a] p-4 rounded-2xl space-y-3.5 animate-fade-slide-up">
                <div className="flex items-center justify-between border-b border-[#1c2b3a]/60 pb-2 text-[9px] font-bold text-[#ff9f30] uppercase">
                  <span>CATAT TRANSAKSI KEUANGAN BARU</span>
                  <button type="button" onClick={() => setShowFinForm(false)} className="text-[#8b9bb4] hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Tipe Transaksi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFinType('income')}
                        className={`py-2 text-[9px] font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                          finType === 'income' 
                            ? 'bg-[#00ff9d] text-[#0b1623] border-[#00ff9d]' 
                            : 'bg-[#1c2b3a]/30 text-[#8b9bb4] border-[#1c2b3a]'
                        }`}
                      >
                        + PEMASUKAN
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinType('expense')}
                        className={`py-2 text-[9px] font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                          finType === 'expense' 
                            ? 'bg-[#ff9f30] text-[#0b1623] border-[#ff9f30]' 
                            : 'bg-[#1c2b3a]/30 text-[#8b9bb4] border-[#1c2b3a]'
                        }`}
                      >
                        - PENGELUARAN
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Kategori</label>
                    <select
                      value={finCategory}
                      onChange={(e) => setFinCategory(e.target.value)}
                      className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                    >
                      {finCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Nama Transaksi / Deskripsi</label>
                    <input
                      type="text"
                      placeholder="e.g. Pembelian Komponen RAM 16GB"
                      value={finTitle}
                      onChange={(e) => setFinTitle(e.target.value)}
                      className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Jumlah Nominal (Rp)</label>
                    <input
                      type="number"
                      placeholder="Nominal angka"
                      value={finAmount || ''}
                      onChange={(e) => setFinAmount(Number(e.target.value))}
                      className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFinForm(false)}
                    className="px-3 py-1.5 border border-[#1c2b3a] text-[#8b9bb4] text-[9px] font-bold uppercase rounded-xl hover:text-white"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#ff9f30] text-[#0b1623] text-[9px] font-extrabold uppercase rounded-xl hover:bg-[#e68a1f]"
                  >
                    SIMPAN TRANSAKSI
                  </button>
                </div>
              </form>
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-[#8b9bb4] uppercase">Filter:</span>
              {['all', 'income', 'expense'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinFilter(f as any)}
                  className={`px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-full border transition-all cursor-pointer ${
                    finFilter === f
                      ? 'bg-[#ff9f30] text-[#0b1623] border-[#ff9f30]'
                      : 'bg-[#1c2b3a]/20 text-[#8b9bb4] border-[#1c2b3a] hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'SEMUA' : f === 'income' ? 'PEMASUKAN (+)' : 'PENGELUARAN (-)'}
                </button>
              ))}
            </div>

            {/* Financial Transactions List */}
            {filteredFinances.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#1c2b3a] rounded-2xl">
                <Wallet className="w-6 h-6 text-[#1c2b3a] mx-auto mb-2" />
                <p className="text-[#8b9bb4] text-[9.5px] uppercase">Belum ada transaksi dalam riwayat.</p>
              </div>
            ) : (
              <div className="space-y-2.5 divide-y divide-[#1c2b3a]/40">
                {filteredFinances.map((f) => (
                  <div key={f.id} className="pt-2.5 flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 border rounded-xl shrink-0 ${
                        f.type === 'income' 
                          ? 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/40' 
                          : 'bg-[#ff9f30]/10 text-[#ff9f30] border-[#ff9f30]/40'
                      }`}>
                        {f.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[#f0f0f0] tracking-wide uppercase">{f.title}</h5>
                        <p className="text-[8px] text-[#8b9bb4] flex items-center gap-2">
                          <span className="text-[#ff9f30] font-bold">{f.category}</span> • {f.dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`font-mono text-xs font-extrabold ${f.type === 'income' ? 'text-[#00ff9d]' : 'text-[#ff9f30]'}`}>
                        {f.type === 'income' ? '+' : '-'} Rp {f.amount.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteFinanceId(f.id)}
                        className="p-1 text-[#8b9bb4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Hapus transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab View 2: INVENTORY KEBUTUHAN (WISHLIST ITEMS) */}
      {viewTab === 'wishlist' && (
        <div className="app-card p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#1c2b3a] pb-3 text-xs">
            <span className="font-bold text-[#f0f0f0] tracking-wider uppercase flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#ff9f30]" />
              // INVENTARIS & DAFTAR KEBUTUHAN
            </span>
            <button
              type="button"
              onClick={() => setShowNeedForm(!showNeedForm)}
              className="flex items-center gap-1.5 bg-[#ff9f30] text-[#0b1623] hover:bg-[#e68a1f] px-3 py-1 font-bold text-[9px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TAMBAH KEBUTUHAN</span>
            </button>
          </div>

          {/* Form Wishlist Need */}
          {showNeedForm && (
            <form onSubmit={handleAddNeed} className="bg-[#1c2b3a]/30 border border-[#1c2b3a] p-4 rounded-2xl space-y-3 animate-fade-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Nama Barang / Kebutuhan</label>
                  <input
                    type="text"
                    placeholder="e.g. SSD NVMe 1TB"
                    value={needName}
                    onChange={(e) => setNeedName(e.target.value)}
                    className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Kategori Barang</label>
                  <select
                    value={needCategory}
                    onChange={(e) => setNeedCategory(e.target.value)}
                    className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                  >
                    {needCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-[#8b9bb4] uppercase">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    placeholder="Estimasi Rp"
                    value={needCost || ''}
                    onChange={(e) => setNeedCost(Number(e.target.value))}
                    className="w-full bg-[#0b1623] border border-[#1c2b3a] p-2 text-xs text-[#f0f0f0] rounded-xl outline-none focus:border-[#ff9f30]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNeedForm(false)}
                  className="px-3 py-1.5 border border-[#1c2b3a] text-[#8b9bb4] text-[9px] font-bold uppercase rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ff9f30] text-[#0b1623] text-[9px] font-extrabold uppercase rounded-xl"
                >
                  CATAT KEBUTUHAN
                </button>
              </div>
            </form>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#1c2b3a] rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-[#1c2b3a] mx-auto mb-2" />
              <p className="text-[#8b9bb4] text-[9.5px] uppercase">Daftar kebutuhan kosong.</p>
            </div>
          ) : (
            <div className="space-y-2.5 divide-y divide-[#1c2b3a]/40">
              {items.map((item) => (
                <div key={item.id} className="pt-2.5 flex items-center justify-between group">
                  <div>
                    <h5 className="font-bold text-xs text-[#f0f0f0] tracking-wide uppercase">{item.name}</h5>
                    <p className="text-[8px] text-[#8b9bb4]">
                      <span className="text-[#ff9f30] font-bold">{item.category}</span> • Qty: {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-[#f0f0f0]">
                      Rp {(item.estimatedCost * item.qty).toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteNeedId(item.id)}
                      className="p-1 text-[#8b9bb4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={!!deleteFinanceId}
        title="HAPUS CATATAN TRANSAKSI"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini dari jurnal keuangan?"
        confirmText="HAPUS TRANSAKSI"
        onConfirm={confirmDeleteFinance}
        onCancel={() => setDeleteFinanceId(null)}
      />

      <ConfirmModal
        isOpen={!!deleteNeedId}
        title="HAPUS KEBUTUHAN WISHLIST"
        message="Apakah Anda yakin ingin menghapus barang kebutuhan ini dari daftar?"
        confirmText="HAPUS BARANG"
        onConfirm={confirmDeleteNeed}
        onCancel={() => setDeleteNeedId(null)}
      />
    </div>
  );
};

export default NeedsLogger;
