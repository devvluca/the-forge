import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, ArrowCounterClockwise, X } from '@phosphor-icons/react';

export const WidgetTimer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState(25 * 60); // 25 minutes default Pomodoro
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'pomodoro') setTime(25 * 60);
        else if (mode === 'shortBreak') setTime(5 * 60);
        else setTime(15 * 60);
    };

    const changeMode = (newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'pomodoro') setTime(25 * 60);
        else if (newMode === 'shortBreak') setTime(5 * 60);
        else setTime(15 * 60);
    };

    useEffect(() => {
        if (isActive && time > 0) {
            intervalRef.current = setInterval(() => setTime((t) => t - 1), 1000);
        } else if (time === 0) {
            setIsActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Optional: Play a sound here
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
        <div className="fixed bottom-10 left-10 z-[100] flex flex-col items-start gap-4 pointer-events-none">
            {/* Widget Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-5 shadow-2xl w-64 pointer-events-auto"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-zinc-400 text-xs font-bold tracking-widest uppercase">Timer de Foco</span>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={14} weight="bold" />
                            </button>
                        </div>

                        {/* Modes */}
                        <div className="flex bg-zinc-900/50 p-1 rounded-lg mb-4 gap-1">
                            <button onClick={() => changeMode('pomodoro')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === 'pomodoro' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>Foco</button>
                            <button onClick={() => changeMode('shortBreak')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${mode === 'shortBreak' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>Pausa</button>
                        </div>

                        {/* Clock */}
                        <div className="text-center mb-6">
                            <span className="text-5xl font-mono font-light tracking-tighter text-white neon-glow">{formatTime(time)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={resetTimer} className="p-2 rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all">
                                <ArrowCounterClockwise size={18} weight="bold" />
                            </button>
                            <button onClick={toggleTimer} className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg ${isActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-[var(--accent)] text-black hover:brightness-110 shadow-[var(--accent)]/20'}`}>
                                {isActive ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-1" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-lg pointer-events-auto ${isOpen ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20'}`}
                title="Timer de Foco"
            >
                <Timer size={24} weight={isOpen ? "fill" : "duotone"} className={!isOpen ? "neon-glow" : ""} />
            </motion.button>
        </div>
    );
};
