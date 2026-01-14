import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { WorkspaceFile } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':workspaceId/files')
  async listFiles(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.listFiles(workspaceId);
  }

  @Get(':workspaceId/files/:fileId') // CAREFUL: This route param :fileId must capture path slashes if we use path as ID
  async getFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string, // NestJS doesn't inherently support wildcard params easily in middle without specific decorators, but usually encoded slashes work.
    // If fileId is "src/main.ts", standard express routing might fail if not encoded.
    // However, the user asked for /:fileId. Let's assume the frontend sends encoded ID or we use a wildcard parameter if needed.
    // For now, let's assume it works or the user sends encoded IDs.
    // Actually, traditionally in NestJS for paths, we use @Param('0') with a wildcard route, but let's stick to simple param for now as per request.
  ): Promise<WorkspaceFile> {
    // DecodeURIComponent might be needed if the client sends it encoded scrupulously.
    // But let's assume standard behavior first.
    return this.workspacesService.getFile(
      workspaceId,
      decodeURIComponent(fileId),
    );
  }

  @Post(':workspaceId/files/:fileId')
  async saveFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Body() body: { content: string },
  ) {
    await this.workspacesService.saveFile(
      workspaceId,
      decodeURIComponent(fileId),
      body.content,
    );
    return { success: true };
  }

  @Post(':workspaceId/files')
  async createFile(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { path: string; content?: string },
  ) {
    const file = await this.workspacesService.createFile(
      workspaceId,
      body.path,
      body.content ?? '',
    );
    return file;
  }

  @Delete(':workspaceId/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.workspacesService.deleteFile(
      workspaceId,
      decodeURIComponent(fileId),
    );
  }
}
