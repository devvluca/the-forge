import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Target, CaretLeft, CaretRight, TrendUp, Fire, CalendarBlank } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '../lib/supabase';

interface Habit {
    id: string;
    name: string;
    streak: number;
}

interface HabitCompletion {
    id: string;
    habit_id: string;
    completed_date: string; // 'YYYY-MM-DD'
}

type ViewMode = 'week' | 'month';

// Helper: format Date to 'YYYY-MM-DD'
const toDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Helper: format Date to 'DD/MM'
const toDisplayDate = (d: Date) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// +1 EXP floating animation component
const ExpPopup = ({ x, y }: { x: number; y: number }) => (
    <motion.div
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -40, scale: 1.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="fixed pointer-events-none z-[200] font-bold text-xs tracking-widest"
        style={{ left: x, top: y, color: 'var(--accent)', textShadow: '0 0 12px var(--accent)' }}
    >
        +1 EXP
    </motion.div>
);

export const ABigorna = () => {
    const [allHabits, setAllHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [time, setTime] = useState(new Date());
    const [expPopups, setExpPopups] = useState<{ id: number; x: number; y: number }[]>([]);
    let popupId = 0;

    // Clock
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Date calculations
    const today = new Date();
    const currentMonth = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const currentWeekNumber = Math.ceil((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7);
    const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(time).replace('-feira', '');
    const timeString = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(time);

    // Generate real Date objects for past N days
    const dateCols = useMemo(() => {
        const count = viewMode === 'week' ? 7 : 14;
        return Array.from({ length: count }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (count - 1 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // Fetch habits
    useEffect(() => {
        const fetchHabits = async () => {
            const { data } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
            if (data) setAllHabits(data);
        };
        fetchHabits();
    }, []);

    // Fetch completions for the displayed date range
    useEffect(() => {
        if (dateCols.length === 0) return;
        const fetchCompletions = async () => {
            const startDate = toDateKey(dateCols[0]);
            const endDate = toDateKey(dateCols[dateCols.length - 1]);
            const { data } = await supabase
                .from('habit_completions')
                .select('*')
                .gte('completed_date', startDate)
                .lte('completed_date', endDate);
            if (data) setCompletions(data);
        };
        fetchCompletions();
    }, [dateCols]);

    // Check if a habit is done on a specific date
    const isHabitDone = useCallback((habitId: string, date: Date) => {
        const dateKey = toDateKey(date);
        return completions.some(c => c.habit_id === habitId && c.completed_date === dateKey);
    }, [completions]);

    // Toggle habit completion (persists to DB)
    const toggleHabit = async (habitId: string, date: Date, event: React.MouseEvent) => {
        const dateKey = toDateKey(date);
        const existing = completions.find(c => c.habit_id === habitId && c.completed_date === dateKey);

        if (existing) {
            // Remove completion
            await supabase.from('habit_completions').delete().eq('id', existing.id);
            setCompletions(prev => prev.filter(c => c.id !== existing.id));
        } else {
            // Add completion + show +1 EXP
            const { data } = await supabase
                .from('habit_completions')
                .insert({ habit_id: habitId, completed_date: dateKey })
                .select()
                .single();
            if (data) {
                setCompletions(prev => [...prev, data]);
                // Trigger +1 EXP popup at click position
                const rect = (event.target as HTMLElement).getBoundingClientRect();
                const newPopup = { id: ++popupId + Date.now(), x: rect.left + rect.width / 2 - 20, y: rect.top - 10 };
                setExpPopups(prev => [...prev, newPopup]);
                setTimeout(() => {
                    setExpPopups(prev => prev.filter(p => p.id !== newPopup.id));
                }, 700);
            }
        }
    };

    // Today's count
    const todayKey = toDateKey(today);
    const todayDone = completions.filter(c => c.completed_date === todayKey).length;

    // Completion rate across displayed range
    const completionRate = useMemo(() => {
        if (allHabits.length === 0 || dateCols.length === 0) return 0;
        const total = allHabits.length * dateCols.length;
        const done = completions.length;
        return Math.round((done / total) * 100);
    }, [allHabits, dateCols, completions]);

    // Build weekly chart data from real completions
    const weeklyChartData = useMemo(() => {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const last7 = dateCols.slice(-7);
        return last7.map(d => ({
            day: dayNames[d.getDay()],
            completed: completions.filter(c => c.completed_date === toDateKey(d)).length,
            total: allHabits.length,
        }));
    }, [dateCols, completions, allHabits]);

    // Build recent history from real completions
    const historyLog = useMemo(() => {
        // Get last 3 days completions
        const last3Days = dateCols.slice(-3).reverse();
        const entries: { date: string; habit: string; status: boolean; time: string }[] = [];
        for (const d of last3Days) {
            const dateKey = toDateKey(d);
            const dateDisplay = toDisplayDate(d);
            for (const habit of allHabits) {
                const completion = completions.find(c => c.habit_id === habit.id && c.completed_date === dateKey);
                entries.push({
                    date: dateDisplay,
                    habit: habit.name,
                    status: !!completion,
                    time: completion ? new Date(completion.completed_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
                });
            }
        }
        return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateCols, completions, allHabits]);

    // Monthly trend (4 weeks)
    const monthlyData = useMemo(() => {
        if (allHabits.length === 0) return [];
        const weeks = [0, 1, 2, 3].map(wIdx => {
            const start = new Date();
            start.setDate(today.getDate() - (3 - wIdx) * 7);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const daysInWeek: string[] = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                daysInWeek.push(toDateKey(new Date(d)));
            }
            const total = allHabits.length * 7;
            const done = completions.filter(c => daysInWeek.includes(c.completed_date)).length;
            return { week: `S${wIdx + 1}`, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
        });
        return weeks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allHabits, completions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 min-h-full bg-black bg-noise"
        >
            {/* +1 EXP Popups */}
            <AnimatePresence>
                {expPopups.map(popup => (
                    <ExpPopup key={popup.id} x={popup.x} y={popup.y} />
                ))}
            </AnimatePresence>

            <header className="mb-6 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Target size={20} weight="duotone" className="neon-glow" />
                        <h1 className="text-2xl uppercase tracking-[0.2em] text-gradient-red font-bold">A Bigorna</h1>
                    </div>
                    <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Monitoramento Constante · {currentMonth}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white">{dayName.charAt(0).toUpperCase() + dayName.slice(1)}</span>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-none mt-1">{timeString}</p>
                    </div>
                    <div className="h-8 w-px bg-zinc-800" />
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white">{todayDone}<span className="text-[var(--accent)] text-lg">/{allHabits.length}</span></span>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Metas Concluídas</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white">{completionRate}<span className="text-[var(--accent)] text-lg">%</span></span>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Taxa Geral</p>
                    </div>
                </div>
            </header>

            <div className="h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/30 via-zinc-800/50 to-transparent mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="glass-panel rounded-xl p-5 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CalendarBlank size={14} weight="duotone" className="text-[var(--accent)]" />
                            <span className="text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-sans">Performance Semanal</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-600">
                            <CaretLeft size={14} weight="bold" className="cursor-pointer hover:text-white transition-colors" />
                            <span className="text-[10px] tracking-wider">Semana {currentWeekNumber}</span>
                            <CaretRight size={14} weight="bold" className="cursor-pointer hover:text-white transition-colors" />
                        </div>
                    </div>
                    <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData} barCategoryGap="30%">
                                <XAxis dataKey="day" stroke="transparent" tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="transparent" tick={{ fill: '#3f3f46', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, allHabits.length || 5]} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: 'rgba(63,63,70,0.3)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: 'var(--accent)' }} cursor={{ fill: 'rgba(var(--accent-rgb),0.05)' }} />
                                <Bar dataKey="completed" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendUp size={14} weight="duotone" className="text-[var(--accent)]" />
                        <span className="text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-sans">Tendência Mensal</span>
                    </div>
                    <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="week" stroke="transparent" tick={{ fill: '#52525b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="transparent" tick={{ fill: '#3f3f46', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(9,9,11,0.95)', borderColor: 'rgba(63,63,70,0.3)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: 'var(--accent)' }} />
                                <Area type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2} fill="url(#trendGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25' : 'text-zinc-600 border border-zinc-800/50 hover:text-zinc-400'}`}>Semana</button>
                <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25' : 'text-zinc-600 border border-zinc-800/50 hover:text-zinc-400'}`}>Mês</button>
            </div>

            <div className="glass-panel rounded-xl p-6 mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="pb-4 pt-2 px-3 text-left text-zinc-600 font-normal uppercase text-[10px] tracking-[0.15em] font-sans w-48">Disciplina</th>
                                <th className="pb-4 pt-2 px-3 text-left text-zinc-600 font-normal uppercase text-[10px] tracking-[0.15em] font-sans w-16">
                                    <Fire size={12} weight="fill" className="text-[var(--accent)] inline mr-1" />Streak
                                </th>
                                {dateCols.map((d, i) => (
                                    <th key={i} className={`pb-4 pt-2 text-center font-normal text-[10px] font-mono w-10 ${toDateKey(d) === todayKey ? 'text-[var(--accent)]' : 'text-zinc-700'}`}>
                                        {String(d.getDate()).padStart(2, '0')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allHabits.map((habit) => (
                                <tr key={habit.id} className="border-t border-zinc-800/30 group hover:bg-white/[0.01] transition-colors">
                                    <td className="py-4 px-3">
                                        <span className="text-sm text-zinc-400 font-sans tracking-wide group-hover:text-zinc-300 transition-colors">{habit.name}</span>
                                    </td>
                                    <td className="py-4 px-3">
                                        <span className="text-xs font-bold neon-glow">{habit.streak}d</span>
                                    </td>
                                    {dateCols.map((date, dayIdx) => {
                                        const isDone = isHabitDone(habit.id, date);
                                        return (
                                            <td key={dayIdx} className="py-4 text-center relative">
                                                <motion.button
                                                    whileHover={{ scale: 1.25 }}
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={(e) => toggleHabit(habit.id, date, e)}
                                                    className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all duration-200 cursor-pointer ${isDone ? 'bg-[var(--accent)] border-none neon-box-glow' : 'bg-transparent border border-zinc-800 hover:border-zinc-600'}`}
                                                >
                                                    <AnimatePresence>
                                                        {isDone && (
                                                            <motion.div
                                                                initial={{ scale: 0, rotate: -90 }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                exit={{ scale: 0, rotate: 90 }}
                                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                            >
                                                                <Check size={12} weight="bold" className="text-black" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Histórico Recente</h2>
                    <span className="text-[9px] text-zinc-600 tracking-widest uppercase">Últimos 3 Dias</span>
                </div>
                <div className="space-y-2">
                    {historyLog.length === 0 && (
                        <p className="text-zinc-700 text-xs font-sans">Nenhum registro ainda. Marque suas metas acima!</p>
                    )}
                    {historyLog.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-4 py-2 border-b border-zinc-800/20 last:border-none">
                            <span className="text-[10px] text-zinc-600 font-mono w-12 shrink-0">{entry.date}</span>
                            <span className="text-[10px] text-zinc-700 font-mono w-12 shrink-0">{entry.time}</span>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${entry.status ? 'bg-[var(--accent)] neon-box-glow-sm' : 'bg-zinc-800'}`} />
                            <span className={`text-sm font-sans ${entry.status ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>{entry.habit}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-primary flex items-center gap-2">
                    <Plus size={14} weight="bold" />
                    Nova Disciplina
                </motion.button>
            </div>
        </motion.div>
    );
};
