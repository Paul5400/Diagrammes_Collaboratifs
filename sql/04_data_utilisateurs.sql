-- ================================
-- DONNÉES DE TEST - UTILISATEURS
-- ================================

INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Dupont', 'Jean', 'jean.dupont@example.com', 'hashed_password_123', 'utilisateur'),
('Martin', 'Sophie', 'sophie.martin@example.com', 'hashed_password_456', 'utilisateur'),
('Admin', 'Super', 'admin@example.com', 'hashed_password_admin', 'admin')
ON CONFLICT (email) DO NOTHING;
