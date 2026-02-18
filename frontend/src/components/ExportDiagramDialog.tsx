import React, { useState } from 'react';
import { X, Copy, Download, Code, Image as ImageIcon, Check } from 'lucide-react';
import { MermaidCode } from '@/types/DiagramTypes';

interface ExportDiagramDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mermaidCode: MermaidCode;
    svgContent?: string;
    diagramName: string;
}

export function ExportDiagramDialog({
    isOpen,
    onClose,
    mermaidCode,
    svgContent,
    diagramName,
}: ExportDiagramDialogProps) {
    const [activeTab, setActiveTab] = useState<'png' | 'code'>('png');
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(mermaidCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code', err);
        }
    };

    const handleDownloadCode = () => {
        const blob = new Blob([mermaidCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${diagramName.replace(/\s+/g, '_')}.mmd`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPng = async () => {
        if (!svgContent) return;

        return new Promise<void>((resolve, reject) => {
            const img = new Image();

            // Create a Blob from the SVG content
            // We ensure charset is specified
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.src = url;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject('Canvas context not available');
                    return;
                }

                // Get dimensions from SVG attributes or viewBox for more reliability
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');

                let width = img.width || 800;
                let height = img.height || 600;

                if (svgElement) {
                    const viewBox = svgElement.viewBox.baseVal;
                    if (viewBox && viewBox.width && viewBox.height) {
                        width = viewBox.width;
                        height = viewBox.height;
                    } else {
                        // Fallback to attributes if viewBox is missing
                        const attrWidth = parseFloat(svgElement.getAttribute('width') || '0');
                        const attrHeight = parseFloat(svgElement.getAttribute('height') || '0');
                        if (attrWidth > 0) width = attrWidth;
                        if (attrHeight > 0) height = attrHeight;
                    }
                }

                const scale = 2; // Reduced to 2 for better compatibility with huge diagrams
                canvas.width = width * scale;
                canvas.height = height * scale;

                // Dark background
                ctx.fillStyle = '#161618';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, width, height);

                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `${diagramName.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
                resolve();
            };

            img.onerror = (e) => {
                console.error("Error loading SVG for export", e);
                URL.revokeObjectURL(url);
                reject(e);
            };
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0f0f11] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                    <h2 className="text-lg font-semibold text-white">Exporter le diagramme</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-subtle)]">
                    <button
                        onClick={() => setActiveTab('png')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'png'
                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
                            }`}
                    >
                        Image (PNG)
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'code'
                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
                            }`}
                    >
                        Code (Mermaid)
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'png' ? (
                        <div className="space-y-4">
                            <div className="h-[400px] relative border border-[var(--border-subtle)] rounded-lg bg-[#1a1a1d] overflow-hidden">
                                {svgContent ? (
                                    <div
                                        className="absolute inset-6 flex items-center justify-center transition-all [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:block [&>svg]:mx-auto"
                                        dangerouslySetInnerHTML={{ __html: svgContent }}
                                    />
                                ) : (
                                    <span className="text-[var(--text-secondary)]">Génération de l'aperçu...</span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] text-center">
                                Téléchargez une image haute résolution de votre diagramme.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <pre className="w-full h-[200px] p-4 rounded-lg bg-[#1a1a1d] border border-[var(--border-subtle)] text-xs text-zinc-300 font-mono overflow-auto custom-scrollbar">
                                    {mermaidCode}
                                </pre>
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="absolute top-2 right-2 p-2 rounded-md bg-[#0f0f11] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white transition-colors"
                                    title="Copier"
                                >
                                    {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] text-center">
                                Copiez le code source ou téléchargez le fichier .mmd.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[#0f0f11]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                        Annuler
                    </button>

                    {activeTab === 'png' ? (
                        <button
                            onClick={handleDownloadPng}
                            disabled={!svgContent}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_var(--accent-glow)]"
                        >
                            <Download size={16} />
                            Télécharger PNG
                        </button>
                    ) : (
                        <button
                            onClick={handleDownloadCode}
                            disabled={!mermaidCode}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_var(--accent-glow)]"
                        >
                            <Code size={16} />
                            Télécharger .mmd
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
