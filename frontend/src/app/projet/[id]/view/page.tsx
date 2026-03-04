'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { EditorHeader } from '../../../../components/EditorHeader';
import { MermaidPreview } from '../../../../components/MermaidPreview';
import { DiagramSidebar } from '../../../../components/DiagramSidebar';
import { ExportDiagramDialog } from '../../../../components/ExportDiagramDialog';
import { CollaborativeEditorRef } from '../../../../components/CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode } from '@/types/DiagramTypes';
import { Loader2, Download } from 'lucide-react';

const CollaborativeEditor = dynamic(
    () => import('../../../../components/CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
    { ssr: false }
);

interface DiagrammeItem {
    id: string;
    titre: string;
    type: string;
    contenu: string | null;
}

interface ProjetData {
    id: string;
    titre: string;
    description: string | null;
    diagrammes: DiagrammeItem[];
}

const getDiagramTypeFromCode = (code: string): string => {
    const cleanCode = code.trim();
    if (cleanCode.startsWith('sequenceDiagram')) return 'Diagramme de Séquence';
    if (cleanCode.startsWith('flowchart') || cleanCode.startsWith('graph')) return 'Organigramme';
    if (cleanCode.startsWith('classDiagram')) return 'Diagramme de Classes';
    if (cleanCode.startsWith('stateDiagram')) return 'Diagramme d\'États';
    if (cleanCode.startsWith('erDiagram')) return 'Diagramme ER';
    if (cleanCode.startsWith('gantt')) return 'Diagramme de Gantt';
    if (cleanCode.startsWith('mindmap')) return 'Carte Mentale';
    if (cleanCode.startsWith('pie')) return 'Diagramme Circulaire';
    if (cleanCode.startsWith('gitGraph')) return 'Graphe Git';
    return 'Diagramme';
};

export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user } = useAuth(); // On ne redirige plus si pas connecté
    const [projetId, setProjetId] = useState<string | null>(null);
    const [projet, setProjet] = useState<ProjetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
    const [mermaidCode, setMermaidCode] = useState<MermaidCode>('');
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [currentSvgContent, setCurrentSvgContent] = useState<string>('');

    const collaborativeEditorRef = React.useRef<CollaborativeEditorRef>(null);

    // Resolve params
    useEffect(() => {
        params.then((p) => setProjetId(p.id));
    }, [params]);

    // Fetch project data (PUBLIC VERSION)
    const fetchProjet = useCallback(async () => {
        if (!projetId) return;

        try {
            // Utilisation de la route publique
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets/${projetId}/public`,
                {
                    // Pas de header Authorization requis pour la vue publique
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                   // Gérer le cas introuvable
                    return;
                }
                throw new Error(`Failed to fetch project: ${response.status}`);
            }

            const data: ProjetData = await response.json();
            setProjet(data);

            // Select the first diagram by default if none selected
            if (data.diagrammes.length > 0 && !selectedDiagramId) {
                setSelectedDiagramId(data.diagrammes[0].id);
                setMermaidCode(data.diagrammes[0].contenu || '');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projetId, selectedDiagramId]);

    useEffect(() => {
        if (projetId) {
            fetchProjet();
        }
    }, [projetId, fetchProjet]);

    // Handle diagram selection
    const handleSelectDiagram = (diagrammeId: string) => {
        const diag = projet?.diagrammes.find(d => d.id === diagrammeId);
        if (diag) {
            setSelectedDiagramId(diagrammeId);
            setMermaidCode(diag.contenu || '');
        }
    };

    const handleContentUpdate = useCallback((content: MermaidCode | undefined) => {
        setMermaidCode(content || '');
    }, []);

    const handleMermaidRender = useCallback((svg: string) => {
        setCurrentSvgContent(svg);
    }, []);

    // Loading state
    if (isLoading || !projet) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-page)]">
                <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    const selectedDiagram = projet.diagrammes.find(d => d.id === selectedDiagramId);
    const currentDiagramType = getDiagramTypeFromCode(mermaidCode);

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
            {/* Header */}
            <div className="relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500 z-[100]" title="Mode Lecture Seule"></div>
                <div className="h-14 border-b border-[var(--border-subtle)] bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-white bg-violet-600 px-2 py-0.5 rounded text-xs select-none">LECTURE SEULE</span>
                        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />
                        <h1 className="text-sm font-semibold text-white">{projet.titre}</h1>
                        <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {selectedDiagram?.titre || 'Sans titre'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/projet/${projetId}`}>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                <span>Mode Édition</span>
                            </button>
                        </Link>
                         <button
                            onClick={() => setIsExportDialogOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
                        >
                            <Download size={16} />
                            <span>Exporter</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <main className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <DiagramSidebar
                    diagrammes={projet.diagrammes}
                    selectedId={selectedDiagramId}
                    onSelect={handleSelectDiagram}
                    onDelete={() => {}} // Désactivé (ou fonction vide)
                    onCreateClick={() => {}} // Désactivé
                    isReadOnly={true} // Cache les boutons d'ajout/suppression
                />

                {/* Editor + Preview */}
                {selectedDiagram ? (
                    <>
                        {/* Editor Panel */}
                        <section className="w-[45%] h-full flex flex-col border-r border-[var(--border-subtle)]">
                            <CollaborativeEditor
                                key={selectedDiagram.id}
                                ref={collaborativeEditorRef}
                                sharedDocumentId={selectedDiagram.id}
                                onContentUpdate={handleContentUpdate}
                                initialContentValue={selectedDiagram.contenu || ''}
                                currentDiagramType={currentDiagramType}
                                isReadOnly={true} // ACTIVE LE MODE LECTURE SEULE
                            />
                        </section>

                        {/* Preview Panel */}
                        <section className="flex-1 h-full relative flex flex-col bg-[#050505]">
                            <MermaidPreview
                                mermaidCodeSource={mermaidCode}
                                onRender={handleMermaidRender}
                            />
                        </section>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-600">
                        <p>Aucun diagramme à afficher</p>
                    </div>
                )}
            </main>

            {/* Dialogs */}
            {/* Pas de CreateDiagramDialog ici car lecture seule */}

            <ExportDiagramDialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                mermaidCode={mermaidCode}
                svgContent={currentSvgContent}
                diagramName={selectedDiagram?.titre || 'diagram'}
            />
        </div>
    );
}

