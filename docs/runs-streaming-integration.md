# Runs Streaming - Integration Guide

## Overview

This guide helps you integrate the Runs Streaming feature into your existing codebase, whether you're adding it to a new project or integrating with an existing run execution system.

## Prerequisites

- Backend: NestJS application
- Frontend: Next.js/React application
- Run execution system (or mock for testing)

## Step-by-Step Integration

### Backend Integration

#### Step 1: Install Dependencies

Ensure you have the required packages:

```bash
cd backend
npm install @nestjs/websockets socket.io
```

#### Step 2: Import RunsModule

Add `RunsModule` to your `AppModule`:

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    // ... other modules
    RunsModule,
  ],
})
export class AppModule {}
```

#### Step 3: Configure Environment Variables

Create or update `.env` file:

```bash
# backend/.env
WS_AUTH_TOKEN=your-secure-token-here
```

#### Step 4: Integrate with Run Execution

Inject `RunsService` into your execution service:

```typescript
// backend/src/execution/execution.service.ts
import { Injectable } from '@nestjs/common';
import { RunsService } from '../runs/runs.service';

@Injectable()
export class ExecutionService {
  constructor(private readonly runsService: RunsService) {}

  async executeRun(runId: string, command: string) {
    // Send initial status
    this.runsService.sendStatus(runId, 'running');

    // Start execution (example using child_process)
    const { spawn } = require('child_process');
    const process = spawn(command, [], { shell: true });

    // Stream stdout
    process.stdout.on('data', (data: Buffer) => {
      this.runsService.sendStdout(runId, data.toString());
    });

    // Stream stderr
    process.stderr.on('data', (data: Buffer) => {
      this.runsService.sendStderr(runId, data.toString());
    });

    // Handle completion
    process.on('close', (code: number) => {
      const status = code === 0 ? 'succeeded' : 'failed';
      const reason = code !== 0 ? `Process exited with code ${code}` : undefined;
      this.runsService.sendStatus(runId, status, reason);
    });

    // Handle errors
    process.on('error', (error: Error) => {
      this.runsService.sendStderr(runId, `Error: ${error.message}\n`);
      this.runsService.sendStatus(runId, 'failed', error.message);
    });
  }

  async cancelRun(runId: string) {
    // Your cancellation logic here
    // The RunsController already handles status broadcast
    // Just implement your actual cancellation logic
  }
}
```

#### Step 5: Create Run Endpoint (Optional)

Add an endpoint to create/start runs:

```typescript
// backend/src/runs/runs.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import { RunsService } from './runs.service';
import { ExecutionService } from '../execution/execution.service';

@Controller('runs')
export class RunsController {
  constructor(
    private readonly runsService: RunsService,
    private readonly executionService: ExecutionService,
  ) {}

  @Post()
  async createRun(@Body() body: { command: string; workspaceId?: string }) {
    const runId = `run-${Date.now()}`;
    
    // Send initial status
    this.runsService.sendStatus(runId, 'queued');
    
    // Start execution (async, don't await)
    this.executionService.executeRun(runId, body.command).catch((error) => {
      this.runsService.sendStatus(runId, 'failed', error.message);
    });
    
    return { runId, status: 'queued' };
  }

  @Post(':runId/cancel')
  cancelRun(@Param('runId') runId: string) {
    this.runsService.sendStatus(runId, 'cancelled', 'Cancelled by user');
    // Call your cancellation logic here
    return { runId, status: 'cancelled' as const };
  }
}
```

### Frontend Integration

#### Step 1: Install Dependencies

```bash
cd frontend
npm install @xterm/xterm @xterm/addon-fit socket.io-client
```

#### Step 2: Configure Environment Variables

Create or update `.env.local`:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_TOKEN=your-secure-token-here
```

#### Step 3: Use TerminalComponent

Import and use the component in your page:

```typescript
// frontend/app/runs/[runId]/page.tsx
"use client";

import TerminalComponent from "@/components/TerminalComponent";

export default function RunPage({ params }: { params: { runId: string } }) {
  const token = process.env.NEXT_PUBLIC_WS_TOKEN;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-4">
        <h1>Run: {params.runId}</h1>
      </div>
      <div className="h-96 border-t">
        <TerminalComponent runId={params.runId} token={token} />
      </div>
    </div>
  );
}
```

#### Step 4: Create Run (Optional)

Add a function to create runs:

```typescript
// frontend/lib/api/runs.ts
import { apiClient } from "./httpClient";

export interface CreateRunRequest {
  command: string;
  workspaceId?: string;
}

export interface CreateRunResponse {
  runId: string;
  status: string;
}

export const createRun = async (request: CreateRunRequest) => {
  const { data } = await apiClient.post<CreateRunResponse>('/runs', request);
  return data;
};

export const cancelRun = async (runId: string) => {
  const { data } = await apiClient.post<{ runId: string; status: string }>(
    `/runs/${runId}/cancel`
  );
  return data;
};
```

## Integration Patterns

### Pattern 1: Simple Command Execution

```typescript
// Backend: Execute a simple command
async executeCommand(runId: string, command: string) {
  this.runsService.sendStatus(runId, 'running');
  
  const process = spawn(command, { shell: true });
  
  process.stdout.on('data', (data) => {
    this.runsService.sendStdout(runId, data.toString());
  });
  
  process.stderr.on('data', (data) => {
    this.runsService.sendStderr(runId, data.toString());
  });
  
  process.on('close', (code) => {
    this.runsService.sendStatus(
      runId,
      code === 0 ? 'succeeded' : 'failed'
    );
  });
}
```

### Pattern 2: Docker Container Execution

```typescript
// Backend: Execute in Docker container
import Docker from 'dockerode';

async executeInDocker(runId: string, image: string, command: string[]) {
  this.runsService.sendStatus(runId, 'running');
  
  const docker = new Docker();
  const container = await docker.createContainer({
    Image: image,
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
  });
  
  const stream = await container.attach({
    stream: true,
    stdout: true,
    stderr: true,
  });
  
  await container.start();
  
  stream.on('data', (chunk: Buffer) => {
    // Determine if stdout or stderr based on chunk type
    this.runsService.sendStdout(runId, chunk.toString());
  });
  
  const result = await container.wait();
  const status = result.StatusCode === 0 ? 'succeeded' : 'failed';
  this.runsService.sendStatus(runId, status);
}
```

### Pattern 3: Kubernetes Job Execution

```typescript
// Backend: Execute as Kubernetes job
import { KubeConfig, BatchV1Api, CoreV1Api } from '@kubernetes/client-node';

async executeK8sJob(runId: string, image: string, command: string[]) {
  this.runsService.sendStatus(runId, 'running');
  
  const kc = new KubeConfig();
  kc.loadFromDefault();
  const k8sApi = kc.makeApiClient(BatchV1Api);
  const coreApi = kc.makeApiClient(CoreV1Api);
  
  const job = {
    metadata: { name: `run-${runId}` },
    spec: {
      template: {
        spec: {
          containers: [{
            name: 'executor',
            image,
            command,
          }],
          restartPolicy: 'Never',
        },
      },
    },
  };
  
  await k8sApi.createNamespacedJob('default', job);
  
  // Stream logs from pod
  const logStream = await coreApi.readNamespacedPodLog(
    `run-${runId}`,
    'default',
    'executor',
    false,
    false,
    undefined,
    undefined,
    undefined,
    true
  );
  
  // Process log stream and send to RunsService
  // ... (implementation depends on your K8s client)
}
```

### Pattern 4: Queue-Based Execution

```typescript
// Backend: Queue-based execution with Bull/Redis
import { Queue } from 'bull';

@Injectable()
export class RunQueueService {
  private runQueue: Queue;

  constructor(private readonly runsService: RunsService) {
    this.runQueue = new Queue('runs', {
      redis: { host: 'localhost', port: 6379 },
    });
    
    this.processQueue();
  }

  async queueRun(runId: string, command: string) {
    this.runsService.sendStatus(runId, 'queued');
    await this.runQueue.add({ runId, command });
  }

  private processQueue() {
    this.runQueue.process(async (job) => {
      const { runId, command } = job.data;
      await this.executeRun(runId, command);
    });
  }

  async executeRun(runId: string, command: string) {
    // Your execution logic
  }
}
```

## Testing Integration

### Mock Run Execution

For testing without actual execution:

```typescript
// backend/src/runs/runs.service.spec.ts
import { Test } from '@nestjs/testing';
import { RunsService } from './runs.service';

describe('RunsService Integration', () => {
  let service: RunsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RunsService],
    }).compile();

    service = module.get<RunsService>(RunsService);
  });

  it('should broadcast messages to connected clients', (done) => {
    const mockSocket = {
      id: 'test-client',
      emit: jest.fn(),
    };

    service.registerClient('test-run', mockSocket as any);
    service.sendStdout('test-run', 'test output');

    setTimeout(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('run-event', {
        type: 'stdout',
        data: 'test output',
        timestamp: expect.any(String),
      });
      done();
    }, 100);
  });
});
```

### End-to-End Test

```typescript
// backend/test/runs.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Runs E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/runs/:runId/cancel (POST)', () => {
    return request(app.getHttpServer())
      .post('/runs/test-123/cancel')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('runId', 'test-123');
        expect(res.body).toHaveProperty('status', 'cancelled');
      });
  });
});
```

## Common Integration Scenarios

### Scenario 1: Code Execution Service

```typescript
// You have a code execution service that runs user code
@Injectable()
export class CodeExecutionService {
  constructor(
    private readonly runsService: RunsService,
    private readonly sandboxService: SandboxService,
  ) {}

  async executeCode(runId: string, code: string, language: string) {
    this.runsService.sendStatus(runId, 'running');
    
    try {
      const sandbox = await this.sandboxService.create(language);
      
      // Stream compilation output
      const compileResult = await sandbox.compile(code);
      if (compileResult.output) {
        this.runsService.sendStdout(runId, compileResult.output);
      }
      if (compileResult.errors) {
        this.runsService.sendStderr(runId, compileResult.errors);
      }
      
      if (!compileResult.success) {
        this.runsService.sendStatus(runId, 'failed', 'Compilation failed');
        return;
      }
      
      // Stream execution output
      const execResult = await sandbox.execute();
      execResult.stdout.forEach(line => {
        this.runsService.sendStdout(runId, line + '\n');
      });
      execResult.stderr.forEach(line => {
        this.runsService.sendStderr(runId, line + '\n');
      });
      
      this.runsService.sendStatus(
        runId,
        execResult.exitCode === 0 ? 'succeeded' : 'failed'
      );
    } catch (error) {
      this.runsService.sendStderr(runId, `Error: ${error.message}\n`);
      this.runsService.sendStatus(runId, 'failed', error.message);
    }
  }
}
```

### Scenario 2: CI/CD Pipeline Integration

```typescript
// Integrate with CI/CD pipeline
@Injectable()
export class PipelineService {
  constructor(private readonly runsService: RunsService) {}

  async runPipeline(runId: string, pipelineConfig: PipelineConfig) {
    this.runsService.sendStatus(runId, 'running');
    
    for (const stage of pipelineConfig.stages) {
      this.runsService.sendStdout(runId, `\n=== Stage: ${stage.name} ===\n`);
      
      try {
        const result = await this.executeStage(stage);
        this.runsService.sendStdout(runId, result.output);
        
        if (!result.success) {
          this.runsService.sendStatus(runId, 'failed', `Stage ${stage.name} failed`);
          return;
        }
      } catch (error) {
        this.runsService.sendStderr(runId, `Stage error: ${error.message}\n`);
        this.runsService.sendStatus(runId, 'failed', error.message);
        return;
      }
    }
    
    this.runsService.sendStatus(runId, 'succeeded');
  }
}
```

## Troubleshooting

### Backend Issues

1. **RunsService not found**
   - Ensure `RunsModule` is imported in `AppModule`
   - Check `RunsService` is exported from `RunsModule`

2. **WebSocket not connecting**
   - Verify `WS_AUTH_TOKEN` is set
   - Check gateway path matches frontend connection
   - Review CORS configuration

3. **Messages not broadcasting**
   - Verify clients are registered (check logs)
   - Ensure `runId` matches between sender and receiver
   - Check WebSocket connection is active

### Frontend Issues

1. **Terminal not rendering**
   - Ensure xterm.js CSS is imported
   - Check component is mounted
   - Verify terminalRef is attached to DOM

2. **WebSocket connection fails**
   - Verify `NEXT_PUBLIC_WS_TOKEN` matches backend
   - Check `NEXT_PUBLIC_API_URL` is correct
   - Review browser console for errors

3. **Cancel button not working**
   - Verify API endpoint is accessible
   - Check network tab for request/response
   - Ensure run is in cancellable state

## Best Practices

1. **Error Handling**
   - Always handle WebSocket errors
   - Provide user-friendly error messages
   - Log errors for debugging

2. **Resource Management**
   - Clean up WebSocket connections on unmount
   - Dispose terminal instances properly
   - Remove event listeners

3. **Status Management**
   - Always send status updates for state changes
   - Include reasons for failures/cancellations
   - Update UI based on status

4. **Performance**
   - Consider buffering for high-frequency updates
   - Limit terminal buffer size for long runs
   - Implement reconnection logic

5. **Security**
   - Validate run IDs
   - Implement user authorization
   - Use secure tokens in production

## Next Steps

- Review [API Reference](./runs-streaming-api.md) for detailed API docs
- Check [Authentication Guide](./runs-streaming-auth.md) for auth setup
- See [Backend Implementation](./runs-streaming-backend.md) for architecture details
- Read [Frontend Implementation](./runs-streaming-frontend.md) for UI integration

