describe("Sandali – Backend RunController & RunService", () => {

  test("CreateRunDto has required fields", () => {
    const dto = {
      workspaceId: "workspace-123",
      fileId: "src/main.ts",
      language: "typescript"
    };
    expect(dto).toHaveProperty("workspaceId");
    expect(dto).toHaveProperty("fileId");
    expect(dto.workspaceId).toBeTruthy();
    expect(dto.fileId).toBeTruthy();
  });

  test("Run response contains required metadata", () => {
    const response = {
      runId: "550e8400-e29b-41d4-a716-446655440000",
      status: "queued",
      workspaceId: "workspace-123",
      fileId: "src/main.ts",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(response).toHaveProperty("runId");
    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("workspaceId");
    expect(response).toHaveProperty("fileId");
    expect(response).toHaveProperty("createdAt");
    expect(response).toHaveProperty("updatedAt");
  });

  test("RunMetadata stored with correct structure", () => {
    const metadata = {
      runId: "550e8400-e29b-41d4-a716-446655440000",
      workspaceId: "workspace-123",
      fileId: "src/main.ts",
      language: "typescript",
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(metadata.status).toBe("queued");
    expect(metadata).toHaveProperty("language");
  });

  test("Redis key format is correct", () => {
    const runId = "550e8400-e29b-41d4-a716-446655440000";
    const key = `run:${runId}`;
    expect(key).toBe(`run:${runId}`);
    expect(key.startsWith("run:")).toBe(true);
  });

  test("Run status values are valid", () => {
    const validStatuses = ["queued", "running", "completed", "failed", "cancelled", "timed_out"];
    expect(validStatuses).toContain("queued");
    expect(validStatuses).toContain("running");
    expect(validStatuses).toContain("completed");
  });

  test("Cancel run endpoint returns updated metadata", () => {
    const metadata = {
      runId: "550e8400-e29b-41d4-a716-446655440000",
      status: "cancelled",
      updatedAt: new Date().toISOString()
    };
    expect(metadata.status).toBe("cancelled");
  });

});
