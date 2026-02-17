import React from 'react';
import { GitBranch, Check, Loader2 } from 'lucide-react';

interface SaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

// Fonction simple pour formatter le temps écoulé
function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export function SaveButton({ onSave, isSaving, lastSaved, hasUnsavedChanges }: SaveButtonProps) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
        transition-all shadow-sm
        ${hasUnsavedChanges
          ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-[0_0_10px_var(--accent-glow)]'
          : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-focus)]'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isSaving ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Saving...</span>
        </>
      ) : hasUnsavedChanges ? (
        <>
          <GitBranch size={14} />
          <span>Save to GitHub</span>
        </>
      ) : (
        <>
          <Check size={14} />
          <span>
            {lastSaved ? timeAgo(lastSaved) : 'Not saved yet'}
          </span>
        </>
      )}
    </button>
  );
}
