import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, TrendUp, ArrowUpRight, ArrowDownLeft, Plus, Funnel, ShoppingCart, House, ForkKnife, GraduationCap, GameController, Car, DeviceMobile, Heart, Lightning, CaretDown } from '@phosphor-icons/react';
import { PinPad, isCofreUnlocked } from '../components/PinPad';
import { useNavigate } from 'react-router-dom';

const dataJuros = [
    { ano: '2024', montante: 1000 },
    { ano: '2025', montante: 2500 },
    { ano: '2026', montante: 5000 },
    { ano: '2027', montante: 9500 },
    { ano: '2028', montante: 18000 },
    { ano: '2029', montante: 35000 },
    { ano: '2030', montante: 72000 },
];

const dataDespesas = [
    { name: 'Moradia', value: 1200 },
    { name: 'Alimentação', value: 850 },
    { name: 'Educação', value: 450 },
    { name: 'Transporte', value: 380 },
    { name: 'Lazer', value: 220 },
    { name: 'Assinaturas', value: 180 },
];
const COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#27272a'];

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
    const navigate = useNavigate();

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
                    <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Finanças & Acumulação · Março 2026</p>
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
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-[9px] text-zinc-500 font-sans">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 glass-panel rounded-xl p-6 h-72">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendUp size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans">Projeção · Juros Compostos</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">12% a.a.</span>
                    </div>
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
                </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Extrato / Histórico</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setFilterCategory(filterCategory ? null : categories[0] || null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-widest border border-zinc-800/50 rounded-md hover:border-zinc-700 transition-colors"
                            >
                                <Funnel size={10} weight="duotone" />
                                {filterCategory || 'Todas'}
                                <CaretDown size={10} weight="bold" />
                            </button>
                            {filterCategory !== null && (
                                <div className="absolute right-0 top-full mt-1 bg-zinc-950 border border-zinc-800/50 rounded-lg py-1 z-20 min-w-[140px]">
                                    <button onClick={() => setFilterCategory(null)} className="w-full px-3 py-1.5 text-left text-[10px] text-zinc-400 uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-colors">Todas</button>
                                    {categories.map(cat => (
                                        <button key={cat} onClick={() => setFilterCategory(cat)} className={`w-full px-3 py-1.5 text-left text-[10px] uppercase tracking-wider hover:bg-zinc-900 transition-colors ${filterCategory === cat ? 'text-[var(--accent)]' : 'text-zinc-400 hover:text-white'}`}>{cat}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-[var(--accent)] uppercase tracking-widest border border-[var(--accent)]/25 rounded-md hover:bg-[var(--accent)]/10 transition-colors">
                            <Plus size={10} weight="bold" />
                            Nova
                        </motion.button>
                    </div>
                </div>

                <div className="space-y-1">
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
        </motion.div>
    );
};
