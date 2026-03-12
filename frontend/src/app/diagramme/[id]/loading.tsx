import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="h-screen w-screen bg-[var(--bg-page)] flex flex-col">
            {/* Header Skeleton */}
            <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between px-6">
                <div className="h-8 w-32 skeleton shimmer-wrapper">
                    <div className="shimmer" />
                </div>
                <div className="flex gap-4">
                    <div className="h-8 w-24 skeleton shimmer-wrapper opacity-50">
                        <div className="shimmer" />
                    </div>
                    <div className="h-8 w-24 skeleton shimmer-wrapper opacity-50">
                        <div className="shimmer" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left pane (Editor) */}
                <div className="w-[45%] h-full border-r border-[var(--border-subtle)] p-8">
                    <div className="w-full h-8 skeleton mb-6 shimmer-wrapper opacity-20">
                        <div className="shimmer" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="h-3 w-full skeleton shimmer-wrapper opacity-10" style={{ width: `${Math.random() * 40 + 60}%` }}>
                                <div className="shimmer" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right pane (Preview) */}
                <div className="w-[55%] h-full bg-[#050505] flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-5 blur-3xl scale-150 animate-pulse"></div>
                        <Loader2 size={32} className="animate-spin text-[var(--accent-primary)] opacity-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
