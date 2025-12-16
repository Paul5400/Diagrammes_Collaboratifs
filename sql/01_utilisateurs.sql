CREATE TABLE IF NOT EXISTS utilisateurs (
    id_utilisateur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('utilisateur', 'admin')) DEFAULT 'utilisateur',
    date_inscription TIMESTAMP NOT NULL DEFAULT NOW()
);
