import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Check, Loader2, ChevronDown, File, FolderGit2 } from 'lucide-react';

interface SaveButtonProps {
  onSave: () => void;
  onSaveAll?: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  canSave: boolean;
}

// Fonction simple pour formatter le temps écoulé
function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `Modifié il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Modifié il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Modifié il y a ${hours}h`;
  return `Modifié il y a ${Math.floor(hours / 24)}j`;
}

// Bouton de sauvegarde avec menu déroulant (save fichier actuel / tous les fichiers)
export function SaveButton({ onSave, onSaveAll, isSaving, lastSaved, hasUnsavedChanges, canSave }: SaveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Met à jour le timestamp toutes les secondes pour le temps relatif
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSaveCurrent = () => {
    onSave();
    setIsOpen(false);
  };

  const handleSaveAll = () => {
    if (onSaveAll) {
      onSaveAll();
      setIsOpen(false);
    }
  };

  const isDisabled = isSaving || !canSave;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
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
        ) : !canSave ? (
          <>
            <GitBranch size={14} />
            <span>Please wait...</span>
          </>
        ) : hasUnsavedChanges ? (
          <>
            <GitBranch size={14} />
            <span>Save to GitHub</span>
            <ChevronDown size={12} />
          </>
        ) : (
          <>
            <Check size={14} />
            <span>
              {lastSaved ? timeAgo(lastSaved) : 'Not saved yet'}
            </span>
            <ChevronDown size={12} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isDisabled && (
        <div className="absolute top-full mt-1 right-0 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg shadow-xl min-w-[200px] overflow-hidden z-50">
          <button
            onClick={handleSaveCurrent}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <File size={14} />
            <span>Sauvegarder ce fichier</span>
          </button>
          {onSaveAll && (
            <button
              onClick={handleSaveAll}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border-subtle)]"
            >
              <FolderGit2 size={14} />
              <span>Sauvegarder tous les fichiers</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
