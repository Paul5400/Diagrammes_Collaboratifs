'use client';

import { useEffect, useCallback } from 'react';
import mermaid from 'mermaid';
import debounce from 'lodash.debounce';
import { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { APP_CONFIG } from '@/config/AppConfig';

 //Hook de validation Mermaid en temps réel - Affiche les erreurs
export function useMermaidValidation(editor: editor.IStandaloneCodeEditor | null, monaco: Monaco | null) {
    // useCallback : Garde la même référence de fonction pour éviter de recréer le debounce à chaque render
    const validate = useCallback(async (content: string) => {
        if (!editor || !monaco || !content || !content.trim()) {
            if (editor && monaco) monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
            return;
        }

        try {
            await mermaid.parse(content, { suppressErrors: true });
            monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
        } catch (err: unknown) {
            const errorMsg = (err as Error).message || 'Syntax Error';
            
            const markers = [{
                severity: monaco.MarkerSeverity.Error,
                message: errorMsg,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: editor.getModel()!.getLineCount(),
                endColumn: 1000,
            }];

            // Extraction du numéro de ligne depuis le message d'erreur (ex: "line 5")
            // Permet de souligner uniquement la ligne problématique au lieu de tout le document
            const match = errorMsg.match(/line (\d+)/i);
            if (match && match[1]) {
                const line = parseInt(match[1], 10);
                markers[0].startLineNumber = line;
                markers[0].endLineNumber = line;
            }

            monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', markers);
        }

    const debouncedValidate = useCallback(debounce(validate, APP_CONFIG.VALIDATION_DEBOUNCE_MS), [validate]);

  useEffect(() => {
    if (!editor || !monaco) return;

        // onDidChangeModelContent : Listener appelé à chaque modification de l'éditeur
        const disposable = editor.onDidChangeModelContent(() => {
            debouncedValidate(editor.getValue());
        });

        validate(editor.getValue());

        // Cleanup : dispose() retire le listener pour éviter les fuites mémoire
        return () => disposable.dispose();
    }, [editor, monaco, debouncedValidate, validate]);
}
