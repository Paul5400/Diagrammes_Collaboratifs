"use client";

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import mermaid from 'mermaid';
import { HocuspocusProvider } from '@hocuspocus/provider';
import debounce from 'lodash.debounce';
import { MonacoBinding } from 'y-monaco';

interface CollaborativeEditorProps {
    id: string;
    onChange: (value: string | undefined) => void;
    defaultValue?: string;
}

export interface CollaborativeEditorRef {
    setContent: (content: string) => void;
}

export const CollaborativeEditor = React.forwardRef<CollaborativeEditorRef, CollaborativeEditorProps>(
    ({ id, onChange, defaultValue = "" }, ref) => {
        const editorRef = useRef<any>(null);
        const providerRef = useRef<HocuspocusProvider | null>(null);
        const bindingRef = useRef<MonacoBinding | null>(null);
        const ytextRef = useRef<Y.Text | null>(null);

        React.useImperativeHandle(ref, () => ({
            setContent: (content: string) => {
                if (ytextRef.current) {
                    const ytext = ytextRef.current;
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, content);
                }
            },
        }));

        function handleEditorDidMount(editor: any, monaco: Monaco) {
            editorRef.current = editor;

            // Configuration de l'éditeur pour Mermaid
            monaco.languages.register({ id: 'mermaid' });

            monaco.languages.registerCompletionItemProvider('mermaid', {
                provideCompletionItems: (model, position) => {
                    const keywords = [
                        // Diagram Types
                        'sequenceDiagram', 'flowchart', 'graph', 'classDiagram', 'stateDiagram-v2',
                        'gantt', 'pie', 'erDiagram', 'journey', 'gitGraph', 'mindmap', 'timeline',

                        // General/Flowchart
                        'participant', 'actor', 'loop', 'end', 'alt', 'else', 'opt', 'rect', 'note',
                        'Note right of', 'Note left of', 'Note over', 'activate', 'deactivate', 'as',
                        'LR', 'TB', 'BT', 'RL', 'subgraph', 'click', 'style', 'direction',

                        // Class/ER
                        'class', 'callback', 'link', 'click', 'iterable', 'interface', 'relationship',

                        // Gantt
                        'title', 'dateFormat', 'axisFormat', 'section',

                        // State
                        'state', '[*] ',

                        // Pie
                        'title', 'showData'
                    ];

                    const suggestions = keywords.map(k => ({
                        label: k,
                        kind: monaco.languages.CompletionItemKind.Keyword,
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

            // Initialisation de Yjs et Hocuspocus
            const ydoc = new Y.Doc();
            const provider = new HocuspocusProvider({
                url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
                name: `diagram-${id}`,
                document: ydoc,
            });

            providerRef.current = provider;

            const type = ydoc.getText('monaco');
            ytextRef.current = type;

            // Binding entre Yjs et Monaco
            const binding = new MonacoBinding(
                type,
                editor.getModel()!,
                new Set([editor]),
                provider.awareness
            );

            bindingRef.current = binding;

            // Si le document est vide, on met la valeur par défaut
            if (type.toString() === '' && defaultValue) {
                type.insert(0, defaultValue);
            }

            const validateSyntax = async (content: string) => {
                if (!content || !content.trim()) {
                    monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
                    return;
                }
                try {
                    await mermaid.parse(content, { suppressErrors: true });
                    monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
                } catch (err: any) {
                    // Essayer d'extraire la ligne si possible de l'erreur Mermaid
                    const errorMsg = err.message || 'Syntax Error';
                    const markers = [{
                        severity: monaco.MarkerSeverity.Error,
                        message: errorMsg,
                        startLineNumber: 1, // Par défaut si on ne peut pas extraire la ligne
                        startColumn: 1,
                        endLineNumber: editor.getModel()!.getLineCount(),
                        endColumn: 1000,
                    }];

                    // Tentative d'extraction de la ligne (ex: "Parse error on line 10")
                    const match = errorMsg.match(/line (\d+)/i);
                    if (match && match[1]) {
                        const line = parseInt(match[1], 10);
                        markers[0].startLineNumber = line;
                        markers[0].endLineNumber = line;
                    }

                    monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', markers);
                }
            };

            const debouncedValidate = debounce(validateSyntax, 500);

            editor.onDidChangeModelContent(() => {
                const content = editor.getValue();
                onChange(content);
                debouncedValidate(content);
            });

            // Validation initiale
            validateSyntax(editor.getValue());
        }

        useEffect(() => {
            return () => {
                if (providerRef.current) providerRef.current.destroy();
                if (bindingRef.current) bindingRef.current.destroy();
            };
        }, []);

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
