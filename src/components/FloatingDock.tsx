import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, ArrowCounterClockwise, X, Robot } from '@phosphor-icons/react';

interface FloatingDockProps {
    onJarvisClick: () => void;
}

export const FloatingDock = ({ onJarvisClick }: FloatingDockProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [timerOpen, setTimerOpen] = useState(false);
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'pomodoro' | 'shortBreak'>('pomodoro');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'pomodoro') setTime(25 * 60);
        else setTime(5 * 60);
    };

    const changeMode = (newMode: 'pomodoro' | 'shortBreak') => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'pomodoro') setTime(25 * 60);
        else setTime(5 * 60);
    };

    useEffect(() => {
        if (isActive && time > 0) {
            intervalRef.current = setInterval(() => setTime((t) => t - 1), 1000);
        } else if (time === 0) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, time]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
            {/* Timer Popover */}
            <AnimatePresence>
                {timerOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 shadow-2xl w-64"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-zinc-400 text-xs font-bold tracking-widest uppercase">Timer de Foco</span>
                            <button onClick={() => setTimerOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={14} weight="bold" />
                            </button>
                        </div>

                        <div className="flex bg-zinc-900/50 p-1 rounded-lg mb-4 gap-1">
                            <button onClick={() => changeMode('pomodoro')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === 'pomodoro' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>Foco</button>
                            <button onClick={() => changeMode('shortBreak')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === 'shortBreak' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>Pausa</button>
                        </div>

                        <div className="text-center mb-6">
                            <span className="text-5xl font-mono font-light tracking-tighter text-white neon-glow">{formatTime(time)}</span>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <button onClick={resetTimer} className="p-2 rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all">
                                <ArrowCounterClockwise size={18} weight="bold" />
                            </button>
                            <button onClick={toggleTimer} className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg ${isActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-[var(--accent)] text-black hover:brightness-110 shadow-[var(--accent)]/20'}`}>
                                {isActive ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-0.5" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dock Cylinder Container */}
            <motion.div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={{
                    backgroundColor: isHovered ? 'rgba(39, 39, 42, 0.5)' : 'rgba(39, 39, 42, 0.15)',
                    borderColor: isHovered ? 'rgba(63, 63, 70, 0.4)' : 'rgba(63, 63, 70, 0.1)',
                }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-2 px-2 py-2 rounded-3xl border backdrop-blur-xl"
            >
                {/* Timer Button */}
                <motion.button
                    animate={{
                        scale: isHovered ? 1 : 0.85,
                        opacity: isHovered ? 1 : 0.5,
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setTimerOpen(!timerOpen)}
                    className={`p-3 rounded-xl flex items-center justify-center transition-colors ${timerOpen ? 'bg-zinc-800 text-white' : 'bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'}`}
                    title="Timer de Foco"
                >
                    <Timer size={20} weight={timerOpen ? "fill" : "duotone"} className={!timerOpen ? "neon-glow" : ""} />
                </motion.button>

                {/* Divider */}
                <motion.div
                    animate={{ opacity: isHovered ? 0.4 : 0.1, width: isHovered ? 24 : 16 }}
                    transition={{ duration: 0.25 }}
                    className="h-px bg-zinc-500"
                />

                {/* Jarvis Button */}
                <motion.button
                    animate={{
                        scale: isHovered ? 1 : 0.85,
                        opacity: isHovered ? 1 : 0.5,
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.25 }}
                    onClick={onJarvisClick}
                    className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center hover:bg-[var(--accent)]/20 transition-colors"
                    title="Abrir Jarvis"
                >
                    <Robot size={20} weight="duotone" className="neon-glow" />
                </motion.button>
            </motion.div>
        </div>
    );
};
