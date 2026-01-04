$workspaceId = "demo-workspace"
$fileId = "welcome-file"
$content = "Updated content from verification script"

# Start Backend (assuming it's running on port 3000 or 3001, need to check main.ts)
# Actually, I'll just assume the user will run it, or I can try to run it in background.
# But for now, let's just write the script.

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/workspaces/$workspaceId/files/$fileId" -Method Post -Body @{ content = $content }
    Write-Host "Save Response: $($response | ConvertTo-Json -Depth 2)"

    $getResponse = Invoke-RestMethod -Uri "http://localhost:4000/workspaces/$workspaceId/files/$fileId" -Method Get
    Write-Host "Get Response: $($getResponse | ConvertTo-Json -Depth 2)"

    if ($getResponse.content -eq $content) {
        Write-Host "Verification SUCCESS: Content matches."
    } else {
        Write-Host "Verification FAILED: Content does not match."
    }
} catch {
    Write-Host "Error: $_"
}
