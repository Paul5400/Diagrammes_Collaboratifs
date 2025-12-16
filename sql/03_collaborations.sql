CREATE TABLE IF NOT EXISTS collaborations (
    id_collaboration UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utilisateur UUID NOT NULL,
    id_diagramme UUID NOT NULL,
    droit VARCHAR(20) NOT NULL CHECK (droit IN ('lecture', 'ecriture')) DEFAULT 'lecture',
    date_ajout TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_collaboration_utilisateur FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateurs(id_utilisateur) 
        ON DELETE CASCADE,
    CONSTRAINT fk_collaboration_diagramme FOREIGN KEY (id_diagramme) 
        REFERENCES diagrammes(id_diagramme) 
        ON DELETE CASCADE,
    CONSTRAINT unique_utilisateur_diagramme UNIQUE (id_utilisateur, id_diagramme)
);
