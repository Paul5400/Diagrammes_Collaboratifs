-- ================================
-- DONNÉES DE TEST - COLLABORATIONS
-- ================================

-- Collaboration 1 : Sophie collabore sur "Architecture du système" de Jean (lecture)
INSERT INTO collaborations (id_utilisateur, id_diagramme, droit)
SELECT 
    u.id_utilisateur,
    d.id_diagramme,
    'lecture'
FROM utilisateurs u, diagrammes d
WHERE u.email = 'sophie.martin@example.com'
  AND d.titre = 'Architecture du système'
ON CONFLICT (id_utilisateur, id_diagramme) DO NOTHING;

-- Collaboration 2 : Sophie collabore sur "Diagramme de séquence - Auth" de Jean (écriture)
INSERT INTO collaborations (id_utilisateur, id_diagramme, droit)
SELECT 
    u.id_utilisateur,
    d.id_diagramme,
    'ecriture'
FROM utilisateurs u, diagrammes d
WHERE u.email = 'sophie.martin@example.com'
  AND d.titre = 'Diagramme de séquence - Auth'
ON CONFLICT (id_utilisateur, id_diagramme) DO NOTHING;

-- Collaboration 3 : Jean collabore sur "Flow utilisateur" de Sophie (écriture)
INSERT INTO collaborations (id_utilisateur, id_diagramme, droit)
SELECT 
    u.id_utilisateur,
    d.id_diagramme,
    'ecriture'
FROM utilisateurs u, diagrammes d
WHERE u.email = 'jean.dupont@example.com'
  AND d.titre = 'Flow utilisateur'
ON CONFLICT (id_utilisateur, id_diagramme) DO NOTHING;

-- Collaboration 4 : Admin a accès au "Diagramme de classes" de Sophie (lecture)
INSERT INTO collaborations (id_utilisateur, id_diagramme, droit)
SELECT 
    u.id_utilisateur,
    d.id_diagramme,
    'lecture'
FROM utilisateurs u, diagrammes d
WHERE u.email = 'admin@example.com'
  AND d.titre = 'Diagramme de classes'
ON CONFLICT (id_utilisateur, id_diagramme) DO NOTHING;
