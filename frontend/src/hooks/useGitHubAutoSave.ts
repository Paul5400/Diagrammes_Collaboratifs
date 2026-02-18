import { useState, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';

interface UseGitHubAutoSaveProps {
  diagramId: string | null;
  content: string;
  enabled: boolean;
}

interface SaveResult {
  success: boolean;
  path?: string;
  sha?: string;
  url?: string;
}

// Hook pour gérer la sauvegarde manuelle vers GitHub
export function useGitHubAutoSave({ diagramId, content, enabled }: UseGitHubAutoSaveProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(true);
  const lastContentRef = useRef<string>('');

  // Sauvegarde manuelle avec cooldown de 5 secondes
  const manualSave = useCallback(async () => {
    if (isSaving || !diagramId || !content.trim() || !enabled || !canSave) return;
    
    setIsSaving(true);
    setSaveError(null);

    const token = Cookies.get('diagrammer_token');
    if (!token) {
      console.error('[Save] Token manquant');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/diagrammes/${diagramId}/save-github`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contenu: content }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      lastContentRef.current = content;
      setLastSaved(new Date());
      setSaveError(null);
      console.log(`Saved to GitHub:`, result.path);

      // Cooldown de 5 secondes avant de repouvoir sauvegarder
      setCanSave(false);
      setTimeout(() => setCanSave(true), 5000);
    } catch (error: any) {
      console.error(`GitHub save failed:`, error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }, [diagramId, content, enabled, isSaving]);

  return {
    manualSave,
    lastSaved,
    isSaving,
    saveError,
    canSave,
    hasUnsavedChanges: content !== lastContentRef.current && content.trim() !== '',
  };
}
