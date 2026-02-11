'use client';

import React, { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EditorHeader } from './EditorHeader';
import { MermaidPreview } from './MermaidPreview';
import { CollaborativeEditorRef } from './CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { DiagramTemplate } from './DiagramTemplates';
import { MermaidCode, DiagramId } from '@/types/DiagramTypes';

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
const INITIAL_DIAGRAM_TEMPLATE_CODE: MermaidCode = "";

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
export function DiagramEditor(diagram: DiagramEditorProps) {
  // On reçoit l'objet 'props' et on récupère manuellement l'identifiant du diagramme
  const currentDiagramId = diagram.id;

  // État principal : contient la chaîne de caractères (code Mermaid) actuelle.
  const [mermaidDiagramSourceCode, setMermaidDiagramSourceCode] =
    useState<MermaidCode>(INITIAL_DIAGRAM_TEMPLATE_CODE);

  // Récupération de l'objet d'authentification
  const authenticationContext = useAuth();
  // On extrait l'instance de l'utilisateur de manière explicite et simple
  const authenticatedUserInstance = authenticationContext.user;

  /**
   * RÉFÉRENCE DE L'ÉDITEUR MONACO
   * Cette ref nous permet d'accéder aux méthodes internes du composant CollaborativeEditor
   * (définies via useImperativeHandle) comme par exemple 'injectNewContent'.
   */
  const collaborativeMonacoEditorReference =
    useRef<CollaborativeEditorRef>(null);

  /**
   * GESTIONNAIRE : handleMonacoContentModification
   * Cette fonction est passée à l'éditeur. Elle est appelée dès que le texte change.
   * On utilise useCallback pour que la référence de la fonction reste stable
   * et n'entraîne pas de re-rendus inutiles chez l'enfant.
   */
  const handleMonacoContentModification = useCallback(
    (updatedContent: MermaidCode | undefined) => {
      setMermaidDiagramSourceCode(updatedContent || '');
    },
    []
  );

  /**
   * GESTIONNAIRE : handleTemplateSelectionAction
   * Action déclenchée quand l'utilisateur choisit un exemple dans le Header.
   * On pilote manuellement l'éditeur pour injecter le nouveau code.
   */
  const handleTemplateSelectionAction = useCallback(
    (selectedTemplateObject: DiagramTemplate) => {
      if (collaborativeMonacoEditorReference.current) {
        collaborativeMonacoEditorReference.current.injectNewContent(
          selectedTemplateObject.code
        );
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
      {/* EN-TÊTE : Contient le titre, le sélecteur de templates et le profil utilisateur */}
      <EditorHeader
        projectTitleLabel="System Architecture V2"
        currentUserData={authenticatedUserInstance}
        onSelectTemplateCallback={handleTemplateSelectionAction}
      />

      {/* ZONE PRINCIPALE : Utilise flexbox pour diviser l'écran en deux (Édition / Prévisualisation) */}
      <main className="flex flex-1 overflow-hidden">
        {/* PANNEAU GAUCHE : SECTION ÉDITION COLLABORATIVE (45% de l'écran) */}
        <section className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
          <CollaborativeEditor
            ref={collaborativeMonacoEditorReference}
            sharedDocumentId={currentDiagramId}
            onContentUpdate={handleMonacoContentModification}
            initialContentValue={INITIAL_DIAGRAM_TEMPLATE_CODE}
          />
        </section>

        {/* PANNEAU DROIT : SECTION PRÉVISUALISATION GRAPHIQUE (55% de l'écran) */}
        <section className="w-[55%] h-full relative flex flex-col bg-[#050505]">
          <MermaidPreview mermaidCodeSource={mermaidDiagramSourceCode} />
        </section>
      </main>
    </div>
  );
}
