import { Body, Controller, Get, Param, Post, Delete, Patch } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceFile, FileNode, Workspace } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) { }

  @Get(':id')
  async getWorkspace(@Param('id') id: string): Promise<Workspace> {
    return this.workspacesService.getWorkspace(id);
  }

  @Patch(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() updates: Partial<Workspace>,
  ): Promise<Workspace> {
    return this.workspacesService.updateWorkspace(id, updates);
  }

  @Get(':id/files')
  async getFileTree(@Param('id') id: string): Promise<FileNode[]> {
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

  @Delete(':workspaceId/files/:fileId')
  async deleteFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ): Promise<void> {
    return this.workspacesService.deleteFile(workspaceId, fileId);
  }

  @Post(':workspaceId/files/rename')
  async renameFile(
    @Param('workspaceId') workspaceId: string,
    @Body('oldFileId') oldFileId: string,
    @Body('newFileId') newFileId: string,
  ): Promise<void> {
    return this.workspacesService.renameFile(workspaceId, oldFileId, newFileId);
  }
}
