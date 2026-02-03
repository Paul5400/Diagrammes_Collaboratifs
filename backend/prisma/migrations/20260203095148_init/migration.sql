-- CreateEnum
CREATE TYPE "Role" AS ENUM ('utilisateur', 'admin');

-- CreateEnum
CREATE TYPE "TypeDiagramme" AS ENUM ('uml', 'sequence', 'flux', 'activite', 'classe', 'mermaid', 'plantuml', 'autre');

-- CreateEnum
CREATE TYPE "Droit" AS ENUM ('lecture', 'ecriture');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id_utilisateur" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" VARCHAR(50) NOT NULL,
    "prenom" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'utilisateur',
    "date_inscription" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id_utilisateur")
);

-- CreateTable
CREATE TABLE "diagrammes" (
    "id_diagramme" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_proprietaire" UUID NOT NULL,
    "titre" VARCHAR(100) NOT NULL,
    "type" "TypeDiagramme" NOT NULL,
    "chemin_git" VARCHAR(255),
    "lien_partage" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagrammes_pkey" PRIMARY KEY ("id_diagramme")
);

-- CreateTable
CREATE TABLE "collaborations" (
    "id_collaboration" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "id_diagramme" UUID NOT NULL,
    "droit" "Droit" NOT NULL DEFAULT 'lecture',
    "date_ajout" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborations_pkey" PRIMARY KEY ("id_collaboration")
);

-- CreateTable
CREATE TABLE "github_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "github_id" TEXT NOT NULL,
    "username" VARCHAR(150),
    "email" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "access_token" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "github_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "diagrammes_lien_partage_key" ON "diagrammes"("lien_partage");

-- CreateIndex
CREATE UNIQUE INDEX "collaborations_id_utilisateur_id_diagramme_key" ON "collaborations"("id_utilisateur", "id_diagramme");

-- CreateIndex
CREATE UNIQUE INDEX "github_users_github_id_key" ON "github_users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_users_email_key" ON "github_users"("email");

-- AddForeignKey
ALTER TABLE "diagrammes" ADD CONSTRAINT "diagrammes_id_proprietaire_fkey" FOREIGN KEY ("id_proprietaire") REFERENCES "utilisateurs"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateurs"("id_utilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_id_diagramme_fkey" FOREIGN KEY ("id_diagramme") REFERENCES "diagrammes"("id_diagramme") ON DELETE CASCADE ON UPDATE CASCADE;
