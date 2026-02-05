"use client";

import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';

export function useYjs(id: string, editor: any, defaultValue: string = '') {
    const providerRef = useRef<HocuspocusProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const [ytext, setYtext] = useState<Y.Text | null>(null);

    useEffect(() => {
        if (!editor || !id) return;

        const ydoc = new Y.Doc();
        const provider = new HocuspocusProvider({
            url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
            name: `diagram-${id}`,
            document: ydoc,
        });

        providerRef.current = provider;

        const type = ydoc.getText('monaco');
        setYtext(type);

        const binding = new MonacoBinding(
            type,
            editor.getModel()!,
            new Set([editor]),
            provider.awareness
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
