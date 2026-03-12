'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteProjectDialog({
    isOpen,
    onClose,
    projectName,
    onConfirm,
    isDeleting,
}: DeleteProjectDialogProps) {
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen) return null;

    const isConfirmValid = confirmText === projectName;

    const handleConfirm = () => {
        if (isConfirmValid) {
            onConfirm();
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setConfirmText('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0f0f11] border border-red-500/30 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/30">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={24} />
                        <h2 className="text-lg font-semibold text-white">Supprimer le projet</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-400 font-medium mb-2">⚠️ Cette action est irréversible</p>
                        <p className="text-sm text-zinc-400">
                            Le projet et tous ses diagrammes seront définitivement supprimés.
                            Le dépôt GitHub sera également supprimé.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Pour confirmer, tapez le nom du projet : <span className="text-white font-semibold">{projectName}</span>
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={projectName}
                            disabled={isDeleting}
                            className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmValid || isDeleting}
                        className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Suppression...
                            </>
                        ) : (
                            'Supprimer définitivement'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
