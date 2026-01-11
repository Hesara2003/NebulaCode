import { Injectable } from '@nestjs/common';
import { docker } from './docker.service';

@Injectable()
export class RunnerService {
  async spawn(image: string, runId: string) {
    const container = await docker.createContainer({
      Image: image,
      User: 'runner',
      Cmd: ['timeout', '10s', 'node', 'src/index.js'],
      Labels: { runId },
      HostConfig: {
        AutoRemove: true,
        Memory: 256 * 1024 * 1024,
        CpuQuota: 50000,
        UsernsMode: 'host',
      },
    });

    await container.start();
    return container;

  }
  catch (err) {
    console.error('Failed to spawn container:', err);
    throw err;
  }
}
