# Documentation des Composants - Éditeur de Diagrammes Collaboratifs

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des composants](#architecture-des-composants)
3. [Composants principaux](#composants-principaux)
4. [Hooks personnalisés](#hooks-personnalisés)
5. [Flux de données](#flux-de-données)
6. [Diagrammes et templates](#diagrammes-et-templates)

---

## 🎯 Vue d'ensemble

Cette application est un **éditeur de diagrammes Mermaid collaboratif en temps réel**. Elle permet à plusieurs utilisateurs de modifier simultanément un diagramme et de voir les changements en direct grâce à la technologie **Yjs** et **Hocuspocus**.

### Technologies utilisées

- **React** avec Next.js (App Router)
- **Monaco Editor** - L'éditeur de code de VS Code
- **Mermaid.js** - Génération de diagrammes à partir de texte
- **Yjs** - CRDT (Conflict-free Replicated Data Type) pour la collaboration
- **Hocuspocus** - Provider WebSocket pour Yjs
- **TypeScript** - Typage statique

---

## 🏗️ Architecture des composants

```
DiagramEditor (Composant racine)
├── EditorHeader (En-tête avec templates)
├── CollaborativeEditor (Éditeur de code)
│   ├── Monaco Editor
│   ├── useYjs (Synchronisation collaborative)
│   └── useMermaidValidation (Validation syntaxe)
└── MermaidPreview (Prévisualisation)
    └── useDiagramPanZoom (Zoom et pan)
```

---

## 📦 Composants principaux

### 1. `DiagramEditor.tsx` - Le composant racine

**Rôle** : Orchestrer l'ensemble de l'interface de l'éditeur

#### Structure

```tsx
export function DiagramEditor({ id }: DiagramEditorProps)
```

#### Responsabilités

1. **Gestion de l'état du code**
   - Maintient le code Mermaid actuel dans `code` (state)
   - Fournit un code par défaut (`DEFAULT_CODE`)

2. **Coordination des composants**
   - Affiche l'en-tête (`EditorHeader`)
   - Gère l'éditeur collaboratif (`CollaborativeEditor`)
   - Affiche la prévisualisation (`MermaidPreview`)

3. **Gestion des templates**
   - Utilise une référence (`editorRef`) pour accéder aux méthodes de `CollaborativeEditor`
   - Permet de charger un template via `setContent()`

#### Layout

- **Split-screen** : 45% éditeur / 55% prévisualisation
- Hauteur plein écran (`h-screen`)
- Bordure entre les deux panneaux

#### Code clé

```tsx
const editorRef = React.useRef<CollaborativeEditorRef>(null);

// Chargement d'un template
onSelectTemplate={(t) => {
    if (editorRef.current) {
        editorRef.current.setContent(t.code);
    }
}}
```

---

### 2. `CollaborativeEditor.tsx` - L'éditeur collaboratif

**Rôle** : Fournir un éditeur de code Monaco avec synchronisation collaborative en temps réel

#### Interface

```tsx
interface CollaborativeEditorProps {
    id: string;              // ID unique du document
    onChange: (value: string | undefined) => void;  // Callback de changement
    defaultValue?: string;   // Valeur initiale
}
```

#### Fonctionnalités principales

1. **Intégration Monaco Editor**
   - Éditeur de code professionnel (celui de VS Code)
   - Langage personnalisé "mermaid"
   - Thème sombre (`vs-dark`)

2. **Collaboration en temps réel**
   - Hook `useYjs` pour synchroniser le contenu entre utilisateurs
   - Binding entre Monaco et Yjs

3. **Validation syntaxique**
   - Hook `useMermaidValidation` pour valider le code Mermaid
   - Affichage des erreurs directement dans l'éditeur

4. **Autocomplétion**
   - Suggestions de mots-clés Mermaid
   - Basé sur `MERMAID_KEYWORDS`

#### Configuration Monaco

```tsx
options={{
    minimap: { enabled: false },           // Pas de minimap
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,                 // Redimensionnement auto
    padding: { top: 20 },
    cursorSmoothCaretAnimation: "on",      // Animation fluide
    smoothScrolling: true,
    contextmenu: false,                    // Pas de menu contextuel
    lineHeight: 1.6,
}}
```

#### Autocomplétion personnalisée

```tsx
monacoInstance.languages.registerCompletionItemProvider('mermaid', {
    provideCompletionItems: (model, position) => {
        const suggestions = MERMAID_KEYWORDS.map(k => ({
            label: k,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: { /* ... */ }
        }));
        return { suggestions };
    }
});
```

#### Méthodes exposées (via ref)

```tsx
export interface CollaborativeEditorRef {
    setContent: (content: string) => void;  // Changer le contenu
}
```

---

### 3. `MermaidPreview.tsx` - La prévisualisation

**Rôle** : Afficher le rendu visuel du diagramme Mermaid avec contrôles de zoom/pan

#### Props

```tsx
interface MermaidPreviewProps {
    code: string;  // Code Mermaid à afficher
}
```

#### Fonctionnalités

1. **Rendu Mermaid**
   - Conversion du code en SVG
   - Validation avant rendu
   - Gestion des erreurs (garde le dernier état valide)

2. **Contrôles interactifs**
   - Zoom in/out
   - Pan (déplacement par glisser-déposer)
   - Reset (retour à la vue initiale)

3. **Interface visuelle**
   - Grille de points en arrière-plan
   - Contrôles flottants en bas à droite
   - Thème sombre personnalisé

#### Configuration Mermaid

```tsx
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    suppressErrorConsole: true,
    themeVariables: {
        primaryColor: '#7c3aed',      // Violet
        primaryTextColor: '#fff',
        lineColor: '#52525b',         // Gris
        mainBkg: '#161618',           // Fond sombre
        // ... autres variables de thème
    },
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});
```

#### Processus de rendu

```tsx
useEffect(() => {
    const renderDiagram = async () => {
        if (!code.trim()) {
            setSvg('');
            return;
        }

        try {
            // 1. Validation
            const isValid = await mermaid.parse(code, { suppressErrors: true });
            if (!isValid) return;

            // 2. Génération du SVG
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            const { svg: renderedSvg } = await mermaid.render(id, code);

            // 3. Vérification d'erreurs dans le SVG
            if (renderedSvg.includes('class="error-icon"') || 
                renderedSvg.includes('Syntax error')) {
                return;
            }

            setSvg(renderedSvg);
        } catch (err: any) {
            // Garde le dernier état valide
        }
    };

    // Debounce de 150ms
    const timeout = setTimeout(renderDiagram, 150);
    return () => clearTimeout(timeout);
}, [code]);
```

#### Grille de fond

```tsx
<div
    className="absolute inset-0 opacity-10"
    style={{
        backgroundImage: 'radial-gradient(circle, var(--text-secondary) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`  // Suit le pan
    }}
/>
```

---

### 4. `DiagramTemplates.ts` - Les templates

**Rôle** : Fournir des exemples de diagrammes prêts à l'emploi

#### Interface

```tsx
export interface DiagramTemplate {
    id: string;      // Identifiant unique
    label: string;   // Nom affiché
    icon: string;    // Emoji pour l'icône
    code: string;    // Code Mermaid du template
}
```

#### Templates disponibles

1. **Sequence Diagram** (↕️)
   - Diagramme de séquence
   - Interactions entre User, System, Database

2. **Flowchart** (⇶)
   - Organigramme
   - Décisions et flux

3. **Class Diagram** (📦)
   - Diagramme de classes UML
   - Héritage et relations

4. **State Diagram** (🔄)
   - Diagramme d'états
   - Transitions

5. **ER Diagram** (🗄️)
   - Diagramme entité-relation
   - Modélisation de base de données

6. **Gantt Chart** (📅)
   - Diagramme de Gantt
   - Planification de projet

7. **Mindmap** (🧠)
   - Carte mentale
   - Organisation d'idées

#### Exemple de template

```tsx
{
    id: 'sequence',
    label: 'Sequence Diagram',
    icon: '↕️',
    code: `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token`
}
```

---

## 🔧 Hooks personnalisés

### 1. `useYjs` - Synchronisation collaborative

**Rôle** : Gérer la synchronisation en temps réel du contenu de l'éditeur

#### Signature

```tsx
export function useYjs(id: string, editor: any)
```

#### Fonctionnement

1. **Création du document Yjs**
   ```tsx
   const ydoc = new Y.Doc();
   ```

2. **Connexion au serveur WebSocket**
   ```tsx
   const provider = new HocuspocusProvider({
       url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002',
       name: `diagram-${id}`,  // Nom unique du document
       document: ydoc,
   });
   ```

3. **Binding avec Monaco**
   ```tsx
   const type = ydoc.getText('monaco_content');
   const binding = new MonacoBinding(
       type,
       editor.getModel()!,
       new Set([editor]),
       provider.awareness  // Curseurs des autres utilisateurs
   );
   ```

4. **Méthode setContent**
   ```tsx
   const setContent = (content: string) => {
       if (ytext) {
           ytext.delete(0, ytext.length);  // Supprime tout
           ytext.insert(0, content);        // Insère le nouveau contenu
       }
   };
   ```

#### Nettoyage

```tsx
return () => {
    provider.destroy();
    binding.destroy();
};
```

---

### 2. `useMermaidValidation` - Validation syntaxique

**Rôle** : Valider le code Mermaid et afficher les erreurs dans l'éditeur

#### Signature

```tsx
export function useMermaidValidation(editor: any, monaco: any)
```

#### Processus de validation

1. **Validation avec Mermaid**
   ```tsx
   await mermaid.parse(content, { suppressErrors: true });
   ```

2. **Création de marqueurs d'erreur**
   ```tsx
   const markers = [{
       severity: monaco.MarkerSeverity.Error,
       message: errorMsg,
       startLineNumber: 1,
       startColumn: 1,
       endLineNumber: editor.getModel()!.getLineCount(),
       endColumn: 1000,
   }];
   ```

3. **Extraction du numéro de ligne**
   ```tsx
   const match = errorMsg.match(/line (\d+)/i);
   if (match && match[1]) {
       const line = parseInt(match[1], 10);
       markers[0].startLineNumber = line;
       markers[0].endLineNumber = line;
   }
   ```

4. **Debouncing**
   - Délai de 500ms avant validation
   - Évite les validations trop fréquentes

---

### 3. `useDiagramPanZoom` - Contrôles de vue

**Rôle** : Gérer le zoom et le déplacement (pan) du diagramme

#### État géré

```tsx
const [zoom, setZoom] = useState(1);              // Niveau de zoom (0.1 à 5)
const [pan, setPan] = useState({ x: 0, y: 0 });   // Position du pan
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
```

#### Fonctions exposées

1. **handleMouseDown** - Début du drag
   ```tsx
   const handleMouseDown = useCallback((e: React.MouseEvent) => {
       setIsDragging(true);
       setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
   }, [pan.x, pan.y]);
   ```

2. **handleMouseMove** - Déplacement
   ```tsx
   const handleMouseMove = useCallback((e: React.MouseEvent) => {
       if (!isDragging) return;
       setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
   }, [isDragging, dragStart.x, dragStart.y]);
   ```

3. **handleMouseUp** - Fin du drag
   ```tsx
   const handleMouseUp = useCallback(() => {
       setIsDragging(false);
   }, []);
   ```

4. **Contrôles de zoom**
   ```tsx
   const zoomIn = useCallback(() => setZoom(z => Math.min(5, z + 0.1)), []);
   const zoomOut = useCallback(() => setZoom(z => Math.max(0.1, z - 0.1)), []);
   const reset = useCallback(() => {
       setZoom(1);
       setPan({ x: 0, y: 0 });
   }, []);
   ```

---

## 🔄 Flux de données

### 1. Flux de modification du code

```
Utilisateur tape dans Monaco
    ↓
Monaco onDidChangeModelContent
    ↓
Yjs synchronise via WebSocket
    ↓
Autres utilisateurs reçoivent la mise à jour
    ↓
onChange() appelé dans DiagramEditor
    ↓
setCode() met à jour l'état
    ↓
MermaidPreview reçoit le nouveau code
    ↓
Rendu du diagramme (après 150ms debounce)
```

### 2. Flux de validation

```
Contenu de l'éditeur change
    ↓
useMermaidValidation détecte le changement
    ↓
Debounce de 500ms
    ↓
mermaid.parse() valide la syntaxe
    ↓
Si erreur : création de marqueurs Monaco
    ↓
Affichage de l'erreur dans l'éditeur
```

### 3. Flux de sélection de template

```
Utilisateur clique sur un template
    ↓
EditorHeader appelle onSelectTemplate()
    ↓
DiagramEditor utilise editorRef.current.setContent()
    ↓
CollaborativeEditor expose setContent via useImperativeHandle
    ↓
useYjs.setContent() modifie le document Yjs
    ↓
Yjs synchronise le changement
    ↓
Monaco affiche le nouveau contenu
```

---

## 🎨 Personnalisation et thème

### Couleurs principales

- **Primaire** : `#7c3aed` (Violet)
- **Fond page** : `#050505` / `#0c0c0e`
- **Fond éléments** : `#161618`
- **Bordures** : `#27272a` / `#52525b`
- **Texte** : `#fff`

### Variables CSS utilisées

```css
--bg-page
--bg-hover
--border-subtle
--text-secondary
```

---

## 🚀 Points d'amélioration possibles

1. **Performance**
   - Mémorisation des composants avec `React.memo`
   - Optimisation du rendu SVG

2. **Fonctionnalités**
   - Export PNG/SVG
   - Historique des versions
   - Commentaires collaboratifs
   - Curseurs des autres utilisateurs visibles

3. **UX**
   - Raccourcis clavier
   - Mode plein écran
   - Thème clair/sombre switchable
   - Prévisualisation en temps réel sans debounce

4. **Accessibilité**
   - Labels ARIA
   - Navigation au clavier
   - Contraste amélioré

---

## 📚 Ressources

- [Mermaid.js Documentation](https://mermaid.js.org/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Hocuspocus](https://tiptap.dev/hocuspocus)

---

## 🎓 Concepts clés à retenir

1. **CRDT (Conflict-free Replicated Data Type)**
   - Yjs utilise des CRDT pour résoudre automatiquement les conflits
   - Permet la collaboration sans serveur central de résolution

2. **Debouncing**
   - Technique pour limiter la fréquence d'exécution d'une fonction
   - Utilisé pour la validation (500ms) et le rendu (150ms)

3. **Forward Ref**
   - `React.forwardRef` permet d'exposer des méthodes d'un composant enfant
   - Utilisé pour `setContent()` dans `CollaborativeEditor`

4. **Dynamic Import**
   - `next/dynamic` charge `CollaborativeEditor` côté client uniquement
   - Nécessaire car Monaco Editor ne fonctionne pas en SSR

5. **useImperativeHandle**
   - Hook pour personnaliser la valeur exposée via une ref
   - Permet de contrôler l'API publique d'un composant

---

*Documentation générée le 2026-02-05*
