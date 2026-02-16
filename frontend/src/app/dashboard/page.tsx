'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Logo } from '../../components/Logo';
import { ProjectCard } from '../../components/ProjectCard';
import { UserMenu } from '../../components/UserMenu';
import { CreateProjectDialog } from '../../components/dashboard/CreateProjectDialog';
import { FolderGit2, Loader2 } from 'lucide-react';

interface Projet {
  id: string;
  titre: string;
  description: string | null;
  public: boolean;
  dateCreation: string;
  dateModification: string;
  _count?: { diagrammes: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Projet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification de l'authentification
  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('diagrammer_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          Cookies.remove('diagrammer_token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Fetch des projets
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProjects = async () => {
      const token = Cookies.get('diagrammer_token');
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/projets`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    Cookies.remove('diagrammer_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="w-full border-b border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between p-6">
          <Logo />
          <UserMenu
            name={user.username || 'User'}
            plan="GitHub Account"
            initials={(user.username || 'U').substring(0, 2).toUpperCase()}
            avatarUrl={user.avatarUrl}
          />
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-2">
              Tableau de bord
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Mes projets
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5"
            >
              + Nouveau projet
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
              <FolderGit2 size={28} className="text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              Aucun projet pour le moment
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md">
              Créez votre premier projet pour commencer à collaborer sur des diagrammes.
              Un dépôt GitHub sera automatiquement créé.
            </p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)] hover:bg-[var(--accent-hover)]"
            >
              + Créer mon premier projet
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.titre}
                description={project.description}
                diagramCount={project._count?.diagrammes || 0}
                dateModification={project.dateModification}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
