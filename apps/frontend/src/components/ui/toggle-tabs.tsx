"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToggleTabItem {
    label: React.ReactNode;
    value: string;
}

interface ToggleTabsProps {
    items: ToggleTabItem[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    fullWidth?: boolean;
}

export function ToggleTabs({
    items,
    value,
    onChange,
    className,
    fullWidth,
}: ToggleTabsProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({});
    const [activeStyle, setActiveStyle] = useState<React.CSSProperties>({
        left: "0px",
        width: "0px",
    });
    const activeIdx = items.findIndex((item) => item.value === value);

    const updateActiveIndicator = React.useCallback(() => {
        const el = tabRefs.current[activeIdx];
        if (el) setActiveStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }, [activeIdx]);

    useEffect(() => {
        if (hoverIdx !== null) {
            const el = tabRefs.current[hoverIdx];
            if (el)
                setHoverStyle({ left: el.offsetLeft, width: el.offsetWidth });
        }
    }, [hoverIdx]);

    useEffect(() => {
        updateActiveIndicator();
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(() => {
            updateActiveIndicator();
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [updateActiveIndicator]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex items-center bg-muted/80 border border-border/50 rounded-lg p-0.5 shrink-0",
                fullWidth && "w-full",
                className,
            )}
        >
            {/* Hover highlight */}
            <div
                className="absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-foreground/6 transition-all duration-300 ease-out pointer-events-none"
                style={{ ...hoverStyle, opacity: hoverIdx !== null ? 1 : 0 }}
            />
            {/* Active underline */}
            <div
                className="absolute bottom-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ease-out pointer-events-none"
                style={activeStyle}
            />
            {items.map((item, idx) => (
                <button
                    key={item.value}
                    ref={(el) => {
                        tabRefs.current[idx] = el;
                    }}
                    className={cn(
                        "relative z-10 px-2 sm:px-3 py-1 rounded-md text-xs flex items-center justify-center font-medium transition-colors duration-300 gap-1 h-full",
                        fullWidth && "flex-1",
                        value === item.value
                            ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onChange(item.value)}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onMouseLeave={() => setHoverIdx(null)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}
