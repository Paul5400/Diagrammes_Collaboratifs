'use client';

import React, { useEffect } from 'react';
import { X, AlertCircle, XCircle } from 'lucide-react';

interface ErrorNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

export function ErrorNotification({
    isOpen,
    onClose,
    title,
    message,
    autoClose = false,
    autoCloseDelay = 5000,
}: ErrorNotificationProps) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-md w-full bg-[#1a1a1d] border border-red-500/30 rounded-xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
                {/* Header */}
                <div className="flex items-start gap-3 px-5 py-4 border-b border-red-500/20">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="text-red-500" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-[#0f0f11] rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
}
