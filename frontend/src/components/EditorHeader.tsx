import React from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  Share2,
  Download,
  ChevronLeft,
  Clock,
  ChevronDown,
  Link2,
  UserPlus,
} from 'lucide-react';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import { User } from '@/context/AuthContext';
import { SaveButton } from './SaveButton';
import { ProjectMenu } from './ProjectMenu';

interface EditorHeaderProps {
  projectTitleLabel: string;
  projetId?: string;
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
  children?: React.ReactNode;
}

export function EditorHeader(props: EditorHeaderProps) {
  const currentProjectTitle = props.projectTitleLabel;
  const projetId = props.projetId;
  const authenticatedUserInformation = props.currentUserData;
  const customComponentClassName = props.className || '';
  const currentDiagramType = props.diagramType;
  const headerChildren = props.children;
  
  const [shareMenuOpen, setShareMenuOpen] = React.useState(false);
  const [copiedType, setCopiedType] = React.useState<'readonly' | 'invite' | null>(null);
  const shareMenuRef = React.useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyToClipboard = (url: string, type: 'readonly' | 'invite') => {
    const done = () => {
      setCopiedType(type);
      setShareMenuOpen(false);
      setTimeout(() => setCopiedType(null), 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(done).catch(err => console.error('Erreur copie clipboard:', err));
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { console.error('Erreur fallback copie:', err); }
      document.body.removeChild(ta);
    }
  };

  const handleShareReadOnly = () => {
    if (typeof window === 'undefined') return;
    const base = window.location.href.replace(/\/+$/, '').replace(/\/view$/, '').split('?')[0];
    copyToClipboard(`${base}/view`, 'readonly');
  };

  const handleShareInvite = async () => {
    if (typeof window === 'undefined' || !projetId) return;
    const base = window.location.href.replace(/\/+$/, '').replace(/\/view$/, '').split('?')[0];

    try {
      const token = Cookies.get('diagrammer_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/demandes-acces/invite-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projetId }),
        },
      );
      if (!res.ok) throw new Error('Erreur génération token');
      const { token: inviteToken } = await res.json();
      copyToClipboard(`${base}?invite=${inviteToken}`, 'invite');
    } catch (err) {
      console.error('Impossible de générer le lien d\'invitation:', err);
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
        </div>

      </div>

      <div className="flex items-center gap-3">
        {props.onDeleteProjectClick && (
          <ProjectMenu onDeleteClick={props.onDeleteProjectClick} />
        )}

        <div className="h-6 w-[1px] bg-[var(--border-subtle)] mx-1" />

        {headerChildren}

        <div ref={shareMenuRef} className="relative">
          <button
            onClick={() => setShareMenuOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_15px_var(--accent-glow)]"
          >
            {copiedType ? (
              <span className="animate-pulse">Lien copié !</span>
            ) : (
              <>
                <Share2 size={14} />
                Partager
                <ChevronDown size={12} className={`transition-transform ${shareMenuOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {shareMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-[#1a1a1f] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={handleShareReadOnly}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <Link2 size={15} className="mt-0.5 text-[var(--accent-primary)] shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">Lien lecture seule</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">La personne peut consulter sans modifier</p>
                </div>
              </button>
              <div className="h-px bg-[var(--border-subtle)]" />
              <button
                onClick={handleShareInvite}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <UserPlus size={15} className="mt-0.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">Lien avec invitation</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Envoie une demande d'accès automatiquement</p>
                </div>
              </button>
            </div>
          )}
        </div>

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
