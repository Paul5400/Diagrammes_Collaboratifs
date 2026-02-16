import { Module } from '@nestjs/common';
import { DiagrammeController } from './diagramme.controller';
import { DiagrammeService } from './diagramme.service';
import { UserModule } from '../user/user.module';

@Module({
    imports: [UserModule],
    controllers: [DiagrammeController],
    providers: [DiagrammeService],
    exports: [DiagrammeService],
})
export class DiagramModule { }
