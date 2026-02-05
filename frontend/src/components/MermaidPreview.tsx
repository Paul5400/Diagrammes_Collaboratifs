"use client";

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useDiagramPanZoom } from '@/hooks/useDiagramPanZoom';

mermaid.initialize({
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
});

interface MermaidPreviewProps {
    code: string;
}

export function MermaidPreview({ code }: MermaidPreviewProps) {
    const [svg, setSvg] = useState<string>('');
    const {
        zoom, pan, handleMouseDown, handleMouseMove, handleMouseUp,
        reset, zoomIn, zoomOut
    } = useDiagramPanZoom();

    useEffect(() => {
        const renderDiagram = async () => {
            if (!code.trim()) {
                setSvg('');
                return;
            }

            try {
                // Valider d'abord
                const isValid = await mermaid.parse(code, { suppressErrors: true });
                if (!isValid) return;

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg: renderedSvg } = await mermaid.render(id, code);

                // Vérifier si le SVG généré contient une erreur
                if (renderedSvg.includes('class="error-icon"') || renderedSvg.includes('Syntax error')) {
                    return;
                }

                setSvg(renderedSvg);
            } catch (err: any) {
                // On ne change rien au SVG pour garder le dernier état valide
            }
        };

        const timeout = setTimeout(renderDiagram, 150);
        return () => clearTimeout(timeout);
    }, [code]);

    return (
        <div className="relative flex-1 bg-[var(--bg-page)] overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>

            {/* Grille de points */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`
                }}
            />

            <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
            />

            {/* Controls */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#161618]/80 backdrop-blur-md p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xl">
                <button
                    onClick={zoomOut}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"><ZoomOut size={16} /></button>
                <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
                <button
                    onClick={zoomIn}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"><ZoomIn size={16} /></button>
                <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
                <button
                    onClick={reset}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"><Maximize2 size={16} /></button>
            </div>
        </div>
    );
}
