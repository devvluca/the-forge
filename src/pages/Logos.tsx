import { motion } from 'framer-motion';
import { Brain, Crosshair, BookOpen, Lightning, ArrowSquareOut } from '@phosphor-icons/react';

const newsItems = [
    { time: '2h atrás', tag: 'NLP', title: 'OpenAI lança modelo reasoning Q* com benchmark MATH em 94.2%.' },
    { time: '5h atrás', tag: 'AGENTS', title: 'Self-Rewarding LLMs: agentes conseguem otimizar seu próprio código iterativamente.' },
    { time: '8h atrás', tag: 'MARKET', title: 'Mercado de IA na América Latina projeta crescimento de 120% até Q4 2026.' },
    { time: '12h atrás', tag: 'MODELS', title: 'Meta libera Llama 4 com 400B parâmetros e MoE architecture.' },
];

export const Logos = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-black bg-noise min-h-full"
        >
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Brain size={20} weight="duotone" className="neon-glow" />
                    <h1 className="text-2xl uppercase tracking-[0.2em] text-gradient-red font-bold">Logos</h1>
                </div>
                <p className="text-zinc-600 text-xs tracking-wider uppercase font-sans">Inteligência & Sabedoria Diária</p>
            </header>

            <div className="h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/30 via-zinc-800/50 to-transparent mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-min">
                <div className="glass-panel-hover rounded-xl p-6 col-span-1 md:col-span-2 row-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <Crosshair size={16} weight="duotone" className="neon-glow-subtle" />
                            <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Radar da Área</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-glow" />
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Live Feed</span>
                        </div>
                    </div>
                    <ul className="space-y-3">
                        {newsItems.map((news, idx) => (
                            <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.3 }}
                                className="group border-l-2 border-zinc-800/60 hover:border-[var(--accent)]/60 pl-4 py-3 transition-all duration-300 cursor-pointer flex items-start gap-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[9px] text-zinc-600 tracking-widest font-mono">{news.time}</span>
                                        <span className="text-[9px] text-[var(--accent)]/80 bg-[var(--accent)]/10 px-1.5 py-0.5 rounded tracking-wider font-bold">{news.tag}</span>
                                    </div>
                                    <span className="text-zinc-400 text-sm font-sans leading-relaxed group-hover:text-zinc-200 transition-colors">{news.title}</span>
                                </div>
                                <ArrowSquareOut size={12} weight="duotone" className="text-zinc-700 group-hover:text-[var(--accent)] transition-colors mt-1 shrink-0" />
                            </motion.li>
                        ))}
                    </ul>
                </div>

                <div className="glass-panel rounded-xl p-6 col-span-1 flex flex-col justify-between border-[var(--accent)]/10 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-5">
                            <BookOpen size={16} weight="duotone" className="neon-glow-subtle" />
                            <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">A Palavra</h2>
                        </div>
                        <div className="mb-5">
                            <p className="text-zinc-300 text-sm font-sans italic leading-relaxed mb-3">
                                "O temor do Senhor é o princípio do conhecimento; os loucos desprezam a sabedoria e a instrução."
                            </p>
                            <span className="text-[var(--accent)] font-bold text-[11px] tracking-wider neon-glow">— Provérbios 1:7</span>
                        </div>
                        <div className="border-t border-zinc-800/30 pt-4">
                            <p className="text-zinc-500 text-xs font-sans leading-relaxed">
                                <span className="text-[var(--accent)]/70 font-bold">[Logos]:</span> A sabedoria precede o poder técnico. Sua capacidade (Radar) deve ser ancorada em princípios inegociáveis para gerar impacto eterno, não efêmero.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end relative z-10">
                        <span className="text-[9px] text-zinc-700 tracking-widest uppercase font-mono">Reflexão V.01</span>
                    </div>
                </div>

                <div className="glass-panel-hover rounded-xl p-6 col-span-1 md:col-span-3">
                    <div className="flex items-center gap-2.5 mb-6">
                        <Lightning size={16} weight="duotone" className="neon-glow-subtle" />
                        <h2 className="text-[var(--accent)] uppercase tracking-[0.15em] font-bold text-xs">Conselheiro Tático</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-zinc-950/70 border border-zinc-800/40 rounded-lg p-5">
                            <span className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] block mb-2.5 font-sans">Investimentos</span>
                            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                                Reserva de oportunidade atinge 45%. Recomendação: rebalanceamento focando em FIIs de tijolo e renda fixa IPCA+6%.
                            </p>
                            <div className="mt-5 flex">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-ghost">Executar Ordem</motion.button>
                            </div>
                        </div>
                        <div className="bg-zinc-950/70 border border-zinc-800/40 rounded-lg p-5">
                            <span className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] block mb-2.5 font-sans">Destravamento Profissional</span>
                            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                                Sprint de transição arquitetural está 80% completo. Foco: delegar revisões do módulo de pagamentos e priorizar documentação técnica.
                            </p>
                            <div className="mt-5 flex">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="forge-btn-ghost">Confirmar</motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
