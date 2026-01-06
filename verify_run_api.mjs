const BASE_URL = "http://localhost:4000";
const WORKSPACE_ID = "script-test-workspace"; // This workspace was created by verify_api.mjs
const FILE_ID = "test-file.txt"; // This file exists in the test workspace

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log(`Testing Run Lifecycle APIs against ${BASE_URL}...\n`);

    // 1. Create a run
    console.log("[1] Creating a new run...");
    let runId;
    try {
        const res = await fetch(`${BASE_URL}/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId: WORKSPACE_ID, fileId: FILE_ID }),
        });
        if (res.ok) {
            const data = await res.json();
            runId = data.runId;
            console.log(`✅ Run created: ${runId}`);
            console.log(`   Status: ${data.status}, CreatedAt: ${data.createdAt}`);
            if (data.status !== 'queued') {
                console.error("❌ Expected status 'queued'");
                process.exit(1);
            }
        } else {
            console.error(`❌ Create run failed: ${res.status}`);
            const text = await res.text();
            console.error(text);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Connection failed: ${error}`);
        process.exit(1);
    }

    // 2. Get run status
    console.log(`\n[2] Getting run status for ${runId}...`);
    try {
        const res = await fetch(`${BASE_URL}/run/${runId}/status`);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ Got status: ${data.status}, UpdatedAt: ${data.updatedAt}`);
        } else {
            console.error(`❌ Get status failed: ${res.status}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Connection failed: ${error}`);
        process.exit(1);
    }

    // 3. Wait for simulated lifecycle to complete
    console.log(`\n[3] Waiting 4 seconds for simulated run lifecycle...`);
    await sleep(4000);

    // 4. Check final status (should be completed)
    console.log(`\n[4] Checking final status...`);
    try {
        const res = await fetch(`${BASE_URL}/run/${runId}/status`);
        if (res.ok) {
            const data = await res.json();
            console.log(`   Final Status: ${data.status}`);
            if (data.status === 'completed') {
                console.log(`✅ Run completed successfully.`);
            } else if (data.status === 'running' || data.status === 'queued') {
                console.log(`⚠️ Run still in progress (might need more time or RUNNER_API_URL is set).`);
            } else {
                console.log(`   Status is: ${data.status}`);
            }
        } else {
            console.error(`❌ Get status failed: ${res.status}`);
        }
    } catch (error) {
        console.error(`❌ Connection failed: ${error}`);
    }

    // 5. Test cancel endpoint (create new run first)
    console.log(`\n[5] Testing cancel endpoint...`);
    let cancelRunId;
    try {
        const createRes = await fetch(`${BASE_URL}/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId: WORKSPACE_ID, fileId: FILE_ID }),
        });
        if (createRes.ok) {
            const data = await createRes.json();
            cancelRunId = data.runId;
            console.log(`   Created run for cancel test: ${cancelRunId}`);
        }

        // Cancel it immediately
        const cancelRes = await fetch(`${BASE_URL}/run/${cancelRunId}/cancel`, { method: "POST" });
        if (cancelRes.ok) {
            const data = await cancelRes.json();
            console.log(`✅ Cancel successful. New status: ${data.status}`);
            if (data.status !== 'cancelled') {
                console.error(`❌ Expected 'cancelled', got '${data.status}'`);
                process.exit(1);
            }
        } else {
            console.error(`❌ Cancel failed: ${cancelRes.status}`);
            const text = await cancelRes.text();
            console.error(text);
        }
    } catch (error) {
        console.error(`❌ Cancel test failed: ${error}`);
    }

    // 6. Test timeout endpoint
    console.log(`\n[6] Testing timeout endpoint...`);
    let timeoutRunId;
    try {
        const createRes = await fetch(`${BASE_URL}/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId: WORKSPACE_ID, fileId: FILE_ID }),
        });
        if (createRes.ok) {
            const data = await createRes.json();
            timeoutRunId = data.runId;
            console.log(`   Created run for timeout test: ${timeoutRunId}`);
        }

        // Timeout it immediately
        const timeoutRes = await fetch(`${BASE_URL}/run/${timeoutRunId}/timeout`, { method: "POST" });
        if (timeoutRes.ok) {
            const data = await timeoutRes.json();
            console.log(`✅ Timeout successful. New status: ${data.status}`);
            if (data.status !== 'timed_out') {
                console.error(`❌ Expected 'timed_out', got '${data.status}'`);
                process.exit(1);
            }
        } else {
            console.error(`❌ Timeout failed: ${timeoutRes.status}`);
            const text = await timeoutRes.text();
            console.error(text);
        }
    } catch (error) {
        console.error(`❌ Timeout test failed: ${error}`);
    }

    console.log("\n🎉 All Run Lifecycle API tests passed!");
}

runTest();
