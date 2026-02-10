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

    // Création du document partagé Yjs
    const ydoc = new Y.Doc();
    // Connexion WebSocket pour la synchronisation temps réel
    const provider = new HocuspocusProvider({
      url: APP_CONFIG.WEBSOCKET_URL,
      name: `diagram-${id}`,
      document: ydoc,
    });

    providerRef.current = provider;

    const type = ydoc.getText('monaco');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYtext(type);

    // Liaison bidirectionnelle entre Yjs et Monaco Editor
    const binding = new MonacoBinding(
      type,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness // Awareness : gère les curseurs des autres utilisateurs
    );

    bindingRef.current = binding;

    // Si le document Yjs est vide, initialiser avec defaultValue
    if (type.toString() === '' && defaultValue) {
      type.insert(0, defaultValue);
    }

    return () => {
      provider.destroy();
      binding.destroy();
      providerRef.current = null;
      bindingRef.current = null;
    };
  }, [id, editor, defaultValue]);

  const setContent = (content: string) => {
    if (ytext) {
      ytext.delete(0, ytext.length);
      ytext.insert(0, content);
    }
  };

  return { ytext, setContent };
}
