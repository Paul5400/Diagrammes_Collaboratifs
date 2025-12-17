-- ================================
-- DONNÉES DE TEST - DIAGRAMMES
-- ================================

-- Diagramme 1 : Architecture du système (Jean - Public)
INSERT INTO diagrammes (titre, type, id_proprietaire, public, chemin_git) 
SELECT 
    'Architecture du système',
    'uml',
    id_utilisateur,
    TRUE,
    'https://github.com/jeandupont/architecture-diagram'
FROM utilisateurs WHERE email = 'jean.dupont@example.com'
ON CONFLICT DO NOTHING;

-- Diagramme 2 : Diagramme de séquence - Auth (Jean - Privé)
INSERT INTO diagrammes (titre, type, id_proprietaire, public, chemin_git)
SELECT 
    'Diagramme de séquence - Auth',
    'sequence',
    id_utilisateur,
    FALSE,
    'https://github.com/jeandupont/auth-sequence'
FROM utilisateurs WHERE email = 'jean.dupont@example.com'
ON CONFLICT DO NOTHING;

-- Diagramme 3 : Flow utilisateur (Sophie - Public)
INSERT INTO diagrammes (titre, type, id_proprietaire, public, chemin_git)
SELECT 
    'Flow utilisateur',
    'mermaid',
    id_utilisateur,
    TRUE,
    'https://github.com/sophiemartin/user-flow'
FROM utilisateurs WHERE email = 'sophie.martin@example.com'
ON CONFLICT DO NOTHING;

-- Diagramme 4 : Diagramme de classes (Sophie - Privé)
INSERT INTO diagrammes (titre, type, id_proprietaire, public)
SELECT 
    'Diagramme de classes',
    'classe',
    id_utilisateur,
    FALSE
FROM utilisateurs WHERE email = 'sophie.martin@example.com'
ON CONFLICT DO NOTHING;

-- Diagramme 5 : Infrastructure PlantUML (Admin - Public)
INSERT INTO diagrammes (titre, type, id_proprietaire, public, chemin_git)
SELECT 
    'Infrastructure PlantUML',
    'plantuml',
    id_utilisateur,
    TRUE,
    'https://github.com/admin/infrastructure'
FROM utilisateurs WHERE email = 'admin@example.com'
ON CONFLICT DO NOTHING;
