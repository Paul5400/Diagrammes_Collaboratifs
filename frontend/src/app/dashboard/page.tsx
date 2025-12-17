import Link from 'next/link';
import { Logo } from '../../components/Logo';
import { ProjectCard } from '../../components/ProjectCard';
import { UserMenu } from '../../components/UserMenu';

export default function DashboardPage() {

  // for testing, before fetch
  const projects = [
    { id: '1', title: 'System Architecture V2', lastEdited: 'Edited 2 hours ago' },
    { id: '2', title: 'Authentication Flow', lastEdited: 'Edited yesterday' },
    { id: '3', title: 'API Schema', lastEdited: 'Edited 3 days ago' },
  ];

  return (
    <div className="max-w-[1200px] w-full mx-auto p-8 flex-1 overflow-y-auto">
      {/* App Header */}
      <nav className="flex justify-between items-center pb-12">
        <Logo size="md" />
        <UserMenu />
      </nav>

      {/* Tool Bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <button className="px-4 py-2.5 rounded-md text-sm font-medium transition-all bg-transparent text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)] rounded-b-none pb-3">
            Recent
          </button>
        </div>
        <Link 
          href="/diagramme/new" 
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px"
        >
          + Nouveau diagramme
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id}
            id={project.id}
            title={project.title}
            lastEdited={project.lastEdited}
          />
        ))}
      </div>
    </div>
  );
}
