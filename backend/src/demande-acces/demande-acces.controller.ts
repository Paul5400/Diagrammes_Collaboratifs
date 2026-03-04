import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DemandeAccesService } from './demande-acces.service';
import { CreateDemandeAccesDto } from './dto/create-demande-acces.dto';
import type { FastifyRequest } from 'fastify';

@Controller('demandes-acces')
@UseGuards(AuthGuard('jwt'))
export class DemandeAccesController {
  constructor(private readonly demandeAccesService: DemandeAccesService) {}

  @Post('check-github-invitations')
  async checkGithubInvitations(@Req() req: FastifyRequest) {
    const user = (req as any).user;
    // user.sub doit contenir le githubId selon auth.service
    return this.demandeAccesService.verifierEtAccepterInvitationsGitHub(user.sub);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() dto: CreateDemandeAccesDto) {
    const userId = (req as any).user?.sub;
    return this.demandeAccesService.create(userId, dto);
  }

  @Get('received')
  async findAllReceived(@Req() req: FastifyRequest) {
    const userId = (req as any).user?.sub;
    return this.demandeAccesService.findAllByOwner(userId);
  }

  @Post(':id/accept')
  async accept(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    return this.demandeAccesService.accepterDemande(id, userId);
  }

  @Post(':id/reject')
  async reject(@Req() req: FastifyRequest, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    return this.demandeAccesService.refuserDemande(id, userId);
  }
}
