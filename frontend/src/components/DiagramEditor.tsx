'use client';

import React, { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EditorHeader } from './EditorHeader';
import { MermaidPreview } from './MermaidPreview';
import { CollaborativeEditorRef } from './CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode, DiagramId } from '@/types/DiagramTypes';
import { ExportDiagramDialog } from './ExportDiagramDialog';


/**
 * IMPORT DYNAMIQUE : CollaborativeEditor
 * Monaco Editor utilise des API navigateur (DOM, window) qui ne sont pas disponibles
 * lors du rendu côté serveur (SSR). On utilise next/dynamic avec { ssr: false }
 * pour le charger uniquement dans le navigateur de l'utilisateur.
 */
const CollaborativeEditor = dynamic(
  () => import('./CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
  { ssr: false }
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
}

/**
 * COMPOSANT : DiagramEditor
 * Composant racine de l'espace de travail éditeur + preview.
 */
export function DiagramEditor({ id, projectName, initialCode, isReadOnly = false }: DiagramEditorProps) {
  const currentDiagramId = id;
  
  const [mermaidDiagramSourceCode, setMermaidDiagramSourceCode] =
    useState<MermaidCode>(initialCode || '');

  const authenticationContext = useAuth();
  const authenticatedUserInstance = authenticationContext.user;

  const collaborativeMonacoEditorReference =
    useRef<CollaborativeEditorRef>(null);

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

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
      {/* EN-TÊTE */}
      <EditorHeader
        projectTitleLabel={projectName || "Diagramme"}
        currentUserData={authenticatedUserInstance}
        diagramType={currentDiagramType}
        onExportClick={() => setIsExportDialogOpen(true)}
      />

      {/* ZONE PRINCIPALE */}
      <main className="flex flex-1 overflow-hidden">
        {/* PANNEAU GAUCHE */}
        <section className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
          <CollaborativeEditor
            ref={collaborativeMonacoEditorReference}
            sharedDocumentId={currentDiagramId}
            onContentUpdate={handleMonacoContentModification}
            initialContentValue={initialCode || ''}
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

