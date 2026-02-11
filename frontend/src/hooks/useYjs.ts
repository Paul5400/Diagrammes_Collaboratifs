'use client';

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { DiagramId, MermaidCode } from '@/types/DiagramTypes';
import { APP_CONFIG } from '@/config/AppConfig';

// Hook pour gérer la collaboration temps réel avec Yjs et WebSocket
export function useYjs(
  id: DiagramId,
  editor: editor.IStandaloneCodeEditor | null,
  defaultValue: MermaidCode = ''
) {
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [ytext, setYtext] = useState<Y.Text | null>(null);

  // useEffect : s'exécute après le rendu, nettoie au démontage
  useEffect(() => {
    if (!editor || !id) return;

        // 1. Création du document et du provider (stable)
        const ydoc = new Y.Doc();
        const provider = new HocuspocusProvider({
            url: APP_CONFIG.WEBSOCKET_URL,
            name: `diagram-${id}`,
            document: ydoc,
            onConnect: () => console.log('WebSocket connecté'),
            onStatus: (data) => console.log(`Statut : ${data.status}`),
        });

    providerRef.current = provider;

        const type = ydoc.getText('monaco_content');
        setYtext(type);

        // 2. On vide le modèle Monaco local avant de le lier
        // Cela évite que le contenu par défaut de Monaco ne fusionne mal avec Yjs
        const model = editor.getModel();
        if (model) {
            model.setValue(""); // On force le vide pour laisser Yjs injecter le contenu propre
        }

        // 3. Liaison bidirectionnelle
        const binding = new MonacoBinding(
            type,
            model!,
            new Set([editor]),
            provider.awareness // Awareness : gère les curseurs des autres utilisateurs
        );

        bindingRef.current = binding;

        return () => {
            console.log("nettoyage de Yjs...");
            binding.destroy();
            provider.destroy();
            ydoc.destroy();
            providerRef.current = null;
            bindingRef.current = null;
        };
    }, [id, editor]); // On enlève defaultValue des dépendances pour éviter de tout recréer si elle change

  const setContent = (content: string) => {
    if (ytext) {
      ytext.delete(0, ytext.length);
      ytext.insert(0, content);
    }
  };

  return { ytext, setContent };
}
