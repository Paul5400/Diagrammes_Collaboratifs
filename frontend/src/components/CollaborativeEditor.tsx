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
import { Layout } from 'lucide-react';

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
  currentDiagramType?: string;
  isReadOnly?: boolean;
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
  const isReadOnlyMode = props.isReadOnly || false;

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
      console.log(`[CollaborativeEditor] Montage de l'éditeur pour ${currentSharedDocumentId}`);
      const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
        ...MONACO_EDITOR_CONFIGURATION_OPTIONS,
        readOnly: isReadOnlyMode, // Applique le mode lecture seule si nécessaire
      }; 

      setMonacoEditorInstance(editorInstance);
      setMonacoLibraryLibraryInstance(monacoInstance);
      
      // Applique les options immédiatement au chargement
      editorInstance.updateOptions(monacoOptions);

      // 1. Enregistrement du nouveau langage 'mermaid' dans Monaco
      monacoInstance.languages.register({ id: 'mermaid' });

      // Définition d'un thème personnalisé pour faciliter l'édition de fichiers
      monacoInstance.editor.defineTheme('mermaid-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword.diagram', foreground: 'C586C0', fontStyle: 'bold' }, // Violet (Types de diagrammes)
          { token: 'keyword.control', foreground: 'D87093', fontStyle: 'bold' }, // Rose (loop, alt, end, subgraph)
          { token: 'keyword.command', foreground: '569CD6' },                   // Bleu (Commandes générales)
          { token: 'type.keyword', foreground: '4EC9B0', fontStyle: 'italic' }, // Turquoise (participant, actor, class)
          { token: 'type.marker', foreground: '4EC9B0' },                      // Turquoise (<<interface>>)
          { token: 'operator.arrow', foreground: 'FFD700', fontStyle: 'bold' }, // Or (Flèches)
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },      // Vert (Commentaires)
          { token: 'string', foreground: 'CE9178' },                            // Orange (Textes)
          { token: 'number', foreground: 'B5CEA8' },                            // Vert clair (Chiffres)
          { token: 'variable', foreground: '9CDCFE' },                          // Bleu ciel (Identifiants)
          { token: 'operator.separator', foreground: 'D4D4D4' },                // Gris clair
          { token: 'bracket', foreground: 'FFD700' },                           // Or
        ],
        colors: {
          'editor.background': '#0c0c0e',
          'editorLineNumber.foreground': '#3b3b3f',
        }
      });

      // Configuration du tokenizer pour la coloration syntaxique
      monacoInstance.languages.setMonarchTokensProvider('mermaid', {
        keywords: MERMAID_KEYWORDS,
        diagramTypes: ['sequenceDiagram', 'flowchart', 'graph', 'classDiagram', 'stateDiagram-v2', 'gantt', 'pie', 'erDiagram', 'journey', 'gitGraph', 'mindmap', 'timeline'],
        controlKeywords: ['loop', 'alt', 'else', 'opt', 'end', 'rect', 'subgraph', 'critical', 'option', 'break', 'try', 'catch', 'finally'],
        typeKeywords: ['participant', 'actor', 'class', 'interface', 'entity', 'enum', 'struct'],
        tokenizer: {
          root: [
            [/[a-zA-Z_$][\w$]*/, {
              cases: {
                '@diagramTypes': 'keyword.diagram',
                '@controlKeywords': 'keyword.control',
                '@typeKeywords': 'type.keyword',
                '@keywords': 'keyword.command',
                '@default': 'variable'
              }
            }],
            [/%%.*$/, 'comment'],
            [/<<[^>]+>>/, 'type.marker'],
            [/[{}()\[\]]/, 'bracket'],
            [/->>?|-->>?|==>?|<-?|<--?|x-?|x--?|\*-?|\*--?/, 'operator.arrow'],
            [/:|\||~/, 'operator.separator'],
            [/"[^"]*"/, 'string'],
            [/\d+/, 'number'],
          ]
        }
      });

      // 2. Completion provider
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
        const val = editorInstance.getValue();
        console.log(`[CollaborativeEditor] Changement détecté dans l'éditeur (${val.length} chars)`);
        onContentUpdateCallback(val);
      });

      // 4. Configuration finale incluant le mode lecture seule
      editorInstance.updateOptions({
        ...MONACO_EDITOR_CONFIGURATION_OPTIONS,
        readOnly: isReadOnlyMode,
      });
    },
    [onContentUpdateCallback, currentSharedDocumentId, isReadOnlyMode]
  );

  return (
    <div className="flex-1 h-full border-r border-[var(--border-subtle)] bg-[#0c0c0e] flex flex-col">
      {/* Badge Type de Diagramme */}
      {props.currentDiagramType && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[#1a1a1d] text-[var(--text-secondary)] text-xs cursor-default">
            <Layout size={14} />
            <span className="font-medium">{props.currentDiagramType}</span>
          </div>
        </div>
      )}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="mermaid"
          theme="mermaid-dark"
          onMount={initializeMonacoEditor}
          options={MONACO_EDITOR_CONFIGURATION_OPTIONS}
        />
      </div>
    </div>
  );
});
CollaborativeEditor.displayName = 'CollaborativeEditor';
