import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, TrendUp, ArrowUpRight, ArrowDownLeft, Plus, Funnel, ShoppingCart, House, ForkKnife, GraduationCap, GameController, Car, DeviceMobile, Heart, Lightning, CaretDown, Eraser, Warning, X, Wallet, Briefcase, FirstAid, Bus, FilmSlate, MusicNote, Gift, Bank, Student, CurrencyDollar, PiggyBank, ChartLineUp, PencilSimple, Check, CreditCard, CalendarBlank } from '@phosphor-icons/react';
import { PinPad, isCofreUnlocked } from '../components/PinPad';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#52525b', '#27272a', '#a855f7', '#f59e0b'];

// CDI anual atual (approx)
const CDI_ANUAL = 0.1365; // 13.65% a.a.
const CDI_DIARIO = Math.pow(1 + CDI_ANUAL, 1 / 252) - 1; // ~252 dias úteis

// FII yield mensal médio
const FII_YIELD_MENSAL = 0.008; // 0.8% a.m.

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

// Calcular dias úteis entre agora e data futura (aprox 21 por mês)
const diasUteisNoMes = 21;

// Cart credit card info
const FATURA_FECHAMENTO = 4;
const FATURA_VENCIMENTO = 10;

interface Transaction {
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    payment_method?: 'debito' | 'credito' | null;
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
    const [newType, setNewType] = useState<'expense' | 'income' | 'pagar_fatura'>('expense');
    const [newAmount, setNewAmount] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newDate, setNewDate] = useState(toISODate(new Date()));
    const [newPaymentMethod, setNewPaymentMethod] = useState<'debito' | 'credito'>('debito');
    const [isSaving, setIsSaving] = useState(false);
    const [faturaSource, setFaturaSource] = useState<'conta_corrente' | 'cofrinho'>('conta_corrente');

    // Wallet pools state
    const [contaCorrente, setContaCorrente] = useState(0);
    const [cofrinho, setCofrinho] = useState(0);
    const [investidoFII, setInvestidoFII] = useState(0);
    const [faturaCartao, setFaturaCartao] = useState(0);
    const [editingPool, setEditingPool] = useState<string | null>(null);
    const [editPoolValue, setEditPoolValue] = useState('');

    const patrimonioTotal = contaCorrente + cofrinho + investidoFII;

    // Dynamic month / year subtitle
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Calcular fatura info
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Próximo fechamento
    const proximoFechamento = new Date(anoAtual, diaAtual > FATURA_FECHAMENTO ? mesAtual + 1 : mesAtual, FATURA_FECHAMENTO);
    const diasParaFechamento = Math.ceil((proximoFechamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    // Rendimento CDI diário do cofrinho
    const rendimentoDiario = cofrinho * CDI_DIARIO;

    // Fetch wallet pools from Supabase
    useEffect(() => {
        const fetchPools = async () => {
            const { data } = await supabase.from('wallet_pools').select('*');
            if (data) {
                for (const pool of data) {
                    if (pool.pool_type === 'conta_corrente') setContaCorrente(pool.balance);
                    if (pool.pool_type === 'cofrinho') setCofrinho(pool.balance);
                    if (pool.pool_type === 'investido_fii') setInvestidoFII(pool.balance);
                    if (pool.pool_type === 'fatura_cartao') setFaturaCartao(pool.balance);
                }
            }
        };
        fetchPools();
    }, []);

    // Save pool to Supabase (upsert)
    const savePool = async (poolType: string, value: number) => {
        await supabase.from('wallet_pools').upsert(
            { pool_type: poolType, balance: value },
            { onConflict: 'pool_type' }
        );
    };

    // Edit pool inline
    const startEditPool = (poolType: string, currentValue: number) => {
        setEditingPool(poolType);
        setEditPoolValue(currentValue.toString().replace('.', ','));
    };

    const confirmEditPool = async () => {
        if (!editingPool) return;
        const value = parseFloat(editPoolValue.replace(',', '.')) || 0;
        if (editingPool === 'conta_corrente') setContaCorrente(value);
        if (editingPool === 'cofrinho') setCofrinho(value);
        if (editingPool === 'investido_fii') setInvestidoFII(value);
        if (editingPool === 'fatura_cartao') setFaturaCartao(value);
        await savePool(editingPool, value);
        setEditingPool(null);
        setEditPoolValue('');
    };

    const cancelEditPool = () => {
        setEditingPool(null);
        setEditPoolValue('');
    };

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
        setNewPaymentMethod('debito');
        setShowNewModal(false);
    };

    // Pay credit card bill
    const payFatura = async () => {
        if (faturaCartao <= 0 || isSaving) return;
        const sourceBalance = faturaSource === 'conta_corrente' ? contaCorrente : cofrinho;
        if (sourceBalance < faturaCartao) return;
        setIsSaving(true);
        try {
            const sourceLabel = faturaSource === 'conta_corrente' ? 'Conta Corrente' : 'Cofrinho';
            // Create transaction record
            const { data } = await supabase
                .from('transactions')
                .insert({
                    date: toDisplayDateFull(new Date()),
                    description: `Pagamento de Fatura (via ${sourceLabel})`,
                    category: 'Serviços',
                    amount: faturaCartao,
                    type: 'expense',
                    payment_method: 'debito',
                })
                .select()
                .single();
            if (data) {
                setTransactions(prev => [data, ...prev]);
            }
            // Deduct from chosen source
            const newBalance = sourceBalance - faturaCartao;
            if (faturaSource === 'conta_corrente') {
                setContaCorrente(newBalance);
                await savePool('conta_corrente', newBalance);
            } else {
                setCofrinho(newBalance);
                await savePool('cofrinho', newBalance);
            }
            // Zero the fatura
            setFaturaCartao(0);
            await savePool('fatura_cartao', 0);
            resetNewForm();
        } finally {
            setIsSaving(false);
        }
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
                    payment_method: newType === 'expense' ? newPaymentMethod : null,
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

    // Build DUAL projection: Cofrinho (CDI) + FII
    const dataProjecao = useMemo(() => {
        const months = 24; // 2 anos
        const points = [];
        let cofrinhoProj = cofrinho;
        let fiiProj = investidoFII;

        for (let i = 0; i <= months; i++) {
            const mesLabel = new Date(anoAtual, mesAtual + i, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            points.push({
                mes: mesLabel,
                cofrinho: Math.round(cofrinhoProj),
                fii: Math.round(fiiProj),
                total: Math.round(cofrinhoProj + fiiProj),
            });
            // Cofrinho: CDI diário * dias úteis no mês
            cofrinhoProj *= Math.pow(1 + CDI_DIARIO, diasUteisNoMes);
            // FII: yield mensal
            fiiProj *= (1 + FII_YIELD_MENSAL);
        }
        return points;
    }, [cofrinho, investidoFII, mesAtual, anoAtual]);

    // Current category list based on type
    const availableCategories = newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    // Pool card helper
    const renderPoolCard = (
        poolType: string,
        label: string,
        value: number,
        icon: React.ReactNode,
        colorClass: string,
        borderColor: string,
        subtitle: string,
        badge?: string,
    ) => (
        <div className="glass-panel rounded-xl p-5 group relative">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-zinc-500 uppercase text-[10px] tracking-[0.15em] font-sans">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {badge && (
                        <span className={`text-[8px] px-2 py-0.5 rounded-full ${borderColor} font-mono tracking-wider`}>{badge}</span>
                    )}
                    {editingPool !== poolType && (
                        <button
                            onClick={() => startEditPool(poolType, value)}
                            className={`p-1.5 rounded-md text-zinc-700 hover:${colorClass} opacity-0 group-hover:opacity-100 transition-all`}
                        >
                            <PencilSimple size={12} weight="bold" />
                        </button>
                    )}
                </div>
            </div>
            {editingPool === poolType ? (
                <div className="flex items-center gap-2">
                    <span className={`${colorClass} font-bold text-lg`}>R$</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={editPoolValue}
                        onChange={(e) => setEditPoolValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmEditPool(); if (e.key === 'Escape') cancelEditPool(); }}
                        autoFocus
                        className={`bg-black/40 border ${borderColor.replace('bg-', 'border-').split(' ')[0]} rounded-lg px-3 py-1.5 text-xl font-bold ${colorClass} font-mono w-full focus:outline-none focus:ring-1`}
                    />
                    <button onClick={confirmEditPool} className={`p-1.5 rounded-md ${colorClass}`}><Check size={14} weight="bold" /></button>
                    <button onClick={cancelEditPool} className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-400"><X size={14} weight="bold" /></button>
                </div>
            ) : (
                <h3 className={`text-2xl font-bold ${colorClass} font-mono tracking-tight`}>
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
            )}
            <p className="text-[9px] text-zinc-700 mt-2 tracking-wider uppercase">{subtitle}</p>
        </div>
    );

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

            {/* ===== PATRIMÔNIO TOTAL ===== */}
            <div className="glass-panel rounded-xl p-6 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-3xl" />
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans block mb-2">Patrimônio Total</span>
                        <h2 className="text-4xl font-bold tracking-tight text-white relative z-10">
                            <span className="neon-glow">R$</span>{' '}
                            {patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                        <div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <ArrowUpRight size={14} weight="bold" className="text-emerald-500" />
                                <span className="text-lg font-bold text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Receitas</span>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <ArrowDownLeft size={14} weight="bold" className="text-red-500" />
                                <span className="text-lg font-bold text-red-400">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Despesas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 4 POOLS DE DINHEIRO ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {renderPoolCard(
                    'conta_corrente', 'Conta Corrente', contaCorrente,
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center"><Bank size={16} weight="duotone" className="text-sky-400" /></div>,
                    'text-sky-400', 'bg-sky-500/10 text-sky-400/80 border border-sky-500/20',
                    'Saldo disponível'
                )}
                {renderPoolCard(
                    'cofrinho', 'Cofrinho', cofrinho,
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><PiggyBank size={16} weight="duotone" className="text-amber-400" /></div>,
                    'text-amber-400', 'bg-amber-500/10 text-amber-400/80 border border-amber-500/20',
                    `+R$ ${rendimentoDiario.toFixed(2)}/dia útil`,
                    '100% CDI'
                )}
                {renderPoolCard(
                    'investido_fii', 'Investido', investidoFII,
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><ChartLineUp size={16} weight="duotone" className="text-emerald-400" /></div>,
                    'text-emerald-400', 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20',
                    'Fundos Imobiliários',
                    'FII'
                )}

                {/* FATURA DO CARTÃO */}
                <div className="glass-panel rounded-xl p-5 group relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                <CreditCard size={16} weight="duotone" className="text-purple-400" />
                            </div>
                            <span className="text-zinc-500 uppercase text-[10px] tracking-[0.15em] font-sans">Fatura Cartão</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400/80 border border-purple-500/20 font-mono tracking-wider">CRÉDITO</span>
                            {editingPool !== 'fatura_cartao' && (
                                <button
                                    onClick={() => startEditPool('fatura_cartao', faturaCartao)}
                                    className="p-1.5 rounded-md text-zinc-700 hover:text-purple-400 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <PencilSimple size={12} weight="bold" />
                                </button>
                            )}
                        </div>
                    </div>
                    {editingPool === 'fatura_cartao' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-bold text-lg">R$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editPoolValue}
                                onChange={(e) => setEditPoolValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                                onKeyDown={(e) => { if (e.key === 'Enter') confirmEditPool(); if (e.key === 'Escape') cancelEditPool(); }}
                                autoFocus
                                className="bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xl font-bold text-purple-400 font-mono w-full focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                            />
                            <button onClick={confirmEditPool} className="p-1.5 rounded-md text-purple-400 hover:bg-purple-500/10"><Check size={14} weight="bold" /></button>
                            <button onClick={cancelEditPool} className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-400"><X size={14} weight="bold" /></button>
                        </div>
                    ) : (
                        <h3 className="text-2xl font-bold text-purple-400 font-mono tracking-tight">
                            R$ {faturaCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                            <CalendarBlank size={10} weight="bold" className="text-zinc-600" />
                            <span className="text-[9px] text-zinc-600 tracking-wider">Fecha dia <span className="text-purple-400/70 font-bold">{String(FATURA_FECHAMENTO).padStart(2, '0')}</span></span>
                        </div>
                        <span className="text-zinc-800">·</span>
                        <span className="text-[9px] text-zinc-600 tracking-wider">Vence dia <span className="text-purple-400/70 font-bold">{String(FATURA_VENCIMENTO).padStart(2, '0')}</span></span>
                        <span className="text-zinc-800">·</span>
                        <span className="text-[9px] text-amber-500/70 font-mono">{diasParaFechamento}d p/ fechar</span>
                    </div>
                </div>
            </div>

            {/* ===== CHARTS ===== */}
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

                {/* PROJEÇÃO — Cofrinho CDI + FII */}
                <div className="col-span-1 md:col-span-2 glass-panel rounded-xl p-6 h-80">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendUp size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-sans">Projeção 24 Meses</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[9px] text-amber-400/70"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Cofrinho (CDI)</span>
                            <span className="flex items-center gap-1.5 text-[9px] text-emerald-400/70"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />FII</span>
                        </div>
                    </div>
                    {dataProjecao.length > 0 && (dataProjecao[0].cofrinho > 0 || dataProjecao[0].fii > 0) ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={dataProjecao} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCofrinho" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFII" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="mes" stroke="transparent" tick={{ fill: '#52525b', fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                                <YAxis stroke="transparent" tick={{ fill: '#3f3f46', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: 'rgba(63,63,70,0.3)', borderRadius: '8px', fontSize: '11px' }}
                                    formatter={((value: unknown, name: unknown) => {
                                        const label = name === 'cofrinho' ? 'Cofrinho' : name === 'fii' ? 'FII' : 'Total';
                                        return [`R$ ${Number(value).toLocaleString('pt-BR')}`, label];
                                    }) as never}
                                />
                                <Area type="monotone" dataKey="cofrinho" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCofrinho)" />
                                <Area type="monotone" dataKey="fii" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorFII)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[85%] flex items-center justify-center">
                            <p className="text-zinc-700 text-xs font-sans">Adicione valores ao Cofrinho ou FII para ver a projeção</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== EXTRATO ===== */}
            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Extrato / Histórico</h2>
                    <div className="flex items-center gap-3">
                        {/* Nova Transação button */}
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest border rounded-md transition-colors ${filterCategory
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
                                        {t.type === 'expense' && t.payment_method && (
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded tracking-wider font-mono ${
                                                t.payment_method === 'credito'
                                                    ? 'text-purple-400/70 bg-purple-500/10'
                                                    : 'text-sky-400/70 bg-sky-500/10'
                                            }`}>
                                                {t.payment_method === 'credito' ? 'CRÉDITO' : 'DÉBITO'}
                                            </span>
                                        )}
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
                            className="glass-panel rounded-2xl p-0 w-full max-w-md mx-4 border border-zinc-800/50 overflow-hidden max-h-[90vh] overflow-y-auto"
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

                                {/* Type Toggle — Expense / Income / Pagar Fatura */}
                                <div className="flex rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-1 mb-5">
                                    <button
                                        onClick={() => { setNewType('expense'); setNewCategory(''); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${newType === 'expense'
                                                ? 'bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        <ArrowDownLeft size={12} weight="bold" />
                                        Despesa
                                    </button>
                                    <button
                                        onClick={() => { setNewType('income'); setNewCategory(''); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${newType === 'income'
                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        <ArrowUpRight size={12} weight="bold" />
                                        Receita
                                    </button>
                                    <button
                                        onClick={() => { setNewType('pagar_fatura'); setNewCategory(''); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${newType === 'pagar_fatura'
                                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                                : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        <CreditCard size={12} weight="bold" />
                                        Pagar Fatura
                                    </button>
                                </div>
                            </div>

                            {/* Pagar Fatura View */}
                            {newType === 'pagar_fatura' && (
                                <div className="px-5 pb-5">
                                    <div className="glass-panel rounded-xl p-5 border border-purple-500/20 mb-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                <CreditCard size={20} weight="duotone" className="text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-400 font-sans">Fatura atual do cartão</p>
                                                <p className="text-2xl font-bold text-purple-400 font-mono">
                                                    R$ {faturaCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Source toggle */}
                                        <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-2 font-sans">Pagar com</label>
                                        <div className="flex rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-1 mb-4">
                                            <button
                                                onClick={() => setFaturaSource('conta_corrente')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                    faturaSource === 'conta_corrente'
                                                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
                                                        : 'text-zinc-600 hover:text-zinc-400'
                                                }`}
                                            >
                                                <Bank size={12} weight="bold" />
                                                Conta Corrente
                                            </button>
                                            <button
                                                onClick={() => setFaturaSource('cofrinho')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                    faturaSource === 'cofrinho'
                                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                                        : 'text-zinc-600 hover:text-zinc-400'
                                                }`}
                                            >
                                                <PiggyBank size={12} weight="bold" />
                                                Cofrinho
                                            </button>
                                        </div>

                                        <div className="h-px bg-zinc-800/50 mb-3" />
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-zinc-600">Débito de: <span className={faturaSource === 'conta_corrente' ? 'text-sky-400' : 'text-amber-400'}>{faturaSource === 'conta_corrente' ? 'Conta Corrente' : 'Cofrinho'}</span></span>
                                            <span className="text-zinc-600">Saldo: <span className={`font-mono ${faturaSource === 'conta_corrente' ? 'text-sky-400' : 'text-amber-400'}`}>R$ {(faturaSource === 'conta_corrente' ? contaCorrente : cofrinho).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                                        </div>
                                        {(faturaSource === 'conta_corrente' ? contaCorrente : cofrinho) < faturaCartao && faturaCartao > 0 && (
                                            <p className="text-[10px] text-red-400/70 mt-2">⚠ Saldo insuficiente{faturaSource === 'cofrinho' ? ' no cofrinho' : ' na conta corrente'}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetNewForm}
                                            className="flex-1 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={payFatura}
                                            disabled={faturaCartao <= 0 || (faturaSource === 'conta_corrente' ? contaCorrente : cofrinho) < faturaCartao || isSaving}
                                            className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? 'Pagando...' : 'Pagar Fatura'}
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Modal Body (expense/income only) */}
                            {newType !== 'pagar_fatura' && (
                                <>
                                <div className="px-5 pb-5 space-y-4">
                                    {/* Amount field */}
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
                                                className={`w-full bg-black/40 border rounded-xl pl-12 pr-4 py-4 text-2xl font-bold placeholder-zinc-800 focus:outline-none focus:ring-1 transition-all font-mono tracking-wide ${newType === 'expense'
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

                                    {/* Payment Method (only for expenses) */}
                                    {newType === 'expense' && (
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-2 font-sans">Forma de Pagamento</label>
                                            <div className="flex rounded-xl bg-zinc-900/80 border border-zinc-800/50 p-1">
                                                <button
                                                    onClick={() => setNewPaymentMethod('debito')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        newPaymentMethod === 'debito'
                                                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
                                                            : 'text-zinc-600 hover:text-zinc-400'
                                                    }`}
                                                >
                                                    <Bank size={12} weight="bold" />
                                                    Débito
                                                </button>
                                                <button
                                                    onClick={() => setNewPaymentMethod('credito')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        newPaymentMethod === 'credito'
                                                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                                                            : 'text-zinc-600 hover:text-zinc-400'
                                                    }`}
                                                >
                                                    <CreditCard size={12} weight="bold" />
                                                    Crédito
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all text-center ${isSelected
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
                                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${newType === 'expense'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                            }`}
                                    >
                                        {isSaving ? 'Salvando...' : newType === 'expense' ? 'Registrar Despesa' : 'Registrar Receita'}
                                    </motion.button>
                                </div>
                                </>
                            )}
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
