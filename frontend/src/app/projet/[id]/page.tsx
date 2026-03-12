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
import { DeleteProjectDialog } from '../../../components/DeleteProjectDialog';
import { ErrorNotification } from '../../../components/ErrorNotification';
import { CollaborativeEditorRef } from '../../../components/CollaborativeEditor';
import { useAuth } from '@/context/AuthContext';
import { MermaidCode } from '@/types/DiagramTypes';
import { Loader2, Lock, Check } from 'lucide-react';
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<{ title: string; message: string } | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [joinSuccess, setJoinSuccess] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Détecter le paramètre ?invite=TOKEN dans l'URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setInviteToken(params.get('invite'));
        }
    }, []);

    // Si lien d'invitation + accès refusé : rejoindre directement
    useEffect(() => {
        if (accessDenied && inviteToken && !requestLoading && !joinSuccess && !joinError) {
            handleJoinWithInvite(inviteToken);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessDenied, inviteToken]);

    const collaborativeEditorRef = React.useRef<CollaborativeEditorRef>(null);
    const initialSelectionDoneRef = React.useRef(false);

    // GitHub Auto-Save hook
    const { manualSave, lastSaved, isSaving, hasUnsavedChanges, canSave } = useGitHubAutoSave({
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
            } else if (!initialSelectionDoneRef.current) {
                initialSelectionDoneRef.current = true;
                // Select the first diagram by default
                setSelectedDiagramId(data.diagrammes[0].id);
                setMermaidCode(data.diagrammes[0].contenu || '');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projetId, router]);

    useEffect(() => {
        if (projetId && user) {
            fetchProjet();
        }
    }, [projetId, user, fetchProjet]);

    // Handle diagram selection
    const handleSelectDiagram = useCallback((diagrammeId: string) => {
        const diag = projet?.diagrammes.find(d => d.id === diagrammeId);
        if (diag) {
            setSelectedDiagramId(diagrammeId);
            setMermaidCode(diag.contenu || '');
        }
    }, [projet?.diagrammes]);

    // Handle new diagram created
    const handleDiagramCreated = useCallback((newDiagramme: DiagrammeItem) => {
        setProjet((prev) => {
            if (!prev) return prev;
            return { ...prev, diagrammes: [newDiagramme, ...prev.diagrammes] };
        });
        setSelectedDiagramId(newDiagramme.id);
        setMermaidCode(newDiagramme.contenu || '');
    }, []);

    const handleContentUpdate = useCallback((content: MermaidCode | undefined) => {
        setMermaidCode(content || '');
    }, []);

    const handleDeleteDiagram = useCallback(async (diagrammeId: string, e: React.MouseEvent) => {
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
                const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue', statusCode: response.status }));
                
                let errorTitle = 'Erreur de suppression';
                let errorMessage = errorData.message || 'Impossible de supprimer le diagramme.';

                if (response.status === 401) {
                    errorTitle = 'Session expirée';
                    errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
                } else if (response.status === 403) {
                    errorTitle = 'Accès refusé';
                    errorMessage = 'Vous n\'avez pas les droits pour supprimer ce diagramme.';
                } else if (response.status === 404) {
                    errorTitle = 'Diagramme introuvable';
                    errorMessage = 'Ce diagramme n\'existe plus ou a déjà été supprimé.';
                }

                setError({ title: errorTitle, message: errorMessage });
                return;
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
            setError({
                title: 'Erreur réseau',
                message: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion internet.'
            });
        }
    }, [selectedDiagramId]);

    const handleMermaidRender = useCallback((svg: string) => {
        setCurrentSvgContent(svg);
    }, []);

    const handleDeleteProject = async () => {
        if (!projetId) return;
        
        setIsDeleting(true);
        const token = Cookies.get('diagrammer_token');
        
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets/${projetId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue', statusCode: response.status }));
                
                let errorTitle = 'Erreur de suppression';
                let errorMessage = errorData.message || 'Impossible de supprimer le projet.';

                // Personnaliser le message selon le code d'erreur
                if (response.status === 401) {
                    errorTitle = 'Session expirée';
                    errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
                } else if (response.status === 403) {
                    errorTitle = 'Accès refusé';
                    errorMessage = 'Vous n\'avez pas les droits pour supprimer ce projet.';
                } else if (response.status === 404) {
                    errorTitle = 'Projet introuvable';
                    errorMessage = 'Ce projet n\'existe plus ou a déjà été supprimé.';
                } else if (errorMessage.includes('session GitHub a expiré') || errorMessage.includes('Permissions insuffisantes')) {
                    errorTitle = 'Reconnexion nécessaire';
                }

                setError({ title: errorTitle, message: errorMessage });
                setIsDeleting(false);
                setIsDeleteDialogOpen(false);
                return;
            }

            // Redirection vers le dashboard après succès
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error deleting project:', error);
            setError({
                title: 'Erreur réseau',
                message: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion internet.'
            });
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleRestoreVersion = useCallback((content: string) => {
        setMermaidCode(content);
        collaborativeEditorRef.current?.injectNewContent(content);
    }, []);

    // Sauvegarder tous les diagrammes du projet
    const handleSaveAll = useCallback(async () => {
        if (!projetId || isSaving) return;

        const token = Cookies.get('diagrammer_token');
        if (!token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets/${projetId}/save`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const result = await response.json();
                console.log(`Saved ${result.savedDiagrams.length} diagrams to GitHub`);
                if (result.errors.length > 0) {
                    console.error('Some diagrams failed to save:', result.errors);
                }
            }
        } catch (error) {
            console.error('Failed to save all diagrams:', error);
        }
    }, [projetId, isSaving]);

    // Rejoindre via lien d'invitation direct (sans approbation)
    const handleJoinWithInvite = async (token: string) => {
        setRequestLoading(true);
        setJoinError(null);
        try {
            const jwt = Cookies.get('diagrammer_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/demandes-acces/rejoindre`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: JSON.stringify({ inviteToken: token }),
                },
            );

            if (response.ok) {
                setJoinSuccess(true);
                // Recharger la page après 1.5s - l'utilisateur a maintenant accès
                setTimeout(() => {
                    window.location.href = window.location.pathname;
                }, 1500);
            } else {
                const data = await response.json().catch(() => ({}));
                setJoinError(data.message || "Lien d'invitation invalide ou expiré");
            }
        } catch {
            setJoinError('Erreur de connexion');
        } finally {
            setRequestLoading(false);
        }
    };

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
                            {[75, 85, 65, 90, 80, 70, 85, 95, 60, 75, 80, 90, 70, 85, 75].map((w, i) => (
                                <div key={i} className="h-2 w-full skeleton shimmer-wrapper opacity-10" style={{ width: `${w}%` }}>
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

    if (accessDenied) {
        // Cas 1 : lien d'invitation direct
        if (inviteToken) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-white gap-6">
                    {requestLoading && !joinSuccess && !joinError && (
                        <>
                            <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
                            <p className="text-zinc-400 text-sm">Vous rejoignez le projet…</p>
                        </>
                    )}
                    {joinSuccess && (
                        <>
                            <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                                <Check size={48} className="text-green-400" />
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold">Vous avez rejoint le projet !</h1>
                                <p className="text-zinc-400 text-sm">Redirection en cours…</p>
                            </div>
                        </>
                    )}
                    {joinError && (
                        <>
                            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                                <Lock size={48} className="text-red-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold">Lien invalide</h1>
                                <p className="text-zinc-400 max-w-md">{joinError}</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-sm text-zinc-500 hover:text-white transition-colors mt-2"
                            >
                                Retour au tableau de bord
                            </button>
                        </>
                    )}
                </div>
            );
        }

        // Cas 2 : accès refusé sans lien d'invitation
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
                
                {requestLoading && !requestSent && (
                    <div className="flex items-center gap-2 px-6 py-3 text-zinc-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Envoi en cours...</span>
                    </div>
                )}

                {requestSent ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-500 rounded-md border border-green-500/20">
                        <Check size={20} />
                        <span>Demande envoyée avec succès</span>
                    </div>
                ) : (
                    !requestLoading && (
                        <button 
                            onClick={handleRequestAccess}
                            disabled={requestLoading}
                            className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {requestLoading && <Loader2 size={18} className="animate-spin" />}
                            Demander l'accès
                        </button>
                    )
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

    const selectedDiagram = projet?.diagrammes.find(d => d.id === selectedDiagramId);
    const currentDiagramType = selectedDiagram ? getDiagramTypeFromCode(mermaidCode) : '';

    return (
        <div className="flex flex-col h-screen bg-[var(--bg-page)] overflow-hidden">
            {/* Header */}
            <EditorHeader
                projectTitleLabel={projet.titre}
                projetId={projetId ?? undefined}
                currentUserData={user}
                diagramType={currentDiagramType}
                onExportClick={() => setIsExportDialogOpen(true)}
                onHistoryClick={() => setIsHistoryDialogOpen(true)}
                onDeleteProjectClick={() => setIsDeleteDialogOpen(true)}
                onSaveClick={manualSave}
                onSaveAllClick={handleSaveAll}
                isSaving={isSaving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
                canSave={canSave}
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
                                initialContentValue={''}
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

            <DeleteProjectDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                projectName={projet.titre}
                onConfirm={handleDeleteProject}
                isDeleting={isDeleting}
            />

            {/* Error Notification */}
            <ErrorNotification
                isOpen={!!error}
                onClose={() => setError(null)}
                title={error?.title || 'Erreur'}
                message={error?.message || 'Une erreur est survenue.'}
            />
        </div>
    );
}
