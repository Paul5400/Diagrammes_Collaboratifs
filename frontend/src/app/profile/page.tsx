"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { Logo } from "../../components/Logo";

export default function ProfilePage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get("diagrammer_token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    router.push("/login");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                router.push("/login");
            }
        };

        fetchUser();
    }, [router]);

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
            <header className="w-full border-b border-[var(--border-subtle)]">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between p-6">
                    <Logo />
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                        ← Retour au tableau de bord
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-[800px] mx-auto w-full p-8 mt-10">
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="h-32 bg-gradient-to-r from-[var(--accent-primary)] to-[#8b5cf6] opacity-20"></div>

                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="w-24 h-24 rounded-2xl border-4 border-[var(--bg-page)] bg-[var(--bg-page)] overflow-hidden shadow-xl">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--accent-primary)] text-2xl font-bold text-white">
                                        {(user.username || "U").substring(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{user.username || "Utilisateur GitHub"}</h1>
                                <p className="text-[var(--text-secondary)]">Compte GitHub OAuth</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-subtle)]">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Pseudo</label>
                                    <p className="font-medium">{user.username || "Non renseigné"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Email</label>
                                    <p className="font-medium">{user.email || "Non disponible"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Membre depuis</label>
                                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">ID GitHub</label>
                                    <p className="font-medium text-[var(--text-secondary)] font-mono text-sm">{user.githubId}</p>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-center">
                                <a
                                    href={`https://github.com/${user.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 rounded-xl font-semibold bg-[#24292f] text-white hover:bg-[#1a1f24] transition-all flex items-center gap-2"
                                >
                                    Voir sur GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
