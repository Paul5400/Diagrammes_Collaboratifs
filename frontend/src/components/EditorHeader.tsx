import React from 'react';
import Link from 'next/link';
import {
  Share2,
  Download,
  Layout,
  ChevronLeft,
} from 'lucide-react';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import { User } from '@/context/AuthContext';

interface EditorHeaderProps {
  projectTitleLabel: string;
  className?: string;
  currentUserData?: User | null;
  diagramType: string;
  onExportClick?: () => void;
}

export function EditorHeader(props: EditorHeaderProps) {
  // On reçoit l'unique objet 'props' et on pioche manuellement dedans
  const currentProjectTitle = props.projectTitleLabel;
  const authenticatedUserInformation = props.currentUserData;
  const customComponentClassName = props.className || '';
  const currentDiagramType = props.diagramType;


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

        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
            {currentProjectTitle}
          </h1>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="flex items-center gap-1 opacity-80">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
              main / current
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

        {/* Badge Type de Diagramme (Lecture seule) */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[#1a1a1d] text-[var(--text-secondary)] text-xs cursor-default">
          <Layout size={14} />
          <span className="font-medium">{currentDiagramType}</span>
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

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_15px_var(--accent-glow)]">
          <Share2 size={14} />
          Partager
        </button>

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
