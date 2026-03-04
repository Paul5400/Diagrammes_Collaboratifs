'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

interface Demande {
    id: string;
    projet: {
        id: string;
        titre: string;
    };
    utilisateur: {
        id: string;
        username: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
    dateDemande: string;
}

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [demandes, setDemandes] = useState<Demande[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchDemandes = async () => {
        setLoading(true);
        const token = Cookies.get('diagrammer_token');
        if (!token) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/demandes-acces/received`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDemandes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDemandes();
        
        // Intervalle de polling toutes les 30 sec pour les nouvelles notifs
        const intervalId = setInterval(fetchDemandes, 30000);

        // Fermer le dropdown si clic hors zone
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(intervalId);
        };
    }, []);



    const handleAction = async (id: string, action: 'accept' | 'reject') => {
        setActionLoading(id);
        const token = Cookies.get('diagrammer_token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/demandes-acces/${id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                // Remove request from list
                // Si on accepte, la demande disparait de la liste 'en_attente'
                setDemandes((prev) => prev.filter((d) => d.id !== id));
            } else {
                console.error("Erreur action", await response.text());
                // alert("Erreur lors de l'action"); // On évite les alertes bloquantes
            }
        } catch (error) {
            console.error("Erreur réseau", error);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
             fetchDemandes(); // Rafraichir à l'ouverture
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {demandes.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#09090b]">
                        {demandes.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#18181b] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[#202024]">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-zinc-500" />
                            </div>
                        ) : demandes.length === 0 ? (
                            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                                Aucune notification
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border-subtle)]">
                                {demandes.map((demande) => (
                                    <div key={demande.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex gap-3">
                                            {demande.utilisateur.avatarUrl ? (
                                                <img src={demande.utilisateur.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                    {(demande.utilisateur.username || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-zinc-200">
                                                    <span className="font-semibold text-white truncate inline-block max-w-[100px] align-bottom text-ellipsis">{demande.utilisateur.username || 'Utilisateur'}</span>
                                                    {' '}veut rejoindre{' '}
                                                    <span className="text-[var(--accent-primary)] font-medium truncate inline-block max-w-[100px] align-bottom text-ellipsis">{demande.projet.titre}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {new Date(demande.dateDemande).toLocaleDateString()}
                                                </p>
                                                
                                                <div className="flex gap-2 mt-3 w-full">
                                                    <button
                                                        onClick={() => handleAction(demande.id, 'accept')}
                                                        disabled={actionLoading === demande.id}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-medium rounded transition-colors"
                                                    >
                                                        {actionLoading === demande.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                        Accepter
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(demande.id, 'reject')}
                                                        disabled={actionLoading === demande.id}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium rounded transition-colors"
                                                    >
                                                        <X size={12} />
                                                        Refuser
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
