import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PaperPlaneTilt, Robot, User, SpinnerGap } from '@phosphor-icons/react';
import { streamChat, type ChatMessage } from '../api/logos';

interface JarvisProps {
    isOpen: boolean;
    onClose: () => void;
    currentPage: string;
}

export const JarvisSidebar = ({ isOpen, onClose, currentPage }: JarvisProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        const userMsg: ChatMessage = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsStreaming(true);
        setStreamingText('');

        let fullResponse = '';

        await streamChat(
            updatedMessages,
            currentPage,
            (chunk) => {
                fullResponse += chunk;
                setStreamingText(fullResponse);
            },
            () => {
                setMessages((prev) => [...prev, { role: 'assistant', content: fullResponse }]);
                setStreamingText('');
                setIsStreaming(false);
            },
        );
    };

    const pageName = currentPage.replace('/', '').replace(/-/g, ' ') || 'Home';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar panel */}
                    <motion.div
                        initial={{ x: 420, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 420, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-[400px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/50 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                                    <Robot size={16} weight="duotone" className="neon-glow-subtle" />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-bold tracking-wider uppercase">Jarvis</h3>
                                    <span className="text-[9px] text-zinc-600 tracking-widest uppercase">
                                        contexto: {pageName}
                                    </span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} weight="bold" />
                            </motion.button>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.length === 0 && !isStreaming && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center">
                                        <Robot size={24} weight="duotone" className="text-[var(--accent)]/50" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-sm font-sans mb-1">Jarvis está pronto.</p>
                                        <p className="text-zinc-700 text-xs font-sans">
                                            Faça uma pergunta sobre IA, investimentos, carreira ou peça uma reflexão bíblica.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-md bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Robot size={12} weight="fill" className="text-[var(--accent)]" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm font-sans leading-relaxed ${msg.role === 'user'
                                            ? 'bg-[var(--accent)]/15 text-zinc-200 rounded-br-sm'
                                            : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800/40 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                                            <User size={12} weight="fill" className="text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isStreaming && streamingText && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-6 h-6 rounded-md bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Robot size={12} weight="fill" className="text-[var(--accent)]" />
                                    </div>
                                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-zinc-900/80 text-zinc-300 border border-zinc-800/40 text-sm font-sans leading-relaxed">
                                        {streamingText}
                                        <span className="inline-block w-1.5 h-4 bg-[var(--accent)] ml-0.5 animate-pulse" />
                                    </div>
                                </div>
                            )}

                            {isStreaming && !streamingText && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-6 h-6 rounded-md bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Robot size={12} weight="fill" className="text-[var(--accent)]" />
                                    </div>
                                    <div className="px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-zinc-900/80 border border-zinc-800/40">
                                        <SpinnerGap size={14} weight="bold" className="text-[var(--accent)] animate-spin" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="px-4 py-3 border-t border-zinc-800/50 shrink-0">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Pergunte ao Jarvis..."
                                    disabled={isStreaming}
                                    className="flex-1 bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 font-sans focus:outline-none focus:border-[var(--accent)]/30 focus:ring-1 focus:ring-[var(--accent)]/10 transition-all disabled:opacity-50"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={isStreaming || !input.trim()}
                                    className="p-2.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <PaperPlaneTilt size={16} weight="fill" />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
