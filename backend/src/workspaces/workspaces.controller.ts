import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceFile, FileNode } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @Get(':id/files')
  async getFileTree(@Param('id') id: string): Promise<FileNode[]> {
    return this.workspacesService.getFileTree(id);
  }

  @Get(':workspaceId/files/:fileId(*)')
  async getFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ): Promise<WorkspaceFile> {
    return this.workspacesService.getFile(workspaceId, fileId);
  }

  @Post(':workspaceId/files/:fileId(*)')
  async saveFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Body('content') content: string,
  ): Promise<WorkspaceFile> {
    return this.workspacesService.saveFile(workspaceId, fileId, content);
  }

  @Delete(':workspaceId/files/:fileId(*)')
  async deleteFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ): Promise<void> {
    return this.workspacesService.deleteFile(workspaceId, fileId);
  }
}
