"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
    theme: 'dark',
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
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
};

// Initialisation globale de Mermaid
mermaid.initialize(MERMAID_CONFIG);

interface MermaidPreviewProps {
    mermaidCodeSource: MermaidCode; // Le code texte Mermaid à transformer en SVG
}

/**
 * COMPOSANT : MermaidPreview
 * Responsable du rendu visuel du diagramme.
 * Gère également les interactions de Zoom et de Déplacement (Pan).
 */
export function MermaidPreview(props: MermaidPreviewProps) {
    // On reçoit l'unique objet 'props' et on récupère le code manuellement
    const currentMermaidSourceCode = props.mermaidCodeSource;

    // État contenant le code SVG généré par Mermaid
    const [renderedSvgMarkupContent, setRenderedSvgMarkupContent] = useState<string>('');

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
    const generateAsynchronousMermaidSvg = useCallback(async (rawMermaidCode: MermaidCode) => {
        if (!rawMermaidCode.trim()) {
            setRenderedSvgMarkupContent('');
            return;
        }

        try {
            // 1. On vérifie si Mermaid arrive à lire le code (sans planter)
            const isSyntaxValid = await mermaid.parse(rawMermaidCode, { suppressErrors: true });
            if (!isSyntaxValid) return;

            // 2. On génère un ID unique pour éviter les conflits de cache SVG
            const uniqueSvgContainerId = `mermaid-svg-container-${Math.random().toString(36).substring(2, 11)}`;

            // 3. Demande à Mermaid de générer le rendu SVG
            const { svg: generatedSvgOutput } = await mermaid.render(uniqueSvgContainerId, rawMermaidCode);

            // 4. On ignore le résultat si Mermaid a généré une erreur visuelle interne
            if (generatedSvgOutput.includes('class="error-icon"') || generatedSvgOutput.includes('Syntax error')) {
                return;
            }

            // Mise à jour de l'affichage graphique
            setRenderedSvgMarkupContent(generatedSvgOutput);
        } catch (renderingProcessError) {
            // En silence pour éviter de saccader l'UI pendant que l'utilisateur tape
            console.debug('Mermaid render error (ignored for stability):', renderingProcessError);
        }
    }, []);

    /**
     * EFFET : Mise à jour avec Debounce
     * Pour éviter de recalculer le diagramme à chaque touche (trop lourd),
     * on attend que l'utilisateur arrête de taper pendant un temps défini.
     */
    useEffect(() => {
        const debounceUpdateTimer = setTimeout(() => generateAsynchronousMermaidSvg(currentMermaidSourceCode), APP_CONFIG.RENDER_DEBOUNCE_MS);
        return () => clearTimeout(debounceUpdateTimer);
    }, [currentMermaidSourceCode, generateAsynchronousMermaidSvg]);

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
                    backgroundImage: 'radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`
                }}
            />

            {/* CONTENEUR DU SVG : Applique le Zoom et le Pan via transform CSS */}
            <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
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
}

/**
 * COMPOSANT INTERNE : ControlButton
 * Un bouton stylisé pour la barre d'outils
 */
const ControlButton = ({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white transition-all"
    >
        {icon}
    </button>
);

/**
 * COMPOSANT INTERNE : Divider
 * Simple séparateur vertical
 */
const Divider = () => <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />;
