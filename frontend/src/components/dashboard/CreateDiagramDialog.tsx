import React, { useState } from 'react';
import { X, Lock, Github, ChevronDown } from 'lucide-react';
import { DIAGRAM_TEMPLATES } from '../DiagramTemplates';
import { useRouter } from 'next/navigation';

interface CreateDiagramDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateDiagramDialog({ isOpen, onClose }: CreateDiagramDialogProps) {
    const router = useRouter();
    const [diagramName, setDiagramName] = useState('');
    const [selectedType, setSelectedType] = useState(DIAGRAM_TEMPLATES[0].id);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

    const selectedTemplate = DIAGRAM_TEMPLATES.find(t => t.id === selectedType) || DIAGRAM_TEMPLATES[0];


    if (!isOpen) return null;

    const handleCreate = () => {
        if (!diagramName.trim()) return;

        // Encode parameters for the URL
        const params = new URLSearchParams({
            type: selectedType,
            name: diagramName
        });

        router.push(`/diagramme/new?${params.toString()}`);
        onClose();
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
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Nom du projet
                        </label>
                        <input
                            type="text"
                            value={diagramName}
                            onChange={(e) => setDiagramName(e.target.value)}
                            placeholder="Mon Super Diagramme"
                            className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Type Selection - Dropdown */}
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
                        {/* Permissions (Placeholder) */}
                        <div className="space-y-2 opacity-50 cursor-not-allowed">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">
                                    Permissions
                                </label>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Bientôt</span>
                            </div>
                            <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[#1a1a1d] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Lock size={16} />
                                    <span>Privé</span>
                                </div>
                            </div>
                        </div>

                        {/* GitHub Repo (Placeholder) */}
                        <div className="space-y-2 opacity-50 cursor-not-allowed">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">
                                    Repository GitHub
                                </label>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Bientôt</span>
                            </div>
                            <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[#1a1a1d] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Github size={16} />
                                    <span>Aucun repository lié</span>
                                </div>
                            </div>
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
                        disabled={!diagramName.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_var(--accent-glow)]"
                    >
                        Créer le diagramme
                    </button>
                </div>
            </div>

        </div>
    );
}
