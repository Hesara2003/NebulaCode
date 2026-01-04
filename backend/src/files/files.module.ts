import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { LocalPersistence } from './persistence/local.persistence';
import { S3StubPersistence } from './persistence/s3-stub.persistence';

@Module({
    providers: [
        FilesService,
        LocalPersistence,
        S3StubPersistence,
        {
            provide: 'PERSISTENCE_STRATEGY',
            useClass: LocalPersistence,
        },
        {
            provide: 'S3_PERSISTENCE',
            useClass: S3StubPersistence,
        },
    ],
    exports: [FilesService],
})
export class FilesModule { }
