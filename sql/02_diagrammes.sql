CREATE TABLE IF NOT EXISTS diagrammes (
    id_diagramme UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proprietaire UUID NOT NULL,
    titre VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('uml', 'sequence', 'flux', 'activite', 'classe', 'mermaid', 'plantuml', 'autre')),
    chemin_git VARCHAR(255),
    lien_partage UUID UNIQUE DEFAULT gen_random_uuid(),
    public BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_proprietaire FOREIGN KEY (id_proprietaire) 
        REFERENCES utilisateurs(id_utilisateur) 
        ON DELETE CASCADE
);
