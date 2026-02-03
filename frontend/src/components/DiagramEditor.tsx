"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { EditorHeader } from './EditorHeader';
import { MermaidPreview } from './MermaidPreview';
import { CollaborativeEditorRef } from './CollaborativeEditor';
import Cookies from 'js-cookie';

const CollaborativeEditor = dynamic(
    () => import('./CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
    { ssr: false }
);

interface DiagramEditorProps {
    id: string;
}

const DEFAULT_CODE = `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token

    Note right of System: Token expires in 24h`;

export function DiagramEditor({ id }: DiagramEditorProps) {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [user, setUser] = useState<any>(null);
    const editorRef = React.useRef<CollaborativeEditorRef>(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get("diagrammer_token");
            if (!token) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
            <EditorHeader
                title="System Architecture V2"
                user={user}
                onSelectTemplate={(t) => {
                    if (editorRef.current) {
                        editorRef.current.setContent(t.code);
                    }
                }}
            />

            <main className="flex flex-1 overflow-hidden">
                {/* Editor Side */}
                <div className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
                    <CollaborativeEditor
                        ref={editorRef}
                        id={id}
                        onChange={(val) => setCode(val || "")}
                        defaultValue={DEFAULT_CODE}
                    />
                </div>

                {/* Preview Side */}
                <div className="w-[55%] h-full relative flex flex-col bg-[#050505]">
                    <MermaidPreview code={code} />
                </div>
            </main>
        </div>
    );
}
