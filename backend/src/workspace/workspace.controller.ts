import { Controller, Get, Param } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get(':id/files')
  getFiles(@Param('id') id: string) {
    return this.workspaceService.getFiles(id);
  }
}
