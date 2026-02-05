"use client";

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';

// Hook pour gérer la collaboration temps réel avec Yjs et WebSocket
export function useYjs(id: string, editor: any) {
    // useRef : conserve les instances sans déclencher de re-render
    const providerRef = useRef<HocuspocusProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const [ytext, setYtext] = useState<Y.Text | null>(null);

    // useEffect : s'exécute après le rendu, nettoie au démontage
    useEffect(() => {
        if (!editor || !id) return;

        // Création du document partagé Yjs
        const ydoc = new Y.Doc();
        // Connexion WebSocket pour la synchronisation temps réel
        const provider = new HocuspocusProvider({
            url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
            name: `diagram-${id}`,
            document: ydoc,
        });

        providerRef.current = provider;

        const type = ydoc.getText('monaco');
        setYtext(type);

        // Liaison bidirectionnelle entre Yjs et Monaco Editor
        const binding = new MonacoBinding(
            type,
            editor.getModel()!,
            new Set([editor]),
            provider.awareness // Awareness : gère les curseurs des autres utilisateurs
        );

        bindingRef.current = binding;

        // Fonction de nettoyage : appelée au démontage du composant
        return () => {
            provider.destroy();
            binding.destroy();
            providerRef.current = null;
            bindingRef.current = null;
        };
    }, [id, editor]); // Dépendances : re-exécute si id ou editor change

    const setContent = (content: string) => {
        if (ytext) {
            ytext.delete(0, ytext.length);
            ytext.insert(0, content);
        }
    };

    return { ytext, setContent };
}
