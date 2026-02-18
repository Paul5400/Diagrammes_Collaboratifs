'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Settings, Edit3 } from 'lucide-react';

interface ProjectMenuProps {
    onDeleteClick: () => void;
}

export function ProjectMenu({ onDeleteClick }: ProjectMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
                title="Options du projet"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1d] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            // Future: Renommer
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-400 hover:bg-[var(--bg-hover)] hover:text-white transition-colors opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <Edit3 size={16} />
                        <span>Renommer le projet</span>
                    </button>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            // Future: Paramètres
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-400 hover:bg-[var(--bg-hover)] hover:text-white transition-colors opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <Settings size={16} />
                        <span>Paramètres</span>
                    </button>

                    <div className="my-1 h-[1px] bg-[var(--border-subtle)]" />

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onDeleteClick();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={16} />
                        <span>Supprimer le projet</span>
                    </button>
                </div>
            )}
        </div>
    );
}
