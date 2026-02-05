"use client";

import { useEffect, useCallback } from 'react';
import mermaid from 'mermaid';
import debounce from 'lodash.debounce';

// Hook pour valider la syntaxe Mermaid et afficher les erreurs dans Monaco
export function useMermaidValidation(editor: any, monaco: any) {
    const validate = useCallback(async (content: string) => {
        if (!editor || !monaco || !content || !content.trim()) {
            // Efface les marqueurs d'erreur si le contenu est vide
            if (editor && monaco) monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
            return;
        }

        try {
            // Validation de la syntaxe avec Mermaid
            await mermaid.parse(content, { suppressErrors: true });
            monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
        } catch (err: any) {
            const errorMsg = err.message || 'Syntax Error';
            const markers = [{
                severity: monaco.MarkerSeverity.Error,
                message: errorMsg,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: editor.getModel()!.getLineCount(),
                endColumn: 1000,
            }];

            const match = errorMsg.match(/line (\d+)/i);
            if (match && match[1]) {
                const line = parseInt(match[1], 10);
                markers[0].startLineNumber = line;
                markers[0].endLineNumber = line;
            }

            monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', markers);
        }
    }, [editor, monaco]);

    // Limite les appels à validate (500ms après la dernière frappe)
    const debouncedValidate = useCallback(debounce(validate, 500), [validate]);

    useEffect(() => {
        if (!editor || !monaco) return;

        const disposable = editor.onDidChangeModelContent(() => {
            debouncedValidate(editor.getValue());
        });

        // Initial validation
        validate(editor.getValue());

        return () => disposable.dispose();
    }, [editor, monaco, debouncedValidate, validate]);

    return { validate: debouncedValidate };
}
