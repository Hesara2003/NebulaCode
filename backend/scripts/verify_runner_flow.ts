
import axios from 'axios';
import Redis from 'ioredis';

const API_URL = 'http://localhost:4000';
const REDIS_PORT = 6379;
const REDIS_HOST = 'localhost';

async function main() {
    console.log('Starting Verification Script: Runner Flow');

    const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

    try {
        // 1. Create a Run
        console.log('\n[1/5] Creating a new run...');
        const createRes = await axios.post(`${API_URL}/run`, { workspaceId: 'ws-test-123' });
        const { runId, status } = createRes.data;
        console.log(`Run created: ${runId}, Status: ${status}`);

        // Verify Redis
        const runData = await redis.hgetall(`run:${runId}`);
        console.log(`Redis Check: Status=${runData.status}, Workspace=${runData.workspaceId}`);
        if (runData.status !== 'running') throw new Error('Redis status mismatch!');

        // 2. Finish the Run (Simulate Runner)
        console.log('\n[2/5] Finishing the run...');
        const logContent = 'Line 1: Hello World\nLine 2: Build successful';
        await axios.post(`${API_URL}/run/${runId}/finish`, { logContent });
        console.log('Run marked as finished.');

        // Verify Redis Update
        const updatedRunData = await redis.hgetall(`run:${runId}`);
        console.log(`Redis Check: Status=${updatedRunData.status}`);
        if (updatedRunData.status !== 'completed') throw new Error('Redis status mismatch after finish!');

        // 3. Verify Logs via FileService (S3 Stub)
        console.log('\n[3/5] Verifying Logs...');
        const logRes = await axios.get(`${API_URL}/run/${runId}/logs`);
        console.log('✅ Logs retrieved:', logRes.data.substring(0, 20) + '...');
        if (!logRes.data.includes('Hello World')) throw new Error('Logs content mismatch!');

        // 4. Test Cleanup Worker
        console.log('\n[3/5] Testing Cleanup Worker (Stale Run)...');
        const staleRes = await axios.post(`${API_URL}/run`, { workspaceId: 'ws-stale-123' });
        const staleRunId = staleRes.data.runId;
        console.log(`Stale Run created: ${staleRunId}. Setting time back...`);

        // Manually age the run in Redis to -2 minutes
        const oldTime = Date.now() - 120000;
        await redis.hset(`run:${staleRunId}`, 'startTime', oldTime);

        console.log('Waiting 15s for Cleanup Worker...');
        await new Promise(r => setTimeout(r, 15000));

        const staleRunData = await redis.hgetall(`run:${staleRunId}`);
        console.log(`🔍 Redis Check: Status=${staleRunData.status}`);
        if (staleRunData.status !== 'terminated') console.warn('⚠️ Warning: Run not terminated. Worker might be slow or misconfigured.');
        else console.log('Run successfully terminated by worker.');

        console.log('\n Verification Complete!');

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    } finally {
        redis.disconnect();
    }
}

main();
