import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GearSix, Palette, User, Key, Moon } from '@phosphor-icons/react';

const COLOR_PRESETS = [
    { name: 'Neon Red', h: 0, s: 84, l: 60, rgb: '239, 68, 68' },
    { name: 'Emerald', h: 160, s: 84, l: 45, rgb: '16, 185, 129' },
    { name: 'Electric Blue', h: 217, s: 91, l: 60, rgb: '59, 130, 246' },
    { name: 'Amber', h: 38, s: 92, l: 50, rgb: '245, 158, 11' },
    { name: 'Violet', h: 271, s: 81, l: 56, rgb: '139, 92, 246' },
    { name: 'Cyan', h: 187, s: 85, l: 53, rgb: '6, 182, 212' },
    { name: 'Rose', h: 330, s: 81, l: 60, rgb: '244, 63, 94' },
    { name: 'Lime', h: 84, s: 81, l: 44, rgb: '132, 204, 22' },
];

const STORAGE_KEY = 'forge_accent_color';

function applyColor(preset: typeof COLOR_PRESETS[0]) {
    const root = document.documentElement;
    root.style.setProperty('--accent-h', String(preset.h));
    root.style.setProperty('--accent-s', `${preset.s}%`);
    root.style.setProperty('--accent-l', `${preset.l}%`);
    root.style.setProperty('--accent-rgb', preset.rgb);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
}

export function loadSavedColor() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) applyColor(JSON.parse(saved));
    } catch { /* use defaults */ }
}

export const Configuracoes = () => {
    const [activeColor, setActiveColor] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved).name : 'Neon Red';
        } catch { return 'Neon Red'; }
    });
    const [userName, setUserName] = useState(() => localStorage.getItem('forge_user_name') || 'Luca');
    const [pin, setPin] = useState('1504');

    useEffect(() => { loadSavedColor(); }, []);

    const handleColorSelect = (preset: typeof COLOR_PRESETS[0]) => {
        setActiveColor(preset.name);
        applyColor(preset);
    };

    const handleSaveName = () => {
        localStorage.setItem('forge_user_name', userName);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 bg-black bg-noise min-h-full">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <GearSix size={20} weight="duotone" className="neon-glow" />
                    <h1 className="text-2xl uppercase tracking-[0.2em] text-gradient-red font-bold">Configurações</h1>
                </div>
                <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Personalização do Sistema</p>
            </header>
            <div className="h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/30 via-zinc-800/50 to-transparent mb-8" />

            <div className="space-y-8 max-w-3xl">
                {/* Color Palette */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <Palette size={16} weight="duotone" className="neon-glow-subtle" />
                        <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Paleta de Cores</h2>
                    </div>
                    <p className="text-zinc-500 text-xs font-sans mb-5">Escolha a cor de destaque do sistema. A mudança é instantânea e persiste entre sessões.</p>
                    <div className="grid grid-cols-4 gap-3">
                        {COLOR_PRESETS.map((preset) => {
                            const isActive = activeColor === preset.name;
                            const color = `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`;
                            return (
                                <motion.button
                                    key={preset.name}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleColorSelect(preset)}
                                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${isActive ? 'border-white/30 bg-white/[0.03]' : 'border-zinc-800/50 hover:border-zinc-700'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: isActive ? `0 0 15px ${color}` : 'none' }} />
                                        <span className={`text-[10px] uppercase tracking-widest font-bold ${isActive ? 'text-white' : 'text-zinc-500'}`}>{preset.name}</span>
                                    </div>
                                    {isActive && <span className="text-[8px] text-zinc-600 tracking-widest uppercase">Ativo</span>}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Profile */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <User size={16} weight="duotone" className="neon-glow-subtle" />
                        <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Perfil</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-2">Nome</label>
                            <div className="flex gap-3">
                                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="flex-1 bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-[var(--accent)]/30 transition-all" />
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveName} className="forge-btn-primary text-[10px] py-2 px-4">Salvar</motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <Key size={16} weight="duotone" className="neon-glow-subtle" />
                        <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Segurança</h2>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-2">PIN do Cofre</label>
                        <div className="flex gap-3">
                            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} className="w-32 bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-sm text-white font-mono text-center tracking-[0.5em] focus:outline-none focus:border-[var(--accent)]/30 transition-all" />
                            <span className="text-zinc-600 text-xs font-sans self-center">4 dígitos</span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <Moon size={16} weight="duotone" className="neon-glow-subtle" />
                        <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Aparência</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-300 font-sans">Modo Escuro</p>
                            <p className="text-[10px] text-zinc-600 font-sans">O único modo que existe.</p>
                        </div>
                        <div className="w-10 h-5 bg-[var(--accent)] rounded-full relative cursor-not-allowed">
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-black rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
