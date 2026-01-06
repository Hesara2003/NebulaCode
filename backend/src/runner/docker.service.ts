// src/runner/docker.service.ts
import Docker from 'dockerode';

export const docker = new Docker({
  socketPath: '/var/run/docker.sock',
});
