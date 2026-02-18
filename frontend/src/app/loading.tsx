import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-20 blur-2xl rounded-full scale-150 animate-pulse"></div>

                {/* Spinner */}
                <div className="relative flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-[var(--accent-primary)] opacity-80" />
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium tracking-[0.2em] uppercase opacity-50">Chargement</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
