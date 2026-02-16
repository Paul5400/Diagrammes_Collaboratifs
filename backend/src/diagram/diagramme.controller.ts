import {
    Controller,
    Get,
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
        await this.diagrammeService.delete(id, githubId);
    }
}
