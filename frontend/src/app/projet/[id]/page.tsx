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
import { CollaborativeEditorRef } from '../../../components/CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode } from '@/types/DiagramTypes';
import { Loader2, Lock, Check } from 'lucide-react';

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
    const [currentSvgContent, setCurrentSvgContent] = useState<string>('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    const collaborativeEditorRef = React.useRef<CollaborativeEditorRef>(null);

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
                if (response.status === 403) {
                    setAccessDenied(true);
                    setIsLoading(false);
                    return;
                }
                if (response.status === 404) {
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

    const handleRequestAccess = async () => {
        if (!projetId) return;
        setRequestLoading(true);
        try {
            const token = Cookies.get('diagrammer_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/demandes-acces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ projetId }),
            });

            if (response.ok) {
                setRequestSent(true);
            } else if (response.status === 409) {
                const data = await response.json();
                if(data.message.includes("déjà en cours")) {
                   setRequestSent(true);
                }
                alert(data.message);
            }
             else {
                alert("Erreur lors de l'envoi de la demande");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion");
        } finally {
            setRequestLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-page)]">
                <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-white gap-6">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                    <Lock size={48} className="text-red-500" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Accès Refusé</h1>
                    <p className="text-zinc-400 max-w-md">
                        Vous n'avez pas l'autorisation de modifier ce projet.
                        Vous pouvez demander l'accès au propriétaire.
                    </p>
                </div>
                
                {requestSent ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 rounded-md border border-green-500/20">
                        <Check size={20} />
                        <span>Demande envoyée avec succès</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleRequestAccess}
                        disabled={requestLoading}
                        className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {requestLoading && <Loader2 size={18} className="animate-spin" />}
                        Demander l'accès
                    </button>
                )}
                
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="text-sm text-zinc-500 hover:text-white transition-colors mt-4"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    if (!projet) return null;

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
        </div>
    );
}
