import React, { useState, useEffect } from 'react';
import { X, Clock, User, GitCommit, Eye, RotateCcw, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

// Structure d'un commit GitHub
interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
  onRestore: (content: string) => void;
}

// Modale affichant l'historique Git d'un diagramme avec preview et restauration
export function HistoryDialog({ isOpen, onClose, diagramId, onRestore }: HistoryDialogProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewSha, setPreviewSha] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Reset preview quand le diagramme change ou la modale s'ouvre
  useEffect(() => {
    setPreviewContent(null);
    setPreviewSha(null);
    setCommits([]);
  }, [diagramId, isOpen]);

  // Charger l'historique au montage
  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, diagramId]);

  // Récupère la liste des commits ayant modifié ce fichier
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('diagrammer_token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/diagrammes/${diagramId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommits(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupère le contenu du fichier à un commit spécifique
  const handlePreview = async (sha: string) => {
    setLoadingPreview(true);
    setPreviewSha(sha);
    try {
      const token = Cookies.get('diagrammer_token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/diagrammes/${diagramId}/version/${sha}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data.contenu);
      }
    } catch (error) {
      console.error('Error fetching version:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Restaure le contenu prévisualisé dans l'éditeur
  const handleRestore = () => {
    if (previewContent) {
      onRestore(previewContent);
      onClose();
    }
  };

  // Formate la date en temps relatif (il y a Xmin/h/j)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-[var(--accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Historique Git</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Commits List */}
          <div className="w-1/2 border-r border-[var(--border-subtle)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
              </div>
            ) : commits.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)] py-20">
                Aucun historique disponible
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {commits.map((commit) => (
                  <button
                    key={commit.sha}
                    onClick={() => handlePreview(commit.sha)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all
                      ${previewSha === commit.sha
                        ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-focus)]'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <GitCommit size={16} className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {commit.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(commit.date)}
                          </span>
                        </div>
                        <code className="text-xs text-[var(--text-muted)] mt-1 block">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            {loadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
              </div>
            ) : previewContent ? (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="text-xs text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-x-auto">
                    <code>{previewContent}</code>
                  </pre>
                </div>
                <div className="p-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                  <button
                    onClick={handleRestore}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium text-sm shadow-[0_0_10px_var(--accent-glow)]"
                  >
                    <RotateCcw size={16} />
                    Restaurer cette version
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                Sélectionnez un commit pour voir le contenu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
