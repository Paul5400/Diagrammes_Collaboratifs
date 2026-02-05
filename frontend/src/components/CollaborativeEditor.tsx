"use client";

import React, { useState, useImperativeHandle, forwardRef} from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useYjs } from '@/hooks/useYjs';
import { useMermaidValidation } from '@/hooks/useMermaidValidation';
import { MERMAID_KEYWORDS } from '@/utils/MermaidKeywords';

interface CollaborativeEditorProps {
    id: string;
    onChange: (value: string | undefined) => void;
    defaultValue?: string;
}

// Interface pour exposer des méthodes au parent via ref
export interface CollaborativeEditorRef {
    setContent: (content: string) => void;
}

// forwardRef : permet au parent d'accéder aux méthodes du composant via ref
export const CollaborativeEditor = forwardRef<CollaborativeEditorRef, CollaborativeEditorProps>(
    ({ id, onChange, defaultValue = "" }, ref) => {
        const [editor, setEditor] = useState<any>(null);
        const [monaco, setMonaco] = useState<Monaco | null>(null);

        const { setContent } = useYjs(id, editor);
        useMermaidValidation(editor, monaco);

        // Expose setContent au parent via ref
        useImperativeHandle(ref, () => ({
            setContent,
        }));

        // Callback appelé quand Monaco Editor est monté dans le DOM
        function handleEditorDidMount(editorInstance: any, monacoInstance: Monaco) {
            setEditor(editorInstance);
            setMonaco(monacoInstance);

            // Enregistrement du langage Mermaid dans Monaco
            monacoInstance.languages.register({ id: 'mermaid' });

            // Configuration de l'autocomplétion pour les mots-clés Mermaid
            monacoInstance.languages.registerCompletionItemProvider('mermaid', {
                provideCompletionItems: (model, position) => {
                    const suggestions = MERMAID_KEYWORDS.map(k => ({
                        label: k,
                        kind: monacoInstance.languages.CompletionItemKind.Keyword,
                        insertText: k,
                        range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: position.column - 1,
                            endColumn: position.column
                        }
                    }));
                    return { suggestions };
                }
            });

            // Propagation des changements au parent à chaque modification
            editorInstance.onDidChangeModelContent(() => {
                onChange(editorInstance.getValue());
            });
        }

        return (
            <div className="flex-1 h-full border-r border-[var(--border-subtle)] bg-[#0c0c0e]">
                <div className="h-full pt-4">
                    <Editor
                        height="100%"
                        defaultLanguage="mermaid"
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            fontFamily: 'JetBrains Mono, monospace',
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            readOnly: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            backgroundColor: '#0c0c0e',
                            cursorSmoothCaretAnimation: "on",
                            smoothScrolling: true,
                            contextmenu: false,
                            lineHeight: 1.6,
                        }}
                    />
                </div>
            </div>
        );
    }
);
CollaborativeEditor.displayName = 'CollaborativeEditor';
