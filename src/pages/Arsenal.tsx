import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Books, GraduationCap, Plus, Clock, ChartBar } from '@phosphor-icons/react';

interface Course {
    id: string;
    title: string;
    progress: number;
    lessons: string;
    category: string;
    last_access: string;
}

export const Arsenal = () => {
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await supabase.from('arsenal_courses').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setCourses(data);
            }
        };
        fetchCourses();
    }, []);

    const totalProgress = courses.length > 0 ? Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length) : 0;
    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 bg-black bg-noise min-h-full">
            <header className="mb-6 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Books size={20} weight="duotone" className="neon-glow" />
                        <h1 className="text-2xl uppercase tracking-[0.2em] text-gradient-red font-bold">Arsenal</h1>
                    </div>
                    <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Base de Treinamento Técnico</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white">{courses.length}</span>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Cursos</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-white">{totalProgress}<span className="text-[var(--accent)] text-lg">%</span></span>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Média Geral</p>
                    </div>
                </div>
            </header>
            <div className="h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/30 via-zinc-800/50 to-transparent mb-6" />
            <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                        <ChartBar size={18} weight="duotone" className="neon-glow-subtle" />
                    </div>
                    <div><span className="text-xl font-bold text-white">{courses.filter(c => c.progress >= 70).length}</span><p className="text-[10px] text-zinc-600 uppercase tracking-widest">Quase Concluídos</p></div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center">
                        <Clock size={18} weight="duotone" className="text-zinc-500" />
                    </div>
                    <div><span className="text-xl font-bold text-white">~48h</span><p className="text-[10px] text-zinc-600 uppercase tracking-widest">Tempo Total</p></div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <GraduationCap size={18} weight="duotone" className="text-emerald-400" />
                    </div>
                    <div><span className="text-xl font-bold text-white">{courses.filter(c => c.progress >= 90).length}</span><p className="text-[10px] text-zinc-600 uppercase tracking-widest">Finalizados</p></div>
                </div>
            </div>
            <div className="space-y-4">
                {courses.map((course, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08, duration: 0.3 }} className="glass-panel-hover rounded-xl p-6 group">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] text-[var(--accent)]/80 bg-[var(--accent)]/10 px-1.5 py-0.5 rounded tracking-wider font-bold uppercase">{course.category}</span>
                                    <span className="text-[9px] text-zinc-700 tracking-wider">· {course.last_access}</span>
                                </div>
                                <h3 className="text-zinc-200 font-sans font-semibold text-base tracking-wide group-hover:text-white transition-colors">{course.title}</h3>
                                <span className="text-[10px] text-zinc-600 tracking-widest font-mono mt-0.5 block">{course.lessons} aulas concluídas</span>
                            </div>
                            <span className="text-lg font-bold neon-glow ml-4">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-4">
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }} style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 10px rgba(var(--accent-rgb), 0.4)' }} />
                        </div>
                        <div className="flex gap-3">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-primary text-[10px] py-2 px-4">Continuar Treinamento</motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-ghost text-[10px] py-2 px-4">Ver Detalhes</motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-ghost flex items-center gap-2">
                    <Plus size={14} weight="bold" />Adicionar Curso
                </motion.button>
            </div>
        </motion.div>
    );
};
