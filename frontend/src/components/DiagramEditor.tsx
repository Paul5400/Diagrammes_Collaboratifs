'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EditorHeader } from './EditorHeader';
import { MermaidPreview } from './MermaidPreview';
import { CollaborativeEditorRef } from './CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode, DiagramId } from '@/types/DiagramTypes';
import { ExportDiagramDialog } from './ExportDiagramDialog';
import { Bell, Lock, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

/**
 * IMPORT DYNAMIQUE : CollaborativeEditor
 * Monaco Editor utilise des API navigateur (DOM, window) qui ne sont pas disponibles
 * lors du rendu côté serveur (SSR). On utilise next/dynamic avec { ssr: false }
 * pour le charger uniquement dans le navigateur de l'utilisateur.
 */
const CollaborativeEditor = dynamic(
  () => import('./CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 h-full bg-[#0c0c0e] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-full h-8 skeleton mb-4 opacity-20 shimmer-wrapper">
          <div className="shimmer" />
        </div>
        <div className="w-full flex-1 space-y-3 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-3 w-full skeleton shimmer-wrapper" style={{ width: `${Math.random() * 40 + 60}%` }}>
              <div className="shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }
);

/**
 * FONCTION UTILITAIRE : Détermine le type de diagramme à partir du code
 */
const getDiagramTypeFromCode = (code: string): string => {
  const cleanCode = code.trim();
  if (cleanCode.startsWith('sequenceDiagram')) return 'Diagramme de Séquence';
  if (cleanCode.startsWith('flowchart') || cleanCode.startsWith('graph')) return 'Organigramme';
  if (cleanCode.startsWith('classDiagram')) return 'Diagramme de Classes';
  if (cleanCode.startsWith('stateDiagram')) return 'Diagramme d\'États';
  if (cleanCode.startsWith('erDiagram')) return 'Diagramme ER';
  if (cleanCode.startsWith('gantt')) return 'Diagramme de Gantt';
  if (cleanCode.startsWith('mindmap')) return 'Carte Mentale';
  if (cleanCode.startsWith('pie')) return 'Diagramme Circulaire';
  if (cleanCode.startsWith('gitGraph')) return 'Graphe Git';

  return 'Diagramme';
};

/**
 * INTERFACE : DiagramEditorProps
 */
interface DiagramEditorProps {
  id: DiagramId;
  projectName?: string;
  initialCode?: MermaidCode;
  isReadOnly?: boolean;
  headerChildren?: React.ReactNode;
}

/**
 * COMPOSANT : DiagramEditor
 * Composant racine de l'espace de travail éditeur + preview.
 */
export function DiagramEditor({ id, projectName, initialCode, isReadOnly = false, headerChildren }: DiagramEditorProps) {
  const currentDiagramId = id;
  
  const [mermaidDiagramSourceCode, setMermaidDiagramSourceCode] =
    useState<MermaidCode>(initialCode || '');

  const authenticationContext = useAuth();
  const authenticatedUserInstance = authenticationContext.user;

  // --- NEW: Access Control State ---
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [accessRequestInfo, setAccessRequestInfo] = useState<{
    projectId: string;
    projectTitle: string;
    ownerId: string;
  } | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  // --- NEW: Check Access on Mount ---
  useEffect(() => {
    const checkAccess = async () => {
      if (!authenticatedUserInstance) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/diagrammes/${id}/access`,
          {
            headers: {
              // Note: AuthContext might handle token differently. 
              // Assuming token is available or injected by interceptor if global.
              Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess);
          if (!data.hasAccess && data.requestInfo) {
            setAccessRequestInfo(data.requestInfo);
          }
        } else {
             setHasAccess(false);
        }
      } catch (error) {
        console.error('Erreur vérification accès:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [id, authenticatedUserInstance]);

  // --- NEW: Request Access Handler ---
  const handleRequestAccess = async () => {
    if (!accessRequestInfo) return;
    
    setIsRequestingAccess(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/demandes-acces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
          body: JSON.stringify({ projetId: accessRequestInfo.projectId }),
        }
      );

      if (response.ok) {
        setRequestSent(true);
        toast.success("Demande d'accès envoyée au propriétaire du projet.");
      } else {
        const errorData = await response.json();
        const msg = errorData.message || "Erreur lors de l'envoi de la demande.";
        if (msg.includes('déjà collaborateur') || msg.includes('déjà accès')) {
           setHasAccess(true);
           toast.success('Vous avez déjà accès! Rechargement...');
           window.location.reload(); 
        } else if (msg.includes('déjà en cours')) {
           setRequestSent(true);
           toast.info('Une demande est déjà en cours.');
        } else {
           toast.error(msg);
        }
      }
    } catch (error) {
      toast.error("Erreur de connexion lors de la demande.");
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const collaborativeMonacoEditorReference =
    useRef<CollaborativeEditorRef>(null);

  /**
   * ÉTAT : mermaidDiagramSourceCode
   * Stocke le code texte actuel du diagramme pour la prévisualisation et l'export.
   * Initialisé avec le code fourni ou une chaîne vide.
   */
  const [mermaidDiagramSourceCode, setMermaidDiagramSourceCode] =
    useState<MermaidCode>(initialCode || '' as MermaidCode);


  const handleMonacoContentModification = useCallback(
    (updatedContent: MermaidCode | undefined) => {
      setMermaidDiagramSourceCode(updatedContent || '');
    },
    []
  );

  const currentDiagramType = getDiagramTypeFromCode(mermaidDiagramSourceCode);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentSvgContent, setCurrentSvgContent] = useState<string>('');

  const handleMermaidRender = useCallback((svg: string) => {
    setCurrentSvgContent(svg);
  }, []);

  // --- NEW: Render Access Denied ---
  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[var(--bg-page)] gap-6 p-4 text-center">
        <div className="p-4 bg-gray-100 rounded-full dark:bg-gray-800">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Accès Refusé
          </h1>
          <p className="text-[var(--text-secondary)]">
            Vous n&apos;êtes pas autorisé à modifier ce diagramme. 
            {accessRequestInfo && ` Ce diagramme appartient au projet "${accessRequestInfo.projectTitle}".`}
          </p>
        </div>

        {accessRequestInfo && (
          <button 
            onClick={handleRequestAccess} 
            disabled={isRequestingAccess || requestSent}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {requestSent ? 'Demande envoyée' : (
              <>
                <Bell className="w-4 h-4" />
                {isRequestingAccess ? 'Envoi...' : 'Demander l\'accès'}
              </>
            )}
          </button>
        )}
        
        <div className="mt-8 text-sm text-[var(--text-tertiary)]">
          <button 
            onClick={() => window.history.back()}
            className="hover:text-white transition-colors underline decoration-zinc-700 hover:decoration-white underline-offset-4"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
      {/* EN-TÊTE */}
      <EditorHeader
        projectTitleLabel={projectName || "Diagramme"}
        currentUserData={authenticatedUserInstance}
        diagramType={currentDiagramType}
        onExportClick={() => setIsExportDialogOpen(true)}
      >
        {headerChildren}
      </EditorHeader>

      {/* ZONE PRINCIPALE */}
      <main className="flex flex-1 overflow-hidden">
        {/* PANNEAU GAUCHE */}
        <section className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
          <CollaborativeEditor
            ref={collaborativeMonacoEditorReference}
            sharedDocumentId={id}
            onContentUpdate={handleMonacoContentModification}
            initialContentValue={initialCode || '' as MermaidCode}

            currentDiagramType={currentDiagramType}
            isReadOnly={isReadOnly}
          />
        </section>

        {/* PANNEAU DROIT */}
        <section className="w-[55%] h-full relative flex flex-col bg-[#050505]">
          <MermaidPreview
            mermaidCodeSource={mermaidDiagramSourceCode}
            onRender={handleMermaidRender}
          />
        </section>
      </main>

      <ExportDiagramDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        mermaidCode={mermaidDiagramSourceCode}
        svgContent={currentSvgContent}
        diagramName={projectName || "diagram"}
      />
    </div>
  );
}

