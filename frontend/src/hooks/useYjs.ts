'use client';

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { DiagramId, MermaidCode } from '@/types/DiagramTypes';
import { APP_CONFIG } from '@/config/AppConfig';

/**
 * Hook de collaboration en temps réel avec Yjs (CRDT) et Monaco Editor
 * Synchronise l'éditeur entre plusieurs utilisateurs via WebSocket
 */
export function useYjs(id: DiagramId, editor: editor.IStandaloneCodeEditor | null, defaultValue: MermaidCode = '') {
    // useRef : Garde la même instance sans déclencher de re-render (important pour les connexions WebSocket)
    const providerRef = useRef<HocuspocusProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const ydocRef = useRef<Y.Doc | null>(null);
    
    const [ytext, setYtext] = useState<Y.Text | null>(null);
    const [isSynced, setIsSynced] = useState(false);

    // useEffect : Se ré-exécute quand l'id ou l'editor change (nouveau diagramme ou nouvel éditeur)
    useEffect(() => {
        if (!editor || !id) return;

        // Y.Doc : Structure CRDT pour synchronisation sans conflits
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        
        // Provider WebSocket : Synchronise automatiquement le document Yjs avec le serveur
        const provider = new HocuspocusProvider({
            url: APP_CONFIG.WEBSOCKET_URL,
            name: `diagram-${id}`,
            document: ydoc,
            onSynced: () => {
                // Déclenche la création du MonacoBinding uniquement après sync complète
                console.log('Document synchronisé');
                setIsSynced(true);
            }
        });

        providerRef.current = provider;
        const type = ydoc.getText('monaco_content');
        setYtext(type);

        // Attendre la synchronisation avant de créer le MonacoBinding
        // Sinon le contenu local écrase le serveur
        const checkSyncAndBind = () => {
            if (provider.isSynced && !bindingRef.current) {
                const model = editor.getModel();
                if (!model) {
                    setTimeout(checkSyncAndBind, 100);
                    return;
                }

                // MonacoBinding : Lie Yjs ↔ Monaco, toute modification est propagée automatiquement
                const binding = new MonacoBinding(
                    type,
                    model,
                    new Set([editor]),
                    provider.awareness // Partage les curseurs entre utilisateurs
                );

                bindingRef.current = binding;
                console.log('MonacoBinding créé');
            }
        };

        // Double stratégie : timeout + event listener pour garantir la création du binding
        const timeout = setTimeout(checkSyncAndBind, 200);
        provider.on('synced', checkSyncAndBind);

        // Cleanup : Fermer proprement toutes les connexions (WebSocket, binding, CRDT)
        return () => {
            clearTimeout(timeout);
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
            provider.destroy();
            ydoc.destroy();
            providerRef.current = null;
            ydocRef.current = null;
            setIsSynced(false);
        };
    }, [id, editor]);

    // Évite que les autres clients voient temporairement le document vide
    const setContent = (content: string) => {
        if (ytext && isSynced && ydocRef.current) {
            ydocRef.current.transact(() => {
                ytext.delete(0, ytext.length);
                ytext.insert(0, content);
            });
        }
    };

    return { ytext, setContent, isSynced };
}
