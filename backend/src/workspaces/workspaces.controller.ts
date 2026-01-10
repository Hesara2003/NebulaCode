import { Body, Controller, Get, Param, Post, Delete, Patch, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':workspaceId/files/:fileId/download')
  async downloadFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const stream = await this.workspacesService.getFileStream(workspaceId, fileId);
    const filename = fileId.split('/').pop() || 'file';
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    stream.pipe(res);
  }

  @Get(':workspaceId/export')
  async exportWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const stream = await this.workspacesService.exportWorkspace(workspaceId);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${workspaceId}.zip"`,
    });
    stream.pipe(res);
  }
}
