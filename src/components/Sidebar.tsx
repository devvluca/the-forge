import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Flame,
    Briefcase,
    Hexagon,
    Swords
} from 'lucide-react';
import { GearSix } from '@phosphor-icons/react';

const menuItems = [
    { path: '/a-bigorna', name: 'A Bigorna', icon: Flame },
    { path: '/o-cofre', name: 'O Cofre', icon: Briefcase },
    { path: '/logos', name: 'Logos', icon: Hexagon },
    { path: '/arsenal', name: 'Arsenal', icon: Swords },
];

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.aside
            initial={{ width: 260 }}
            animate={{ width: isCollapsed ? 78 : 260 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-screen sticky top-0 shrink-0 bg-zinc-950/60 backdrop-blur-xl border-r border-zinc-800/40 flex flex-col justify-between py-4 relative overflow-hidden"
        >
            {/* Decorative top-left accent line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--accent)]/40 via-transparent to-transparent" />

            <div className="flex flex-col gap-4">
                {/* Top row: Logo + Collapse button */}
                <div className="px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer"
                            whileHover={{
                                scale: 1.15,
                                rotate: [0, -8, 8, -4, 0],
                                filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
                            }}
                            transition={{
                                scale: { type: 'spring', stiffness: 400, damping: 15 },
                                rotate: { duration: 0.5, ease: 'easeInOut' },
                                filter: { duration: 0.2 },
                            }}
                        >
                            <img src="/src/assets/theforge_logo.png" alt="The Forge Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col"
                                >
                                    <span className="font-bold tracking-[0.2em] uppercase text-white text-sm leading-tight">
                                        The Forge
                                    </span>
                                    <span className="text-[10px] text-zinc-600 tracking-widest uppercase">
                                        v0.1 · sistema
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Collapse button - top right */}
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md bg-zinc-900/80 border border-zinc-800/50 text-zinc-500 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all duration-200"
                    >
                        {isCollapsed ? <ChevronRight size={14} strokeWidth={1.5} /> : <ChevronLeft size={14} strokeWidth={1.5} />}
                    </motion.button>
                </div>

                {/* Separator */}
                <div className="mx-5 h-[1px] bg-zinc-800/50" />

                {/* Navigation */}
                <nav className="flex flex-col gap-1 px-3">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${isActive
                                    ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20'
                                    : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] hover:border-zinc-800/50'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--accent)] rounded-r neon-box-glow-sm" />
                                    )}
                                    <item.icon
                                        size={20}
                                        strokeWidth={1.5}
                                        className={`shrink-0 transition-all duration-200 ${isActive ? 'neon-glow' : 'text-zinc-500 group-hover:text-zinc-300'
                                            }`}
                                    />
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`whitespace-nowrap overflow-hidden text-xs uppercase tracking-[0.15em] font-medium ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                                                    }`}
                                            >
                                                {item.name}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom: Settings */}
            <div className="px-3">
                <NavLink
                    to="/configuracoes"
                    className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${isActive
                            ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20'
                            : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] hover:border-zinc-800/50'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--accent)] rounded-r neon-box-glow-sm" />
                            )}
                            <GearSix
                                size={20}
                                weight="duotone"
                                className={`shrink-0 transition-all duration-200 ${isActive ? 'neon-glow' : 'text-zinc-500 group-hover:text-zinc-300'
                                    }`}
                            />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className={`whitespace-nowrap overflow-hidden text-xs uppercase tracking-[0.15em] font-medium ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                                            }`}
                                    >
                                        Configurações
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </NavLink>
            </div>

            {/* Decorative bottom-left accent line */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--accent)]/20 via-transparent to-transparent" />
        </motion.aside>
    );
};
