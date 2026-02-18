import React from 'react';

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
            <header className="w-full border-b border-[var(--border-subtle)]">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between p-6">
                    <div className="h-8 w-32 skeleton shimmer-wrapper">
                        <div className="shimmer" />
                    </div>
                    <div className="h-10 w-10 rounded-full skeleton shimmer-wrapper">
                        <div className="shimmer" />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1200px] mx-auto w-full p-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="h-4 w-24 skeleton mb-2 shimmer-wrapper">
                            <div className="shimmer" />
                        </div>
                        <div className="h-10 w-48 skeleton shimmer-wrapper">
                            <div className="shimmer" />
                        </div>
                    </div>
                    <div className="h-10 w-40 skeleton shimmer-wrapper">
                        <div className="shimmer" />
                    </div>
                </div>

                {/* 9 cards to fill the grid properly, matching ProjectCard style */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="bg-[var(--bg-panel)] border border-white/10 rounded-lg overflow-hidden flex flex-col">
                            {/* Preview Area Skeleton (matched to ProjectCard h-40 + background) */}
                            <div
                                className="h-40 bg-[#111] flex items-center justify-center relative shimmer-wrapper"
                                style={{
                                    backgroundImage: 'radial-gradient(#27272a 1px, transparent 0)',
                                    backgroundSize: '20px 20px',
                                }}
                            >
                                <div className="shimmer" />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-md bg-zinc-800/50" />
                                    <div className="w-16 h-3 rounded-md bg-zinc-800/30" />
                                </div>
                            </div>

                            {/* Info Area (matched to ProjectCard p-4) */}
                            <div className="p-4 space-y-3">
                                <div className="h-4 w-3/4 skeleton shimmer-wrapper">
                                    <div className="shimmer" />
                                </div>
                                <div className="h-3 w-1/2 skeleton shimmer-wrapper opacity-50">
                                    <div className="shimmer" />
                                </div>
                                <div className="h-2 w-1/3 skeleton shimmer-wrapper opacity-30">
                                    <div className="shimmer" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
