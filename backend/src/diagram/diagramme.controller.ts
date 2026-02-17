import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiagrammeService } from './diagramme.service';
import { UpdateDiagrammeDto } from './dto/update-diagramme.dto';
import type { FastifyRequest } from 'fastify';

@Controller('diagrammes')
@UseGuards(AuthGuard('jwt'))
export class DiagrammeController {
    constructor(private readonly diagrammeService: DiagrammeService) { }

    /**
     * GET /diagrammes/:id
     * Récupérer un diagramme spécifique
     */
    @Get(':id')
    async findOne(@Req() req: FastifyRequest, @Param('id') id: string) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.findOne(id, githubId);
    }

    /**
     * PATCH /diagrammes/:id
     * Mettre à jour un diagramme
     */
    @Patch(':id')
    async update(
        @Req() req: FastifyRequest,
        @Param('id') id: string,
        @Body() dto: UpdateDiagrammeDto,
    ) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.update(id, githubId, dto);
    }

    /**
     * DELETE /diagrammes/:id
     * Supprimer un diagramme
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Req() req: FastifyRequest, @Param('id') id: string) {
        const githubId = (req as any).user?.sub;
        console.log(`[DiagrammeController] DELETE request for diagram ${id} from user ${githubId}`);
        await this.diagrammeService.delete(id, githubId);
    }

    /**
     * GET /diagrammes/:id/history
     * Récupérer l'historique des versions d'un diagramme depuis GitHub
     */
    @Get(':id/history')
    async getHistory(@Req() req: FastifyRequest, @Param('id') id: string) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.getHistory(id, githubId);
    }

    /**
     * GET /diagrammes/:id/version/:sha
     * Récupérer le contenu d'un diagramme à une version spécifique
     */
    @Get(':id/version/:sha')
    async getVersionAtCommit(
        @Req() req: FastifyRequest,
        @Param('id') id: string,
        @Param('sha') sha: string,
    ) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.getVersionAtCommit(id, sha, githubId);
    }

    // Charger le contenu depuis GitHub 
    @Get(':id/content')
    async getContent(@Req() req: FastifyRequest, @Param('id') id: string) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.loadFromGithub(id, githubId);
    }

    // Sauvegarder vers GitHub 
    @Post(':id/save-github')
    async saveToGithub(
        @Req() req: FastifyRequest,
        @Param('id') id: string,
        @Body('contenu') contenu: string,
    ) {
        const githubId = (req as any).user?.sub;
        return this.diagrammeService.saveToGithub(id, githubId, contenu);
    }
}
