const BASE_URL = "http://localhost:4000";
const WORKSPACE_ID = "script-test-workspace";
const FILE_ID = "test-file.txt";
const CONTENT = "Verified via script at " + new Date().toISOString();

async function runTest() {
    console.log(`Testing against ${BASE_URL}...`);

    // 1. Save a file
    console.log(`\n[1] Saving file '${FILE_ID}' to workspace '${WORKSPACE_ID}'...`);
    const saveUrl = `${BASE_URL}/workspaces/${WORKSPACE_ID}/files/${encodeURIComponent(FILE_ID)}`;

    try {
        const saveRes = await fetch(saveUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: CONTENT }),
        });

        if (saveRes.ok) {
            console.log("✅ Save successful.");
        } else {
            console.error(`❌ Save failed: ${saveRes.status} - ${saveRes.statusText}`);
            const text = await saveRes.text();
            console.error(text);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Connection failed: ${error}`);
        process.exit(1);
    }

    // 2. Read the file back
    console.log(`\n[2] Reading file '${FILE_ID}'...`);
    const getUrl = `${BASE_URL}/workspaces/${WORKSPACE_ID}/files/${encodeURIComponent(FILE_ID)}`;

    try {
        const getRes = await fetch(getUrl);
        if (getRes.ok) {
            const data = await getRes.json();
            const fetchedContent = data.content;
            console.log(`   Got content: ${fetchedContent}`);

            if (fetchedContent === CONTENT) {
                console.log("✅ Content verification passed.");
            } else {
                console.error("❌ Content verification failed!");
                process.exit(1);
            }
        } else {
            console.error(`❌ Read failed: ${getRes.status} - ${getRes.statusText}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Connection failed: ${error}`);
        process.exit(1);
    }

    // 3. List files
    console.log(`\n[3] Listing files in workspace '${WORKSPACE_ID}'...`);
    const listUrl = `${BASE_URL}/workspaces/${WORKSPACE_ID}/files`;

    try {
        const listRes = await fetch(listUrl);
        if (listRes.ok) {
            const files = await listRes.json();
            console.log(`   Got ${files.length} items.`);

            // Helper function to find file in tree
            const findFile = (nodes, id) => {
                for (const node of nodes) {
                    if (node.id === id) return true;
                    if (node.children) {
                        if (findFile(node.children, id)) return true;
                    }
                }
                return false;
            };

            // In filesystem storage service, fileID might be relative path
            if (findFile(files, FILE_ID)) {
                console.log(`✅ File '${FILE_ID}' found in listing.`);
            } else {
                console.error(`❌ File '${FILE_ID}' NOT found in listing!`);
                console.log("Listing:", JSON.stringify(files, null, 2));
                process.exit(1);
            }
        } else {
            console.error(`❌ List failed: ${listRes.status} - ${listRes.statusText}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Connection failed during listing: ${error}`);
        process.exit(1);
    }

    console.log("\n🎉 All tests passed!");
}

runTest();
