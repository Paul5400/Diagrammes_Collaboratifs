'use client';

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { DIAGRAM_TEMPLATES } from './DiagramTemplates';
import Cookies from 'js-cookie';

interface CreateDiagramDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projetId: string;
    onCreated: (diagramme: any) => void;
}

export function CreateDiagramDialog({ isOpen, onClose, projetId, onCreated }: CreateDiagramDialogProps) {
    const [diagramName, setDiagramName] = useState('');
    const [selectedType, setSelectedType] = useState(DIAGRAM_TEMPLATES[0].id);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedTemplate = DIAGRAM_TEMPLATES.find(t => t.id === selectedType) || DIAGRAM_TEMPLATES[0];

    if (!isOpen) return null;

    // Mapping des template ids vers les TypeDiagramme du backend
    const typeMapping: Record<string, string> = {
        sequence: 'sequence',
        flowchart: 'flux',
        class: 'classe',
        state: 'mermaid',
        er: 'mermaid',
        gantt: 'mermaid',
        mindmap: 'mermaid',
    };

    const handleCreate = async () => {
        if (!diagramName.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const token = Cookies.get('diagrammer_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets/${projetId}/diagrammes`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        titre: diagramName.trim(),
                        type: typeMapping[selectedType] || 'mermaid',
                        contenu: selectedTemplate.code,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                const msg = Array.isArray(data.message)
                    ? data.message.join(', ')
                    : (typeof data.message === 'string' ? data.message : 'Erreur lors de la création du diagramme');
                throw new Error(msg);
            }

            const diagramme = await response.json();
            setDiagramName('');
            setSelectedType(DIAGRAM_TEMPLATES[0].id);
            onCreated(diagramme);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0f0f11] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-white">Créer un nouveau diagramme</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Nom du diagramme
                        </label>
                        <input
                            type="text"
                            value={diagramName}
                            onChange={(e) => setDiagramName(e.target.value)}
                            placeholder="Mon Diagramme de Séquence"
                            className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Type de diagramme
                        </label>
                        <button
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white hover:border-[var(--text-secondary)] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{selectedTemplate.icon}</span>
                                <span className="text-sm">{selectedTemplate.label}</span>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-[var(--text-secondary)] transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isTypeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1d] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                {DIAGRAM_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedType(template.id);
                                            setIsTypeDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${selectedType === template.id
                                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                            : 'text-zinc-300 hover:bg-[var(--bg-hover)] hover:text-white'
                                            }`}
                                    >
                                        <span className="text-lg">{template.icon}</span>
                                        <span>{template.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[#0f0f11]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!diagramName.trim() || isLoading}
                        className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_var(--accent-glow)]"
                    >
                        {isLoading ? 'Création…' : 'Créer le diagramme'}
                    </button>
                </div>
            </div>
        </div>
    );
}
