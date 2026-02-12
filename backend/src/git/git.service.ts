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
   * Supprimer un dépôt GitHub
   */
  async deleteRepository(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<void> {
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

    if (!response.ok && response.status !== 404) {
      this.logger.error(`Failed to delete repository: ${response.statusText}`);
      throw new BadRequestException('Impossible de supprimer le dépôt GitHub');
    }

    this.logger.log(`Repository deleted: ${owner}/${repo}`);
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
