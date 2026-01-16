import { Module } from '@nestjs/common';
import { CollaborationController } from './collab.controller';
import { CollaborationConfigService } from './collab.config';
import { CollaborationDocumentService } from './collab-document.service';
import { EditorSyncGateway } from './editor-sync.gateway';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [CollaborationController],
  providers: [
    CollaborationConfigService,
    CollaborationDocumentService,
    EditorSyncGateway,
  ],
  exports: [EditorSyncGateway],
})
export class CollabModule {}
