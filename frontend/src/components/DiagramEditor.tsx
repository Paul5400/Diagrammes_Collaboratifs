'use client';

import React, { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EditorHeader } from './EditorHeader';
import { MermaidPreview } from './MermaidPreview';
import { CollaborativeEditorRef } from './CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { DiagramTemplate } from './DiagramTemplates';
import { MermaidCode, DiagramId } from '@/types/DiagramTypes';
import { useSearchParams } from 'next/navigation';
import { DIAGRAM_TEMPLATES } from './DiagramTemplates';


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
 * CONSTANTE : INITIAL_DIAGRAM_TEMPLATE_CODE
 * Contenu par défaut affiché lors de l'ouverture d'un nouveau diagramme
 * si aucune donnée n'est encore présente dans la session collaborative.
 */
const INITIAL_DIAGRAM_TEMPLATE_CODE: MermaidCode = `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token

    Note right of System: Token expires in 24h`;

/**
 * INTERFACE : DiagramEditorProps
 * Définit la structure des propriétés reçues par le composant racine.
 */
interface DiagramEditorProps {
  id: DiagramId;
}

/**
 * COMPOSANT : DiagramEditor
 * C'est le composant racine de l'espace de travail.
 * Il orchestre la synchronisation entre l'éditeur (texte) et la preview (image).
 */

/**
 * FONCTION UTILITAIRE : Détermine le type de diagramme à partir du code
 */
const getDiagramTypeFromCode = (code: string): string => {
  const cleanCode = code.trim();
  // Simple heuristic: check standard Mermaid keywords at start
  if (cleanCode.startsWith('sequenceDiagram')) return 'Sequence Diagram';
  if (cleanCode.startsWith('flowchart') || cleanCode.startsWith('graph')) return 'Flowchart';
  if (cleanCode.startsWith('classDiagram')) return 'Class Diagram';
  if (cleanCode.startsWith('stateDiagram')) return 'State Diagram';
  if (cleanCode.startsWith('erDiagram')) return 'ER Diagram';
  if (cleanCode.startsWith('gantt')) return 'Gantt Chart';
  if (cleanCode.startsWith('mindmap')) return 'Mindmap';
  if (cleanCode.startsWith('pie')) return 'Pie Chart';
  if (cleanCode.startsWith('gitGraph')) return 'Git Graph';

  return 'Unknown Type';
};

export function DiagramEditor(diagram: DiagramEditorProps) {
  const currentDiagramId = diagram.id;
  const searchParams = useSearchParams();

  // Récupération des paramètres URL (type et nom)
  // Note: Dans un vrai cas, on utiliserait ces infos pour créer le diagramme côté backend
  // ou l'initialiser proprement. Ici on s'en sert pour l'état initial local.
  const typeParam = searchParams.get('type');
  const nameParam = searchParams.get('name');

  // Déterminer le code initial en fonction du type demandé dans l'URL
  const getInitialCode = () => {
    if (typeParam) {
      const template = DIAGRAM_TEMPLATES.find(t => t.id === typeParam);
      if (template) return template.code;
    }
    return INITIAL_DIAGRAM_TEMPLATE_CODE;
  };

  // État principal
  const [mermaidDiagramSourceCode, setMermaidDiagramSourceCode] =
    useState<MermaidCode>(getInitialCode());

  // Récupération de l'objet d'authentification
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

  // Calcul du type actuel pour l'afficher dans le header
  const currentDiagramType = getDiagramTypeFromCode(mermaidDiagramSourceCode);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
      {/* EN-TÊTE */}
      <EditorHeader
        projectTitleLabel={nameParam || "System Architecture V2"}
        currentUserData={authenticatedUserInstance}
        diagramType={currentDiagramType}
      />

      {/* ZONE PRINCIPALE */}
      <main className="flex flex-1 overflow-hidden">
        {/* PANNEAU GAUCHE */}
        <section className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
          <CollaborativeEditor
            ref={collaborativeMonacoEditorReference}
            sharedDocumentId={currentDiagramId}
            onContentUpdate={handleMonacoContentModification}
            initialContentValue={getInitialCode()}
          />
        </section>

        {/* PANNEAU DROIT */}
        <section className="w-[55%] h-full relative flex flex-col bg-[#050505]">
          <MermaidPreview mermaidCodeSource={mermaidDiagramSourceCode} />
        </section>
      </main>
    </div>
  );
}

