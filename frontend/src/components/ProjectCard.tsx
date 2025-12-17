
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  title: string;
  lastEdited: string;
}

export function ProjectCard({ id, title, lastEdited }: ProjectCardProps) {
  return (
    <Link href={`/diagramme/${id}`} className="block group">
      <div className="bg-[var(--bg-panel)] border border-white/10 rounded-lg overflow-hidden transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
        {/* Preview Area */}
        <div className="h-40 bg-[#111] flex items-center justify-center relative" 
             style={{ 
               backgroundImage: 'radial-gradient(#27272a 1px, transparent 0)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        <div className="p-4">
          <div className="font-medium text-sm mb-1 text-zinc-100">{title}</div>
          <div className="text-xs text-zinc-500">{lastEdited}</div>
        </div>
      </div>
    </Link>
  );
}
