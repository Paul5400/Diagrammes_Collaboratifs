import { editor } from "monaco-editor";

/**
 * CONFIGURATION : MONACO_EDITOR_CONFIGURATION_OPTIONS
 * Définit les options de l'éditeur Monaco pour garantir une expérience utilisateur
 * fluide, moderne et adaptée à l'édition de code Mermaid.
 */
export const MONACO_EDITOR_CONFIGURATION_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },               // Désactive le mini-aperçu (peu utile pour des diagrammes courts)
    fontSize: 13,
    fontFamily: 'monospace',                   // Police monospace moderne
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,               // Empêche le scroll infini vers le bas
    readOnly: false,
    automaticLayout: true,                     // Redimensionnement auto lors des changements de taille
    padding: { top: 20 },                      // Espace en haut pour l'esthétique
    cursorSmoothCaretAnimation: "on",          // Animation fluide du curseur
    smoothScrolling: true,
    contextmenu: false,                        // Désactive le menu contextuel par défaut de Monaco
    lineHeight: 20,
    renderValidationDecorations: 'on',
    wordWrap: 'off',
    wrappingStrategy: 'advanced',
};
