'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { EditorHeader } from '../../../components/EditorHeader';
import { MermaidPreview } from '../../../components/MermaidPreview';
import { DiagramSidebar } from '../../../components/DiagramSidebar';
import { CreateDiagramDialog } from '../../../components/CreateDiagramDialog';
import { ExportDiagramDialog } from '../../../components/ExportDiagramDialog';
import { HistoryDialog } from '../../../components/HistoryDialog';
import { CollaborativeEditorRef } from '../../../components/CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode } from '@/types/DiagramTypes';
import { Loader2 } from 'lucide-react';
import { useGitHubAutoSave } from '@/hooks/useGitHubAutoSave';

const CollaborativeEditor = dynamic(
    () => import('../../../components/CollaborativeEditor').then((mod) => mod.CollaborativeEditor),
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

export default function ProjetPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [projetId, setProjetId] = useState<string | null>(null);
    const [projet, setProjet] = useState<ProjetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [mermaidCode, setMermaidCode] = useState<MermaidCode>('');
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [currentSvgContent, setCurrentSvgContent] = useState<string>('');

    const collaborativeEditorRef = React.useRef<CollaborativeEditorRef>(null);

    // GitHub Auto-Save hook
    const { manualSave, lastSaved, isSaving, hasUnsavedChanges } = useGitHubAutoSave({
        diagramId: selectedDiagramId,
        content: mermaidCode,
        enabled: !!selectedDiagramId && !!user,
    });

    // Resolve params
    useEffect(() => {
        params.then((p) => setProjetId(p.id));
    }, [params]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Fetch project data
    const fetchProjet = useCallback(async () => {
        if (!projetId) return;
        const token = Cookies.get('diagrammer_token');
        if (!token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets/${projetId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                if (response.status === 404 || response.status === 403) {
                    router.push('/dashboard');
                    return;
                }
                throw new Error(`Failed to fetch project: ${response.status}`);
            }

            const data: ProjetData = await response.json();
            setProjet(data);

            // Auto-open create dialog if no diagrams
            if (data.diagrammes.length === 0) {
                setIsCreateDialogOpen(true);
            } else if (!selectedDiagramId) {
                // Select the first diagram by default
                setSelectedDiagramId(data.diagrammes[0].id);
                setMermaidCode(data.diagrammes[0].contenu || '');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projetId, router, selectedDiagramId]);

    useEffect(() => {
        if (projetId && user) {
            fetchProjet();
        }
    }, [projetId, user, fetchProjet]);

    // Handle diagram selection
    const handleSelectDiagram = (diagrammeId: string) => {
        const diag = projet?.diagrammes.find(d => d.id === diagrammeId);
        if (diag) {
            setSelectedDiagramId(diagrammeId);
            setMermaidCode(diag.contenu || '');
        }
    };

    // Handle new diagram created
    const handleDiagramCreated = (newDiagramme: DiagrammeItem) => {
        setProjet((prev) => {
            if (!prev) return prev;
            return { ...prev, diagrammes: [newDiagramme, ...prev.diagrammes] };
        });
        setSelectedDiagramId(newDiagramme.id);
        setMermaidCode(newDiagramme.contenu || '');
    };

    const handleContentUpdate = useCallback((content: MermaidCode | undefined) => {
        setMermaidCode(content || '');
    }, []);

    const handleDeleteDiagram = async (diagrammeId: string, e: React.MouseEvent) => {
        console.log(`[handleDeleteDiagram] Requested for: ${diagrammeId}`);
        e.stopPropagation();
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce diagramme ?')) return;

        const token = Cookies.get('diagrammer_token');
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/diagrammes/${diagrammeId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log(`[handleDeleteDiagram] Response Status: ${response.status}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[handleDeleteDiagram] Error Data:`, errorData);
                throw new Error('Failed to delete diagram');
            }

            setProjet((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    diagrammes: prev.diagrammes.filter((d) => d.id !== diagrammeId),
                };
            });

            if (selectedDiagramId === diagrammeId) {
                setSelectedDiagramId(null);
                setMermaidCode('');
            }
        } catch (error) {
            console.error('Error deleting diagram:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleMermaidRender = useCallback((svg: string) => {
        setCurrentSvgContent(svg);
    }, []);

    const handleRestoreVersion = useCallback((content: string) => {
        setMermaidCode(content);
        collaborativeEditorRef.current?.injectNewContent(content);
    }, []);

    // Loading state
    if (authLoading || isLoading || !projet) {
        return (
            <div className="h-screen w-screen bg-[var(--bg-page)] flex flex-col overflow-hidden">
                {/* Header Skeleton */}
                <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between px-6">
                    <div className="h-8 w-32 skeleton shimmer-wrapper">
                        <div className="shimmer" />
                    </div>
                    <div className="flex gap-4">
                        <div className="h-8 w-24 skeleton shimmer-wrapper opacity-50">
                            <div className="shimmer" />
                        </div>
                        <div className="h-8 w-24 skeleton shimmer-wrapper opacity-50">
                            <div className="shimmer" />
                        </div>
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Skeleton */}
                    <div className="w-64 h-full border-r border-[var(--border-subtle)] bg-[#0c0c0e] p-4 flex flex-col gap-4">
                        <div className="h-4 w-24 skeleton shimmer-wrapper opacity-20">
                            <div className="shimmer" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-10 w-full rounded-md skeleton shimmer-wrapper opacity-10">
                                    <div className="shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor pane skeleton */}
                    <div className="w-[45%] h-full border-r border-[var(--border-subtle)] p-8">
                        <div className="w-full h-8 skeleton mb-6 shimmer-wrapper opacity-20">
                            <div className="shimmer" />
                        </div>
                        <div className="space-y-4">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="h-2 w-full skeleton shimmer-wrapper opacity-10" style={{ width: `${Math.random() * 40 + 60}%` }}>
                                    <div className="shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview pane skeleton */}
                    <div className="flex-1 h-full bg-[#050505] flex items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-5 blur-3xl scale-150 animate-pulse"></div>
                            <Loader2 size={32} className="animate-spin text-[var(--accent-primary)] opacity-20" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const selectedDiagram = projet.diagrammes.find(d => d.id === selectedDiagramId);
    const currentDiagramType = getDiagramTypeFromCode(mermaidCode);

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
            {/* Header */}
            <EditorHeader
                projectTitleLabel={projet.titre}
                currentUserData={user}
                diagramType={currentDiagramType}
                onExportClick={() => setIsExportDialogOpen(true)}
                onHistoryClick={() => setIsHistoryDialogOpen(true)}
                onSaveClick={manualSave}
                isSaving={isSaving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
            />

            {/* Main Area */}
            <main className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <DiagramSidebar
                    diagrammes={projet.diagrammes}
                    selectedId={selectedDiagramId}
                    onSelect={handleSelectDiagram}
                    onDelete={handleDeleteDiagram}
                    onCreateClick={() => setIsCreateDialogOpen(true)}
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
                                currentUser={user}
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
                        <p>Sélectionnez ou créez un diagramme pour commencer</p>
                    </div>
                )}
            </main>

            {/* Dialogs */}
            <CreateDiagramDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                projetId={projetId || ''}
                onCreated={handleDiagramCreated}
            />

            <ExportDiagramDialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                mermaidCode={mermaidCode}
                svgContent={currentSvgContent}
                diagramName={selectedDiagram?.titre || 'diagram'}
            />

            {selectedDiagramId && (
                <HistoryDialog
                    isOpen={isHistoryDialogOpen}
                    onClose={() => setIsHistoryDialogOpen(false)}
                    diagramId={selectedDiagramId}
                    onRestore={handleRestoreVersion}
                />
            )}
        </div>
    );
}
