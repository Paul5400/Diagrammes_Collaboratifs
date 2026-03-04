import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjetService } from './projet.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { DiagrammeService } from '../diagram/diagramme.service';
import { CreateDiagrammeDto } from '../diagram/dto/create-diagramme.dto';
import type { FastifyRequest } from 'fastify';

@Controller('projets')
export class ProjetController {
  constructor(
    private readonly projetService: ProjetService,
    private readonly diagrammeService: DiagrammeService,
  ) {}

  /**
   * GET /projets/:id/public
   * Récupérer un projet publique (Lecture seule)
   * Pas de Guard JWT ici
   */
  @Get(':id/public')
  async findOnePublic(@Param('id') id: string) {
    return this.projetService.findOnePublic(id);
  }

  /**
   * POST /projets
   * Créer un nouveau projet + dépôt GitHub
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: FastifyRequest, @Body() dto: CreateProjetDto) {
    const githubId = (req as any).user?.sub;
    return this.projetService.create(githubId, dto);
  }

  /**
   * DELETE /projets/:id/collaborateurs/:userId
   * Retirer un collaborateur du projet
   */
  @Delete(':id/collaborateurs/:userId')
  @UseGuards(AuthGuard('jwt'))
  async removeCollaborator(
    @Req() req: FastifyRequest,
    @Param('id') projectId: string,
    @Param('userId') collaboratorId: string,
  ) {
    const githubId = (req as any).user?.sub;
    return this.projetService.removeCollaborator(githubId, projectId, collaboratorId);
  }

  /**
   * GET /projets
   * Récupérer tous les projets de l'utilisateur connecté
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: FastifyRequest) {
    const githubId = (req as any).user?.sub;
    return this.projetService.findAllByUser(githubId);
  }

  /**
   * GET /projets/:id
   * Récupérer un projet spécifique
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Req() req: FastifyRequest, @Param('id') id: string) {
    const githubId = (req as any).user?.sub;
    return this.projetService.findOne(id, githubId);
  }

  /**
   * DELETE /projets/:id
   * Supprimer un projet + dépôt GitHub
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: FastifyRequest, @Param('id') id: string) {
    const githubId = (req as any).user?.sub;
    await this.projetService.delete(id, githubId);
  }

  /**
   * POST /projets/:id/save
   * Sauvegarder tous les diagrammes du projet vers GitHub
   */
  @Post(':id/save')
  @UseGuards(AuthGuard('jwt'))
  async save(@Req() req: FastifyRequest, @Param('id') id: string) {
    const githubId = (req as any).user?.sub;
    return this.projetService.saveDiagramsToGithub(id, githubId);
  }

  // ========================================
  // Routes diagrammes imbriquées dans projets
  // ========================================

  /**
   * POST /projets/:id/diagrammes
   * Créer un diagramme dans un projet
   */
  @Post(':id/diagrammes')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createDiagramme(
    @Req() req: FastifyRequest,
    @Param('id') projetId: string,
    @Body() dto: CreateDiagrammeDto,
  ) {
    const githubId = (req as any).user?.sub;
    return this.diagrammeService.create(projetId, githubId, dto);
  }

  /**
   * GET /projets/:id/diagrammes
   * Récupérer tous les diagrammes d'un projet
   */
  @Get(':id/diagrammes')
  @UseGuards(AuthGuard('jwt'))
  async findAllDiagrammes(
    @Req() req: FastifyRequest,
    @Param('id') projetId: string,
  ) {
    const githubId = (req as any).user?.sub;
    return this.diagrammeService.findAllByProjet(projetId, githubId);
  }
}
