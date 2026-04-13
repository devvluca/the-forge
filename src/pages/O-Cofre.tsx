import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, TrendUp, ArrowUpRight, ArrowDownLeft, Plus, Funnel, ShoppingCart, House, ForkKnife, GraduationCap, GameController, Car, DeviceMobile, Heart, Lightning, CaretDown, Eraser, Warning, X, Wallet, Briefcase, FirstAid, Bus, FilmSlate, MusicNote, Gift, Bank, Student, CurrencyDollar } from '@phosphor-icons/react';
import { PinPad, isCofreUnlocked } from '../components/PinPad';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#52525b', '#27272a', '#a855f7', '#f59e0b'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const categoryIcons: Record<string, React.ComponentType<any>> = {
    'Alimentação': ForkKnife,
    'Moradia': House,
    'Educação': GraduationCap,
    'Lazer': GameController,
    'Transporte': Car,
    'Assinaturas': DeviceMobile,
    'Saúde': Heart,
    'Compras': ShoppingCart,
    'Serviços': Lightning,
    'Trabalho': Briefcase,
    'Investimento': Bank,
    'Presente': Gift,
    'Entretenimento': FilmSlate,
    'Música': MusicNote,
    'Médico': FirstAid,
    'Ônibus': Bus,
    'Faculdade': Student,
    'Outros': Wallet,
};

const EXPENSE_CATEGORIES = [
    'Alimentação', 'Moradia', 'Transporte', 'Educação', 'Lazer',
    'Assinaturas', 'Saúde', 'Compras', 'Serviços', 'Entretenimento', 'Outros',
];

const INCOME_CATEGORIES = [
    'Trabalho', 'Investimento', 'Presente', 'Serviços', 'Outros',
];

// Helper: format Date to 'DD/MM/YYYY'
const toDisplayDateFull = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper: format Date to 'YYYY-MM-DD'
const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

interface Transaction {
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
}

export const OCofre = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [unlocked, setUnlocked] = useState(isCofreUnlocked());
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const navigate = useNavigate();

    // New transaction modal state
    const [showNewModal, setShowNewModal] = useState(false);
    const [newType, setNewType] = useState<'expense' | 'income'>('expense');
    const [newAmount, setNewAmount] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newDate, setNewDate] = useState(toISODate(new Date()));
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic month / year subtitle
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setTransactions(data);
            }
        };
        fetchTransactions();
    }, []);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance = totalIncome - totalExpense;

    const filteredTransactions = filterCategory
        ? transactions.filter(t => t.category === filterCategory)
        : transactions;

    const categories = [...new Set(transactions.map(t => t.category))];

    // Clear all transactions from Supabase
    const clearAllTransactions = async () => {
        if (isClearing || transactions.length === 0) return;
        setIsClearing(true);
        try {
            const ids = transactions.map(t => t.id);
            await supabase.from('transactions').delete().in('id', ids);
            setTransactions([]);
            setFilterCategory(null);
            setShowClearConfirm(false);
        } finally {
            setIsClearing(false);
        }
    };

    // Reset new transaction form
    const resetNewForm = () => {
        setNewType('expense');
        setNewAmount('');
        setNewDescription('');
        setNewCategory('');
        setNewDate(toISODate(new Date()));
        setShowNewModal(false);
    };

    // Save new transaction
    const saveNewTransaction = async () => {
        const amount = parseFloat(newAmount.replace(',', '.'));
        if (!amount || amount <= 0 || !newDescription.trim() || !newCategory || isSaving) return;
        setIsSaving(true);
        try {
            const { data } = await supabase
                .from('transactions')
                .insert({
                    date: toDisplayDateFull(new Date(newDate + 'T12:00:00')),
                    description: newDescription.trim(),
                    category: newCategory,
                    amount: amount,
                    type: newType,
                })
                .select()
                .single();
            if (data) {
                setTransactions(prev => [data, ...prev]);
                resetNewForm();
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Build expense-by-category data dynamically from real transactions
    const dataDespesas = useMemo(() => {
        const map = new Map<string, number>();
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                map.set(t.category, (map.get(t.category) || 0) + Math.abs(t.amount));
            });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Build compound interest projection from current balance
    const dataJuros = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const annualRate = 0.12; // 12% a.a.
        const years = 7;
        const points = [];
        let montante = balance > 0 ? balance : 0;
        for (let i = 0; i < years; i++) {
            points.push({ ano: String(currentYear + i), montante: Math.round(montante) });
            montante *= (1 + annualRate);
        }
        return points;
    }, [balance]);

    // Current category list based on type
    const availableCategories = newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    if (!unlocked) {
        return (
            <PinPad
                onUnlock={() => setUnlocked(true)}
                onClose={() => navigate('/a-bigorna')}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-black bg-noise min-h-full"
        >
            <header className="mb-6 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck size={20} weight="duotone" className="neon-glow" />
                        <h1 className="text-2xl uppercase tracking-[0.2em] text-gradient-red font-bold">O Cofre</h1>
                    </div>
                    <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Finanças & Acumulação · {currentMonth}</p>
                </div>
            </header>

            <div className="h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/30 via-zinc-800/50 to-transparent mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl" />
                    <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans block mb-2">Saldo Atual</span>
                    <h2 className="text-3xl font-bold tracking-tight text-white relative z-10">
                        <span className="neon-glow">R$</span>{' '}
                        {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="glass-panel rounded-xl p-6">
                    <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans block mb-2">Receitas</span>
                    <div className="flex items-center gap-2">
                        <ArrowUpRight size={18} weight="bold" className="text-emerald-500" />
                        <span className="text-2xl font-bold text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6">
                    <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans block mb-2">Despesas</span>
                    <div className="flex items-center gap-2">
                        <ArrowDownLeft size={18} weight="bold" className="text-[var(--accent)]" />
                        <span className="text-2xl font-bold text-red-400">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="glass-panel rounded-xl p-6">
                    <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans block mb-4">Despesas por Categoria</span>
                    {dataDespesas.length > 0 ? (
                        <>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={dataDespesas} innerRadius={50} outerRadius={68} paddingAngle={3} dataKey="value" stroke="none">
                                            {dataDespesas.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: 'rgba(63,63,70,0.3)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                {dataDespesas.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[9px] text-zinc-500 font-sans">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-44 flex items-center justify-center">
                            <p className="text-zinc-700 text-xs font-sans">Nenhuma despesa registrada</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 glass-panel rounded-xl p-6 h-72">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendUp size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans">Projeção · Juros Compostos</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">12% a.a.</span>
                    </div>
                    {dataJuros.length > 0 && dataJuros.some(d => d.montante > 0) ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={dataJuros} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMontante" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="ano" stroke="transparent" tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="transparent" tick={{ fill: '#3f3f46', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: 'rgba(63,63,70,0.3)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="montante" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorMontante)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[85%] flex items-center justify-center">
                            <p className="text-zinc-700 text-xs font-sans">Adicione receitas para ver a projeção</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Extrato / Histórico</h2>
                    <div className="flex items-center gap-3">
                        {/* Nova Transação button — prominent */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[var(--accent)] text-black shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.5)] transition-all"
                        >
                            <Plus size={12} weight="bold" />
                            Nova Transação
                        </motion.button>

                        {/* Filter dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest border rounded-md transition-colors ${
                                    filterCategory
                                        ? 'text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent)]/5'
                                        : 'text-zinc-500 border-zinc-800/50 hover:border-zinc-700'
                                }`}
                            >
                                <Funnel size={10} weight="duotone" />
                                {filterCategory || 'Todas'}
                                <CaretDown size={10} weight="bold" className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showFilterDropdown && (
                                <>
                                    {/* Invisible overlay to close dropdown */}
                                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-1 bg-zinc-950 border border-zinc-800/50 rounded-lg py-1 z-20 min-w-[160px] shadow-xl shadow-black/40">
                                        <button
                                            onClick={() => { setFilterCategory(null); setShowFilterDropdown(false); }}
                                            className={`w-full px-3 py-2 text-left text-[10px] uppercase tracking-wider hover:bg-zinc-900 transition-colors ${!filterCategory ? 'text-[var(--accent)]' : 'text-zinc-400 hover:text-white'}`}
                                        >
                                            Todas
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setFilterCategory(cat); setShowFilterDropdown(false); }}
                                                className={`w-full px-3 py-2 text-left text-[10px] uppercase tracking-wider hover:bg-zinc-900 transition-colors ${filterCategory === cat ? 'text-[var(--accent)]' : 'text-zinc-400 hover:text-white'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Clear all button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowClearConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800/50 rounded-md hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                        >
                            <Eraser size={10} weight="bold" />
                            Limpar Tudo
                        </motion.button>
                    </div>
                </div>

                <div className="space-y-1">
                    {filteredTransactions.length === 0 && (
                        <p className="text-zinc-700 text-xs font-sans py-6 text-center">Nenhuma transação registrada ainda.</p>
                    )}
                    {filteredTransactions.map((t) => {
                        const Icon = categoryIcons[t.category] || ShoppingCart;
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 py-3 px-2 border-b border-zinc-800/20 last:border-none hover:bg-white/[0.01] rounded-lg transition-colors group cursor-pointer"
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800/50 border border-zinc-700/30'}`}>
                                    <Icon size={16} weight="duotone" className={t.type === 'income' ? 'text-emerald-400' : 'text-zinc-500'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-300 font-sans truncate group-hover:text-white transition-colors">{t.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-600 font-mono">{t.date}</span>
                                        <span className="text-[9px] text-zinc-700 bg-zinc-900 px-1.5 py-0.5 rounded tracking-wider">{t.category}</span>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold font-mono whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ==================== NEW TRANSACTION MODAL ==================== */}
            <AnimatePresence>
                {showNewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={() => resetNewForm()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="glass-panel rounded-2xl p-0 w-full max-w-md mx-4 border border-zinc-800/50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header with type toggle */}
                            <div className="p-5 pb-0">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <CurrencyDollar size={18} weight="duotone" className="text-[var(--accent)]" />
                                        <h3 className="text-sm uppercase tracking-[0.15em] font-bold text-white">Nova Transação</h3>
                                    </div>
                                    <button
                                        onClick={() => resetNewForm()}
                                        className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <X size={14} weight="bold" />
                                    </button>
                                </div>

                                {/* Type Toggle — Expense / Income */}
                                <div className="flex rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-1 mb-5">
                                    <button
                                        onClick={() => { setNewType('expense'); setNewCategory(''); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                            newType === 'expense'
                                                ? 'bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                        }`}
                                    >
                                        <ArrowDownLeft size={14} weight="bold" />
                                        Despesa
                                    </button>
                                    <button
                                        onClick={() => { setNewType('income'); setNewCategory(''); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                            newType === 'income'
                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                        }`}
                                    >
                                        <ArrowUpRight size={14} weight="bold" />
                                        Receita
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-5 pb-5 space-y-4">
                                {/* Amount field — big and prominent */}
                                <div>
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-2 font-sans">Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-lg">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={newAmount}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                                setNewAmount(val);
                                            }}
                                            placeholder="0,00"
                                            autoFocus
                                            className={`w-full bg-black/40 border rounded-xl pl-12 pr-4 py-4 text-2xl font-bold placeholder-zinc-800 focus:outline-none focus:ring-1 transition-all font-mono tracking-wide ${
                                                newType === 'expense'
                                                    ? 'border-red-500/20 text-red-400 focus:border-red-500/40 focus:ring-red-500/20'
                                                    : 'border-emerald-500/20 text-emerald-400 focus:border-emerald-500/40 focus:ring-emerald-500/20'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-2 font-sans">Descrição</label>
                                    <input
                                        type="text"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Ex: Almoço, Salário, Uber..."
                                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all font-sans tracking-wide"
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-2 font-sans">Data</label>
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all font-sans tracking-wide [color-scheme:dark]"
                                    />
                                </div>

                                {/* Category Grid */}
                                <div>
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-3 font-sans">Categoria</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableCategories.map((cat) => {
                                            const CatIcon = categoryIcons[cat] || Wallet;
                                            const isSelected = newCategory === cat;
                                            return (
                                                <motion.button
                                                    key={cat}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => setNewCategory(cat)}
                                                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all text-center ${
                                                        isSelected
                                                            ? newType === 'expense'
                                                                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                                                            : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <CatIcon size={18} weight={isSelected ? 'fill' : 'duotone'} />
                                                    <span className="text-[8px] uppercase tracking-wider leading-tight font-sans">{cat}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-5 pb-5 flex gap-3">
                                <button
                                    onClick={resetNewForm}
                                    className="flex-1 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                                >
                                    Cancelar
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={saveNewTransaction}
                                    disabled={!newAmount || !newDescription.trim() || !newCategory || isSaving}
                                    className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                        newType === 'expense'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    }`}
                                >
                                    {isSaving ? 'Salvando...' : newType === 'expense' ? 'Registrar Despesa' : 'Registrar Receita'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ==================== CLEAR CONFIRMATION MODAL ==================== */}
            <AnimatePresence>
                {showClearConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowClearConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="glass-panel rounded-xl p-6 w-full max-w-sm mx-4 border border-zinc-800/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Warning size={18} weight="duotone" className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Limpar Todas as Transações</h3>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">Esta ação não pode ser desfeita</p>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 mb-5 font-sans leading-relaxed">
                                Todas as transações (receitas e despesas) serão removidas permanentemente do banco de dados.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                                >
                                    Cancelar
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={clearAllTransactions}
                                    disabled={isClearing}
                                    className="px-5 py-2 rounded-lg text-[10px] uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all disabled:opacity-40"
                                >
                                    {isClearing ? 'Limpando...' : 'Limpar Tudo'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
