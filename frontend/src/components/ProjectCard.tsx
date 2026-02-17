import Link from 'next/link';
import { FolderGit2 } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  title: string;
  description?: string | null;
  diagramCount: number;
  dateModification: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Modifié il y a ${diffMinutes}min`;
  if (diffHours < 24) return `Modifié il y a ${diffHours}h`;
  if (diffDays < 7) return `Modifié il y a ${diffDays}j`;
  return `Modifié le ${date.toLocaleDateString('fr-FR')}`;
}

export function ProjectCard({ id, title, description, diagramCount, dateModification }: ProjectCardProps) {
  return (
    <Link href={`/projet/${id}`} className="block group">
      <div className="bg-[var(--bg-panel)] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--accent-primary)]/5">
        {/* Preview Area */}
        <div
          className="h-40 bg-[#111] flex items-center justify-center relative"
          style={{
            backgroundImage: 'radial-gradient(#27272a 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <FolderGit2 size={32} />
            <span className="text-xs">
              {diagramCount} diagramme{diagramCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="font-medium text-sm mb-1 text-zinc-100 group-hover:text-white transition-colors">
            {title}
          </div>
          {description ? (
            <div className="text-xs text-zinc-500 mb-2 line-clamp-1">{description}</div>
          ) : (
            <div className="text-xs text-zinc-500 mb-2 line-clamp-1">Aucune description</div>
          )}
          <div className="text-xs text-zinc-600">
            {formatRelativeDate(dateModification)}
          </div>
        </div>
      </div>
    </Link>
  );
}
