import { useState, useEffect } from 'react';

// Check if we're running inside Tauri v2
const isTauri = () => '__TAURI_INTERNALS__' in window;

export const TitleBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!isTauri()) return;

        const checkMaximized = async () => {
            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const win = getCurrentWindow();
                setIsMaximized(await win.isMaximized());
            } catch {
                // not in Tauri context
            }
        };

        checkMaximized();

        let unlisten: (() => void) | undefined;
        (async () => {
            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const win = getCurrentWindow();
                unlisten = await win.onResized(async () => {
                    setIsMaximized(await win.isMaximized());
                });
            } catch {
                // not in Tauri context
            }
        })();

        return () => {
            unlisten?.();
        };
    }, []);

    const handleMinimize = async () => {
        if (!isTauri()) return;
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        getCurrentWindow().minimize();
    };

    const handleMaximize = async () => {
        if (!isTauri()) return;
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        getCurrentWindow().toggleMaximize();
    };

    const handleClose = async () => {
        if (!isTauri()) return;
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        getCurrentWindow().close();
    };

    // Don't render title bar in browser mode
    if (!isTauri()) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-10 z-[9999] flex items-center justify-end select-none pointer-events-none"
        >
            {/* Drag region that doesn't overlap sidebar (left 260px) or Jarvis/buttons on the right */}
            <div 
                data-tauri-drag-region
                className="absolute inset-0 left-[260px] right-[120px] pointer-events-auto"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            />

            {/* macOS-style traffic light buttons (on the right side) */}
            <div
                className="flex items-center gap-2 pr-6 relative z-10 pointer-events-auto"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Minimize - Yellow */}
                <button
                    onClick={handleMinimize}
                    className="group w-[13px] h-[13px] rounded-full bg-[#febc2e] flex items-center justify-center transition-all duration-100 hover:brightness-90 active:brightness-75"
                    title="Minimizar"
                >
                    {isHovered && (
                        <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <path d="M1.5 4H6.5" stroke="#9a6a00" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    )}
                </button>

                {/* Maximize/Restore - Green */}
                <button
                    onClick={handleMaximize}
                    className="group w-[13px] h-[13px] rounded-full bg-[#28c840] flex items-center justify-center transition-all duration-100 hover:brightness-90 active:brightness-75"
                    title={isMaximized ? 'Restaurar' : 'Maximizar'}
                >
                    {isHovered && (
                        <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {isMaximized ? (
                                // Restore icon
                                <>
                                    <path d="M5.5 1L5.5 3L7 3" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2.5 7L2.5 5L1 5" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                            ) : (
                                // Maximize icon
                                <>
                                    <path d="M1.5 5.5L1.5 6.5L2.5 6.5" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6.5 2.5L6.5 1.5L5.5 1.5" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M1.5 6.5L3.5 4.5" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" />
                                    <path d="M6.5 1.5L4.5 3.5" stroke="#006500" strokeWidth="1.1" strokeLinecap="round" />
                                </>
                            )}
                        </svg>
                    )}
                </button>

                {/* Close - Red */}
                <button
                    onClick={handleClose}
                    className="group w-[13px] h-[13px] rounded-full bg-[#ff5f57] flex items-center justify-center transition-all duration-100 hover:brightness-90 active:brightness-75"
                    title="Fechar"
                >
                    {isHovered && (
                        <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#4a0000" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};
