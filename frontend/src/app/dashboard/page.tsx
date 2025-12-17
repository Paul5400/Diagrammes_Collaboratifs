"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { Logo } from "../../components/Logo";
import { ProjectCard } from "../../components/ProjectCard";
import { UserMenu } from "../../components/UserMenu";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = Cookies.get("diagrammer_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  const projects = [
    { id: "1", title: "System Architecture V2", lastEdited: "Modifié il y a 2 heures" },
    { id: "2", title: "Authentication Flow", lastEdited: "Modifié hier" },
    { id: "3", title: "API Schema", lastEdited: "Modifié il y a 3 jours" },
  ];

  const handleLogout = () => {
    Cookies.remove("diagrammer_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="w-full border-b border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between p-6">
          <Logo />
          <UserMenu name="GitHub User" plan="GitHub OAuth" initials="GH" />
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-2">Tableau de bord</p>
            <h1 className="text-4xl font-semibold tracking-tight">Mes diagrammes</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/diagramme/new"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5"
            >
              + Nouveau diagramme
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-all"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} id={project.id} title={project.title} lastEdited={project.lastEdited} />
          ))}
        </div>
      </main>
    </div>
  );
}
