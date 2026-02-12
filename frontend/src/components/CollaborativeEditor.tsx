'use client';

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useYjs } from '@/hooks/useYjs';
import { useMermaidValidation } from '@/hooks/useMermaidValidation';
import { MERMAID_KEYWORDS } from '@/config/MermaidKeywords';
import { MONACO_EDITOR_CONFIGURATION_OPTIONS } from '@/config/MonacoConfig';
import { MermaidCode, DiagramId } from '@/types/DiagramTypes';

/**
 * PROPS : CollaborativeEditorProps
 * @param sharedDocumentId Unique ID du document pour la synchronisation Hocuspocus/Yjs
 * @param onContentUpdate Callback appelé à chaque modification du texte
 * @param initialContentValue Code initial si le document est vide
 */
interface CollaborativeEditorProps {
  sharedDocumentId: DiagramId;
  onContentUpdate: (updatedContent: MermaidCode | undefined) => void;
  initialContentValue?: MermaidCode;
}

/**
 * INTERFACE REF : CollaborativeEditorRef
 * Définit les méthodes que le parent (DiagramEditor) peut appeler sur ce composant.
 */
export interface CollaborativeEditorRef {
  injectNewContent: (newContentString: MermaidCode) => void;
}

/**
 * COMPOSANT : CollaborativeEditor
 * Un éditeur de code enrichi avec :
 * I. Synchronisation temps réel (Yjs + Hocuspocus)
 * II. Validation de syntaxe (Mermaid.js)
 * III. Autocomplétion intelligente
 */
export const CollaborativeEditor = forwardRef<
  CollaborativeEditorRef,
  CollaborativeEditorProps
>((props, reference) => {
  // On reçoit l'unique objet 'props' et on extrait manuellement les données
  const currentSharedDocumentId = props.sharedDocumentId;
  const onContentUpdateCallback = props.onContentUpdate;
  const initialContentFallbackValue = props.initialContentValue || '';

  // Instances locales de Monaco (L'éditeur et la bibliothèque)
  const [monacoEditorInstance, setMonacoEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [monacoLibraryLibraryInstance, setMonacoLibraryLibraryInstance] =
    useState<Monaco | null>(null);

  // Initialisation du hook Yjs pour le travail collaboratif
  const collaborativeYjsHook = useYjs(
    currentSharedDocumentId,
    monacoEditorInstance,
    initialContentFallbackValue
  );
  // On récupère la fonction pour mettre à jour le contenu de manière simple
  const updateCollaborativeContent = collaborativeYjsHook.setContent;

  /**
   * II. HOOK DE VALIDATION
   * Analyse le code Mermaid en arrière-plan et affiche des marqueurs rouges en cas d'erreur.
   */
  useMermaidValidation(monacoEditorInstance, monacoLibraryLibraryInstance);

  /**
   * EXPOSITION DES MÉTHODES (Ref)
   * On expose 'injectNewContent' pour que le parent puisse injecter des templates.
   */
  useImperativeHandle(
    reference,
    () => ({
      injectNewContent: updateCollaborativeContent,
    }),
    [updateCollaborativeContent]
  );

  /**
   * ÉVÉNEMENT : initializeMonacoEditor
   * Appelé une seule fois quand l'éditeur Monaco est prêt dans le DOM.
   */
  const initializeMonacoEditor = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      setMonacoEditorInstance(editorInstance);
      setMonacoLibraryLibraryInstance(monacoInstance);

      // 1. Enregistrement du nouveau langage 'mermaid' dans Monaco
      monacoInstance.languages.register({ id: 'mermaid' });

      // III Autocomplétion
      // 2. Configuration du "Completion Provider" pour l'autocomplétion
      monacoInstance.languages.registerCompletionItemProvider('mermaid', {
        provideCompletionItems: (model, position) => {
          const suggestions = MERMAID_KEYWORDS.map((keyword) => ({
            label: keyword,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - 1,
              endColumn: position.column,
            },
          }));
          return { suggestions };
        },
      });

      // 3. Écouteur de changements : on prévient le parent (DiagramEditor)
      // nécessaire pour mettre à jour la prévisualisation SVG.
      editorInstance.onDidChangeModelContent(() => {
        onContentUpdateCallback(editorInstance.getValue());
      });
    },
    [onContentUpdateCallback]
  );

  return (
    <div className="flex-1 h-full border-r border-[var(--border-subtle)] bg-[#0c0c0e]">
      <div className="h-full pt-4">
        <Editor
          height="100%"
          defaultLanguage="mermaid"
          theme="vs-dark"
          onMount={initializeMonacoEditor}
          options={MONACO_EDITOR_CONFIGURATION_OPTIONS}
        />
      </div>
    </div>
  );
});
CollaborativeEditor.displayName = 'CollaborativeEditor';
