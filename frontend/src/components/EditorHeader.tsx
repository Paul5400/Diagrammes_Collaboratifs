import React, { useState } from 'react';
import { Share2, Download, GitBranch, Users, ChevronDown, Layout } from 'lucide-react';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import { DIAGRAM_TEMPLATES, DiagramTemplate } from './DiagramTemplates';

interface EditorHeaderProps {
    title: string;
    className?: string;
    onSelectTemplate: (template: DiagramTemplate) => void;
    user?: any;
}

export function EditorHeader({ title, className = "", onSelectTemplate, user }: EditorHeaderProps) {
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    return (
        <header className={`h-14 border-b border-[var(--border-subtle)] bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-between px-4 z-50 ${className}`}>
            <div className="flex items-center gap-6">
                <Logo />

                <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

                <div className="flex flex-col">
                    <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">{title}</h1>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="flex items-center gap-1 opacity-80">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                            main / current
                        </span>
                    </div>
                </div>

                <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

                <div className="relative">
                    <button
                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[#1a1a1d] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-all text-xs">
                        <Layout size={14} />
                        Templates
                        <ChevronDown size={14} className={`transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTemplatesOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-[#0f0f11] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
                            {DIAGRAM_TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        onSelectTemplate(t);
                                        setIsTemplatesOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors">
                                    <span className="text-lg">{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex -space-x-2 mr-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0f0f11] bg-[var(--accent-primary)] flex items-center justify-center text-[10px] text-white">
                            JD
                        </div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-[#0f0f11] bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                        +1
                    </div>
                </div>

                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_15px_var(--accent-glow)]">
                    <Share2 size={14} />
                    Share
                </button>

                <button className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-all">
                    <Download size={16} />
                </button>

                <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1" />

                <UserMenu
                    name={user?.username || 'User'}
                    plan="GitHub Account"
                    initials={(user?.username || 'U').substring(0, 2).toUpperCase()}
                    avatarUrl={user?.avatarUrl}
                />
            </div>
        </header>
    );
}
