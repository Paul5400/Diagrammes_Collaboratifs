'use client';

import React, { useState } from 'react';
import { X, Globe, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface CreateProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
    const router = useRouter();
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!titre.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const token = Cookies.get('diagrammer_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        titre: titre.trim(),
                        description: description.trim() || undefined,
                        public: isPublic,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erreur lors de la création du projet');
            }

            const projet = await response.json();
            onClose();
            router.push(`/projet/${projet.id}`);
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
                    <h2 className="text-lg font-semibold text-white">Créer un nouveau projet</h2>
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

                    {/* Titre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Nom du projet
                        </label>
                        <input
                            type="text"
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                            placeholder="Mon Projet de Diagrammes"
                            className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            autoFocus
                        />
                        <p className="text-xs text-zinc-500">
                            Un dépôt GitHub sera automatiquement créé avec ce nom.
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Description <span className="text-zinc-600">(optionnel)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez votre projet..."
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all resize-none"
                        />
                    </div>

                    {/* Visibilité */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Visibilité
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all ${!isPublic
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white'
                                        : 'border-[var(--border-subtle)] bg-[#1a1a1d] text-zinc-400 hover:border-zinc-600'
                                    }`}
                            >
                                <Lock size={16} />
                                <div className="text-left">
                                    <div className="text-sm font-medium">Privé</div>
                                    <div className="text-xs text-zinc-500">Seul vous y avez accès</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all ${isPublic
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white'
                                        : 'border-[var(--border-subtle)] bg-[#1a1a1d] text-zinc-400 hover:border-zinc-600'
                                    }`}
                            >
                                <Globe size={16} />
                                <div className="text-left">
                                    <div className="text-sm font-medium">Public</div>
                                    <div className="text-xs text-zinc-500">Visible par tous</div>
                                </div>
                            </button>
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
                        disabled={!titre.trim() || isLoading}
                        className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_var(--accent-glow)]"
                    >
                        {isLoading ? 'Création…' : 'Créer le projet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
