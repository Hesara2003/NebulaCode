import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceFile, FileNode } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @Get(':id/files')
  getFileTree(@Param('id') id: string): FileNode[] {
    return this.workspacesService.getFileTree(id);
  }

  @Get(':workspaceId/files/:fileId')
  async getFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ): Promise<WorkspaceFile> {
    return this.workspacesService.getFile(workspaceId, fileId);
  }

  @Post(':workspaceId/files/:fileId')
  async saveFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Body('content') content: string,
  ): Promise<WorkspaceFile> {
    return this.workspacesService.saveFile(workspaceId, fileId, content);
  }
}
