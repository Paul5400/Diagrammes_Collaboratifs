import React from 'react';
import Link from 'next/link';
import {
  Share2,
  Download,
  Layout,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import { User } from '@/context/AuthContext';
import { SaveButton } from './SaveButton';
import { ProjectMenu } from './ProjectMenu';

interface EditorHeaderProps {
  projectTitleLabel: string;
  className?: string;
  currentUserData?: User | null;
  diagramType: string;
  onExportClick?: () => void;
  onSaveClick?: () => void;
  onSaveAllClick?: () => void;
  onHistoryClick?: () => void;
  onDeleteProjectClick?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  canSave?: boolean;
}

export function EditorHeader(props: EditorHeaderProps) {
  // On reçoit l'unique objet 'props' et on pioche manuellement dedans
  const currentProjectTitle = props.projectTitleLabel;
  const authenticatedUserInformation = props.currentUserData;
  const customComponentClassName = props.className || '';
  const currentDiagramType = props.diagramType;
  
  const [hasCopiedLink, setHasCopiedLink] = React.useState(false);

  const handleShareClick = () => {
    // Si on est en mode "view" (lecture seule), le lien actuel est déjà le bon
    // Sinon, on génère le lien de collaboration standard
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      
      // Si l'URL contient déjà '/view', on copie tel quel (c'est déjà un lien lecture seule)
      if (currentUrl.includes('/view')) {
        navigator.clipboard.writeText(currentUrl)
          .then(() => {
            setHasCopiedLink(true);
            setTimeout(() => setHasCopiedLink(false), 2000);
          });
        return;
      }

      // Sinon, on crée le lien de lecture seule en ajoutant '/view'
      const baseUrl = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl;
      const readOnlyUrl = `${baseUrl}/view`;
      
      // Solution de repli pour HTTP non sécurisé (ou navigateurs anciens)
      // Car navigator.clipboard.writeText exige un contexte sécurisé (HTTPS ou localhost)
      if (navigator.clipboard) {
        navigator.clipboard.writeText(readOnlyUrl)
          .then(() => {
            setHasCopiedLink(true);
            setTimeout(() => setHasCopiedLink(false), 2000);
          })
          .catch(err => console.error('Erreur copie clipboard:', err));
      } else {
        // Fallback deprecated mais fonctionnel pour HTTP local
        const textArea = document.createElement("textarea");
        textArea.value = readOnlyUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setHasCopiedLink(true);
          setTimeout(() => setHasCopiedLink(false), 2000);
        } catch (err) {
          console.error('Erreur fallback copie:', err);
        }
        document.body.removeChild(textArea);
      }
    }
  };


  return (
    <header
      className={`h-14 border-b border-[var(--border-subtle)] bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-between px-4 z-50 ${customComponentClassName}`}
    >
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
          title="Retour au tableau de bord"
        >
          <ChevronLeft size={20} />
        </Link>
        <Logo />

        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
              {currentProjectTitle}
            </h1>
          </div>
          
          {props.onDeleteProjectClick && (
            <ProjectMenu onDeleteClick={props.onDeleteProjectClick} />
          )}
        </div>

      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 mr-2">
          {[1, 2].map((userAvatarPlaceholderIndex) => (
            <div
              key={userAvatarPlaceholderIndex}
              className="w-7 h-7 rounded-full border-2 border-[#0f0f11] bg-[var(--accent-primary)] flex items-center justify-center text-[10px] text-white"
            >
              JD
            </div>
          ))}
          <div className="w-7 h-7 rounded-full border-2 border-[#0f0f11] bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
            +1
          </div>
        </div>

        <button 
          onClick={handleShareClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_15px_var(--accent-glow)] relative overflow-hidden"
        >
          {hasCopiedLink ? (
             <>
               <span className="animate-pulse">Lien copié !</span>
             </>
          ) : (
            <>
              <Share2 size={14} />
              Partager (Lecture seule)
            </>
          )}
        </button>
        <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1" />

        {props.onSaveClick && (
          <SaveButton
            onSave={props.onSaveClick}
            onSaveAll={props.onSaveAllClick}
            isSaving={props.isSaving || false}
            lastSaved={props.lastSaved || null}
            hasUnsavedChanges={props.hasUnsavedChanges || false}
            canSave={props.canSave ?? true}
          />
        )}

        {props.onHistoryClick && (
          <button
            onClick={props.onHistoryClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-all"
          >
            <Clock size={14} />
            Historique
          </button>
        )}
        <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1" />

        <button
          onClick={props.onExportClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-all"
        >
          <Download size={16} />
          Exporter
        </button>

        <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1" />

        <UserMenu
          name={authenticatedUserInformation?.username || 'Guest User'}
          plan="GitHub Account"
          initials={(authenticatedUserInformation?.username || 'G')
            .substring(0, 2)
            .toUpperCase()}
          avatarUrl={authenticatedUserInformation?.avatarUrl}
        />
      </div>
    </header>
  );
}
