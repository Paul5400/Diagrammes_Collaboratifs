import { Injectable, Logger, BadRequestException } from '@nestjs/common';

interface GithubRepo {
  name: string;
  owner: { login: string };
  html_url: string;
  full_name: string;
}

interface GithubUser {
  login: string;
}

interface GithubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

interface GithubFileContent {
  sha: string;
  content: string;
  encoding: string;
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly GITHUB_API = 'https://api.github.com';

  /**
   * Obtenir les informations de l'utilisateur GitHub
   */
  async getGithubUser(accessToken: string): Promise<GithubUser> {
    const response = await fetch(`${this.GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      this.logger.error(`Failed to get GitHub user: ${response.statusText}`);
      throw new BadRequestException('Impossible de récupérer les informations GitHub');
    }

    return response.json();
  }

  /**
   * Créer un dépôt GitHub
   */
  async createRepository(
    accessToken: string,
    repoName: string,
    description: string,
    isPrivate: boolean,
  ): Promise<{ owner: string; repo: string; url: string }> {
    const response = await fetch(`${this.GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: description || 'Projet créé avec Diagrammes Collaboratifs',
        private: isPrivate,
        auto_init: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`Failed to create repository: ${JSON.stringify(error)}`);
      
      if (response.status === 422 && error.errors?.some((e: any) => e.message?.includes('already exists'))) {
        throw new BadRequestException('Un dépôt avec ce nom existe déjà');
      }
      
      throw new BadRequestException('Impossible de créer le dépôt GitHub');
    }

    const repo: GithubRepo = await response.json();
    
    this.logger.log(`Repository created: ${repo.full_name}`);
    
    return {
      owner: repo.owner.login,
      repo: repo.name,
      url: repo.html_url,
    };
  }

  /**
   * Créer le fichier README initial dans le dépôt
   */
  async createInitialReadme(
    accessToken: string,
    owner: string,
    repo: string,
    titre: string,
  ): Promise<void> {
    const readmeContent = `# ${titre}

Projet créé avec Diagrammes Collaboratifs

## Description

Ce projet contient des diagrammes collaboratifs versionnés avec Git.

## Structure

- Chaque diagramme est stocké dans un fichier séparé
- Les modifications sont automatiquement sauvegardées
- L'historique complet est disponible via Git
`;

    const base64Content = Buffer.from(readmeContent).toString('base64');

    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/contents/README.md`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Initial commit: Add README',
          content: base64Content,
        }),
      },
    );

    if (!response.ok) {
      this.logger.error(`Failed to create README: ${response.statusText}`);
    } else {
      this.logger.log(`README created in ${owner}/${repo}`);
    }
  }

  /**
   * Vérifier si un dépôt GitHub existe et qui en est propriétaire
   */
  async getRepository(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<{ exists: boolean; isOwner: boolean; currentOwner?: string } | null> {
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 404) {
      return { exists: false, isOwner: false };
    }

    if (!response.ok) {
      this.logger.error(`Failed to get repository: ${response.statusText}`);
      return null;
    }

    const repoData: GithubRepo = await response.json();
    const user = await this.getGithubUser(accessToken);

    return {
      exists: true,
      isOwner: repoData.owner.login === user.login,
      currentOwner: repoData.owner.login,
    };
  }

  /**
   * Supprimer un dépôt GitHub
   */
  async deleteRepository(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<void> {
    this.logger.log(`Tentative de suppression du dépôt: ${owner}/${repo}`);
    
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    this.logger.log(`Réponse GitHub DELETE: Status ${response.status} ${response.statusText}`);

    // Si le dépôt n'existe pas, pas d'erreur (déjà supprimé)
    if (response.status === 404) {
      this.logger.warn(`Repository ${owner}/${repo} not found (404), may have been already deleted`);
      return;
    }

    // Token GitHub expiré ou révoqué
    if (response.status === 403) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`GitHub token expired or insufficient permissions: ${errorBody}`);
      
      // Vérifier si c'est un problème de permissions
      if (errorBody.includes('Must have admin rights')) {
        throw new BadRequestException(
          'Permissions insuffisantes. Veuillez vous déconnecter puis vous reconnecter pour autoriser la suppression de dépôts.'
        );
      }
      
      throw new BadRequestException(
        'Votre session GitHub a expiré. Veuillez vous déconnecter puis vous reconnecter pour renouveler vos accès.'
      );
    }

    // Autres erreurs
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      this.logger.error(`Failed to delete repository: ${response.status} ${response.statusText}`);
      this.logger.error(`Response body: ${errorBody}`);
      throw new BadRequestException(
        `Impossible de supprimer le dépôt GitHub: ${response.statusText}`
      );
    }

    this.logger.log(`Repository successfully deleted: ${owner}/${repo}`);
  }

  /**
   * Obtenir le SHA d'un fichier (nécessaire pour les mises à jour)
   */
  async getFileSha(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<string | null> {
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 404) {
      return null; // Le fichier n'existe pas encore
    }

    if (!response.ok) {
      this.logger.error(`Failed to get file SHA: ${response.statusText}`);
      throw new BadRequestException('Impossible de récupérer le SHA du fichier');
    }

    const data: GithubFileContent = await response.json();
    return data.sha;
  }

  /**
   * Créer ou mettre à jour un fichier dans le dépôt
   */
  async createOrUpdateFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string; url: string }> {
    const base64Content = Buffer.from(content).toString('base64');

    const body: any = {
      message,
      content: base64Content,
    };

    // Si un SHA est fourni, c'est une mise à jour
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`Failed to create/update file: ${JSON.stringify(error)}`);
      throw new BadRequestException('Impossible de créer ou mettre à jour le fichier');
    }

    const result = await response.json();
    this.logger.log(`File ${sha ? 'updated' : 'created'}: ${path} in ${owner}/${repo}`);

    return {
      sha: result.content.sha,
      url: result.content.html_url,
    };
  }

  /**
   * Supprimer un fichier dans le dépôt
   */
  async deleteFile(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
  ): Promise<void> {
    const body = {
      message,
      sha,
    };

    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        this.logger.warn(`File ${path} not found on GitHub, it might have been already deleted.`);
        return;
      }
      const errText = await response.text();
      throw new Error(`Erreur GitHub API (${response.status}): ${errText}`);
    }

    this.logger.log(`File successfully deleted on GitHub: ${path}`);
  }

  /**
   * Obtenir l'historique des commits pour un fichier spécifique
   */
  async getFileHistory(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<GithubCommit[]> {
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(`Failed to get file history: ${response.statusText}`);
      throw new BadRequestException('Impossible de récupérer l\'historique du fichier');
    }

    return response.json();
  }

  /**
   * Obtenir le contenu d'un fichier à un commit spécifique
   */
  async getFileAtCommit(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    sha: string,
  ): Promise<string> {
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${sha}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(`Failed to get file at commit: ${response.statusText}`);
      throw new BadRequestException('Impossible de récupérer le fichier à ce commit');
    }

    const data: GithubFileContent = await response.json();
    
    // Décoder le contenu Base64
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  /**
   * Inviter un collaborateur sur un dépôt GitHub
   * Retourne l'ID de l'invitation (201) ou null si déjà collaborateur (204)
   */
  async inviterCollaborateur(
    accessToken: string,
    owner: string,
    repo: string,
    username: string,
    permission: 'pull' | 'push' | 'admin' = 'push',
  ): Promise<number | null> {
    const response = await fetch(
      `${this.GITHUB_API}/repos/${owner}/${repo}/collaborators/${username}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission }),
      },
    );

    // 204 = déjà collaborateur, aucune invitation nécessaire
    if (response.status === 204) {
      this.logger.log(`${username} est déjà collaborateur de ${owner}/${repo}`);
      return null;
    }

    if (response.status !== 201) {
      const error = await response.json().catch(() => ({}));
      this.logger.error(`Failed to invite collaborator: ${JSON.stringify(error)}`);
      throw new BadRequestException("Impossible d'inviter le collaborateur sur le dépôt GitHub");
    }

    const data = await response.json();
    this.logger.log(`Invitation envoyée à ${username} pour ${owner}/${repo} (id: ${data.id})`);
    return data.id as number;
  }

  /**
   * Accepter automatiquement une invitation à un dépôt GitHub
   */
  async accepterInvitation(accessToken: string, invitationId: number): Promise<void> {
    const response = await fetch(
      `${this.GITHUB_API}/user/repository_invitations/${invitationId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(`Failed to accept invitation ${invitationId}: ${response.statusText}`);
      throw new BadRequestException("Impossible d'accepter l'invitation au dépôt GitHub");
    }

    this.logger.log(`Invitation ${invitationId} acceptée automatiquement`);
  }

  /**
   * Slugifier un titre pour créer un nom de dépôt valide
   */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
