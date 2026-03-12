'use client';

import React, { useEffect, useState, useCallback, useDeferredValue } from 'react';
import mermaid from 'mermaid';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useDiagramPanZoom } from '@/hooks/useDiagramPanZoom';
import { MermaidCode } from '@/types/DiagramTypes';
import { APP_CONFIG } from '@/config/AppConfig';

/**
 * CONFIGURATION STATIQUE : MERMAID
 * On configure le moteur de rendu Mermaid avec un thème sombre personnalisé
 * pour qu'il s'intègre parfaitement à l'UI.
 */
const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark' as const,
  suppressErrorConsole: true,
  themeVariables: {
    primaryColor: '#7c3aed',
    primaryTextColor: '#fff',
    primaryBorderColor: '#7c3aed',
    lineColor: '#52525b',
    secondaryColor: '#161618',
    tertiaryColor: '#0f0f11',
    mainBkg: '#161618',
    nodeBorder: '#27272a',
    clusterBkg: '#0f0f11',
    titleColor: '#fff',
    actorBkg: '#161618',
    actorBorder: '#7c3aed',
    actorLineColor: '#52525b',
    signalColor: '#fff',
    signalTextColor: '#fff',
    labelBoxBkgColor: '#161618',
    labelBoxBorderColor: '#27272a',
    loopBkgColor: '#161618',
    noteBkgColor: '#27272a',
    noteBorderColor: '#52525b',
    noteTextColor: '#fff',
  },
  securityLevel: 'loose' as const,
  fontFamily: 'Inter, sans-serif' as const,
};

// Initialisation globale de Mermaid
mermaid.initialize(MERMAID_CONFIG);

interface MermaidPreviewProps {
  mermaidCodeSource: MermaidCode; // Le code texte Mermaid à transformer en SVG
  onRender?: (svgContent: string) => void;
}

/**
 * COMPOSANT : MermaidPreview
 * Responsable du rendu visuel du diagramme.
 * Gère également les interactions de Zoom et de Déplacement (Pan).
 */
export const MermaidPreview = React.memo(function MermaidPreview(props: MermaidPreviewProps) {
  // On utilise useDeferredValue pour que React donne la priorité à la frappe de l'utilisateur
  // par rapport au rendu lourd du SVG Mermaid.
  const deferredMermaidSourceCode = useDeferredValue(props.mermaidCodeSource);
  const onRenderCallback = props.onRender;

  // --- ERROR HANDLING: Content Too Large ---
  const errorMatch = props.mermaidCodeSource.match(/^%%_ERROR_TOO_LARGE_([\d.]+)_%%/);
  if (errorMatch) {
      const sizeMB = errorMatch[1];
      return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] text-white p-8 text-center select-none">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-400 mb-2">Contenu trop volumineux</h3>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                      Le diagramme pèse <strong className="text-white">{sizeMB} MB</strong>, ce qui dépasse la limite de sécurité.
                      L'affichage a été désactivé pour protéger votre navigateur.
                  </p>
                  <div className="text-xs text-zinc-600 font-mono bg-[#000000]/50 p-3 rounded border border-red-500/10">
                      ERR_PAYLOAD_TOO_LARGE
                  </div>
              </div>
          </div>
      );
  }

  // État contenant le code SVG généré par Mermaid
  const [renderedSvgMarkupContent, setRenderedSvgMarkupContent] =
    useState<string>('');

  // Hook personnalisé pour gérer la manipulation de la souris (zoom/déplacement)
  const diagramInteractions = useDiagramPanZoom();

  // Extraction manuelle des outils d'interaction
  const zoom = diagramInteractions.zoom;
  const pan = diagramInteractions.pan;
  const handleMouseDown = diagramInteractions.handleMouseDown;
  const handleMouseMove = diagramInteractions.handleMouseMove;
  const handleMouseUp = diagramInteractions.handleMouseUp;
  const zoomIn = diagramInteractions.zoomIn;
  const zoomOut = diagramInteractions.zoomOut;
  const reset = diagramInteractions.reset;

  /**
   * FONCTION : generateAsynchronousMermaidSvg
   * Convertit le texte brut en SVG de manière asynchrone.
   * @param rawMermaidCode Le code source du diagramme
   */
  const generateAsynchronousMermaidSvg = useCallback(
    async (rawMermaidCode: MermaidCode) => {
      // Ignorer si c'est le marqueur d'erreur
      if (!rawMermaidCode.trim() || rawMermaidCode.startsWith('%%_ERROR_TOO_LARGE_')) {
        setRenderedSvgMarkupContent('');
        return;
      }
      
      try {
        // 1. On vérifie si Mermaid arrive à lire le code (sans planter)
        const isSyntaxValid = await mermaid.parse(rawMermaidCode, {
          suppressErrors: true,
        });
        if (!isSyntaxValid) return;

        // 2. On génère un ID unique pour éviter les conflits de cache SVG
        const uniqueSvgContainerId = `mermaid-svg-container-${Math.random().toString(36).substring(2, 11)}`;

        // 3. Demande à Mermaid de générer le rendu SVG
        const { svg: generatedSvgOutput } = await mermaid.render(
          uniqueSvgContainerId,
          rawMermaidCode
        );

        // 4. On ignore le résultat si Mermaid a généré une erreur visuelle interne
        if (
          generatedSvgOutput.includes('class="error-icon"') ||
          generatedSvgOutput.includes('Syntax error')
        ) {
          return;
        }

        // Mise à jour de l'affichage graphique
        setRenderedSvgMarkupContent(generatedSvgOutput);

        // Notification au parent
        if (onRenderCallback) {
          onRenderCallback(generatedSvgOutput);
        }
      } catch (renderingProcessError) {
        // En silence pour éviter de saccader l'UI pendant que l'utilisateur tape
        console.debug(
          'Mermaid render error (ignored for stability):',
          renderingProcessError
        );
      }
    },
    [onRenderCallback]
  );

  /**
   * EFFET : Mise à jour avec Debounce
   * Pour éviter de recalculer le diagramme à chaque touche (trop lourd),
   * on attend que l'utilisateur arrête de taper pendant un temps défini.
   */
  useEffect(() => {
    const debounceUpdateTimer = setTimeout(
      () => generateAsynchronousMermaidSvg(deferredMermaidSourceCode),
      APP_CONFIG.RENDER_DEBOUNCE_MS
    );
    return () => clearTimeout(debounceUpdateTimer);
  }, [deferredMermaidSourceCode, generateAsynchronousMermaidSvg]);

  return (
    <div
      className="relative flex-1 bg-[var(--bg-page)] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* GRILLE D'ARRIÈRE-PLAN : Esthétique "Blueprint" */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`,
          willChange: 'transform',
        }}
      />

      {/* CONTENEUR DU SVG : Applique le Zoom et le Pan via transform CSS */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out [&>svg]:max-w-none [&>svg]:max-h-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
        dangerouslySetInnerHTML={{ __html: renderedSvgMarkupContent }}
      />

      {/* BARRE D'OUTILS (Zoom +, Zoom -, Reset) */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#161618]/80 backdrop-blur-md p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xl">
        <ControlButton onClick={zoomOut} icon={<ZoomOut size={16} />} />
        <Divider />
        <ControlButton onClick={zoomIn} icon={<ZoomIn size={16} />} />
        <Divider />
        <ControlButton onClick={reset} icon={<Maximize2 size={16} />} />
      </div>
    </div>
  );
});

/**
 * COMPOSANT INTERNE : ControlButton
 * Un bouton stylisé pour la barre d'outils
 */
const ControlButton = React.memo(({
  onClick,
  icon,
}: {
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white transition-all active:scale-95"
  >
    {icon}
  </button>
));

const Divider = React.memo(() => <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />);
