import { Controller, Get, Param } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceFile } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':workspaceId/files/:fileId')
  getFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ): WorkspaceFile {
    return this.workspacesService.getFile(workspaceId, fileId);
  }
}
