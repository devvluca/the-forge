import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, X, Backspace } from '@phosphor-icons/react';

const CORRECT_PIN = '1504';
const SESSION_KEY = 'forge_cofre_unlocked';

interface PinPadProps {
    onUnlock: () => void;
    onClose: () => void;
}

export const PinPad = ({ onUnlock, onClose }: PinPadProps) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [pressedKey, setPressedKey] = useState<string | null>(null);

    const handlePress = useCallback((digit: string) => {
        if (pin.length >= 4) return;
        setPressedKey(digit);
        setTimeout(() => setPressedKey(null), 150);

        const newPin = pin + digit;
        setPin(newPin);

        if (newPin.length === 4) {
            setTimeout(() => {
                if (newPin === CORRECT_PIN) {
                    sessionStorage.setItem(SESSION_KEY, 'true');
                    onUnlock();
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 600);
                }
            }, 200);
        }
    }, [pin, onUnlock]);

    const handleDelete = useCallback(() => {
        setPin((prev) => prev.slice(0, -1));
        setPressedKey('del');
        setTimeout(() => setPressedKey(null), 150);
    }, []);

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handlePress(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handlePress, handleDelete, onClose]);

    const numPadKeys = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'del'],
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center"
        >
            {/* Close button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-white transition-colors z-50"
            >
                <X size={22} weight="bold" />
            </motion.button>

            <div className="flex flex-col items-center">
                {/* Lock icon */}
                <motion.div
                    animate={error ? { x: [-16, 16, -12, 12, -6, 6, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-8"
                >
                    <Lock size={32} weight="duotone" className="neon-glow" />
                </motion.div>

                <h2 className="text-white text-lg tracking-[0.3em] uppercase font-bold mb-2">O Cofre</h2>
                <p className="text-zinc-600 text-xs tracking-wider mb-10">Digite o código de acesso</p>

                {/* Pin dots */}
                <motion.div
                    animate={error ? { x: [-16, 16, -12, 12, -6, 6, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex gap-5 mb-12"
                >
                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: pin.length === i + 1 ? [1, 1.3, 1] : 1,
                                backgroundColor: error
                                    ? 'var(--accent)'
                                    : pin.length > i
                                        ? 'var(--accent)'
                                        : 'transparent',
                                boxShadow: pin.length > i && !error
                                    ? '0 0 15px rgba(var(--accent-rgb), 0.6)'
                                    : '0 0 0px transparent',
                            }}
                            transition={{ duration: 0.2 }}
                            className={`w-4 h-4 rounded-full border-2 ${error ? 'border-[var(--accent)]' : pin.length > i ? 'border-[var(--accent)]' : 'border-zinc-700'
                                }`}
                        />
                    ))}
                </motion.div>

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-4">
                    {numPadKeys.flat().map((key, idx) => {
                        if (key === '') return <div key={idx} />;
                        if (key === 'del') {
                            return (
                                <motion.button
                                    key={idx}
                                    whileTap={{ scale: 0.88 }}
                                    animate={pressedKey === 'del' ? { backgroundColor: 'rgba(var(--accent-rgb),0.15)' } : { backgroundColor: 'rgba(39,39,42,0.5)' }}
                                    onClick={handleDelete}
                                    className="w-20 h-20 rounded-2xl border border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
                                >
                                    <Backspace size={22} weight="duotone" />
                                </motion.button>
                            );
                        }
                        return (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.88 }}
                                animate={
                                    pressedKey === key
                                        ? { backgroundColor: 'rgba(var(--accent-rgb),0.2)', borderColor: 'rgba(var(--accent-rgb),0.4)' }
                                        : { backgroundColor: 'rgba(39,39,42,0.5)', borderColor: 'rgba(63,63,70,0.3)' }
                                }
                                transition={{ duration: 0.15 }}
                                onClick={() => handlePress(key)}
                                className="w-20 h-20 rounded-2xl border flex items-center justify-center text-white text-2xl font-light hover:border-zinc-600 transition-colors select-none"
                            >
                                {key}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export const isCofreUnlocked = (): boolean => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
};
