'use client';

import React from 'react';
import { Plus, FileText } from 'lucide-react';

interface DiagrammeItem {
    id: string;
    titre: string;
    type: string;
}

interface DiagramSidebarProps {
    diagrammes: DiagrammeItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreateClick: () => void;
}

const TYPE_ICONS: Record<string, string> = {
    sequence: '↕️',
    flux: '⇶',
    classe: '📦',
    uml: '📐',
    activite: '🔄',
    mermaid: '🧜',
    plantuml: '🌱',
    autre: '📄',
};

const TYPE_EXTENSIONS: Record<string, string> = {
    sequence: '.seq',
    flux: '.flow',
    classe: '.class',
    uml: '.uml',
    activite: '.act',
    mermaid: '.mmd',
    plantuml: '.puml',
    autre: '.txt',
};

export function DiagramSidebar({ diagrammes, selectedId, onSelect, onCreateClick }: DiagramSidebarProps) {
    return (
        <div className="w-64 min-w-[220px] h-full bg-[#0c0c0e] border-r border-[var(--border-subtle)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Diagrammes
                </span>
                <button
                    onClick={onCreateClick}
                    className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-zinc-500 hover:text-white transition-colors"
                    title="Nouveau diagramme"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-1">
                {diagrammes.length === 0 && (
                    <div className="px-4 py-8 text-center">
                        <FileText size={24} className="mx-auto text-zinc-700 mb-2" />
                        <p className="text-xs text-zinc-600">Aucun diagramme</p>
                    </div>
                )}

                {diagrammes.map((diag) => (
                    <button
                        key={diag.id}
                        onClick={() => onSelect(diag.id)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-all ${selectedId === diag.id
                            ? 'bg-[var(--accent-primary)]/10 text-white border-l-2 border-[var(--accent-primary)]'
                            : 'text-zinc-400 hover:bg-[var(--bg-hover)] hover:text-zinc-200 border-l-2 border-transparent'
                            }`}
                    >
                        <span className="text-sm flex-shrink-0">
                            {TYPE_ICONS[diag.type] || '📄'}
                        </span>
                        <span className="truncate">{diag.titre}<span className="text-zinc-600">{TYPE_EXTENSIONS[diag.type] || '.mmd'}</span></span>
                    </button>
                ))}
            </div>
        </div>
    );
}
