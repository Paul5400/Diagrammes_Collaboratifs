"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';

/**
 * INTERFACE : User
 * Représente la structure d'un utilisateur dans le système.
 */
export interface User {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

// Permet de partager l'état utilisateur dans toute l'app
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider : composant qui fournit le contexte à ses enfants
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = Cookies.get("diagrammer_token");
        if (!token) {
            setUser(null);
            setLoading(false);
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
            } else {
                setUser(null);
                Cookies.remove("diagrammer_token");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // useEffect avec tableau vide : s'exécute une seule fois au montage
    useEffect(() => {
        fetchUser();
    }, []);

    const logout = () => {
        Cookies.remove("diagrammer_token");
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personnalisé pour accéder au contexte d'authentification
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
