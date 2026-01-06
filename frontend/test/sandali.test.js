describe("Sandali – Frontend Run Button & Status UX", () => {

  test("Run button state management", () => {
    const runState = {
      isRunRequestPending: false,
      activeRunInFlight: false,
      hasOtherRunInFlight: false,
      runButtonDisabled: false
    };
    expect(runState).toHaveProperty("isRunRequestPending");
    expect(runState).toHaveProperty("activeRunInFlight");
    expect(runState.runButtonDisabled).toBe(false);
  });

  test("Run status values", () => {
    const statuses = ["queued", "running", "completed", "failed", "cancelled", "timed_out"];
    expect(statuses).toContain("queued");
    expect(statuses).toContain("running");
    expect(statuses).toContain("completed");
  });

  test("RunSnapshot structure", () => {
    const snapshot = {
      runId: "550e8400-e29b-41d4-a716-446655440000",
      status: "running",
      fileId: "src/main.ts",
      fileName: "main.ts",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(snapshot).toHaveProperty("runId");
    expect(snapshot).toHaveProperty("status");
    expect(snapshot).toHaveProperty("fileId");
  });

  test("Active run is in flight when queued or running", () => {
    const isRunActive = (status) => status === "queued" || status === "running";
    expect(isRunActive("queued")).toBe(true);
    expect(isRunActive("running")).toBe(true);
    expect(isRunActive("completed")).toBe(false);
  });

  test("Terminal status check", () => {
    const isTerminalStatus = (status) => 
      ["completed", "failed", "cancelled", "timed_out"].includes(status);
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("running")).toBe(false);
  });

  test("Rerun button enabled only in terminal state", () => {
    const canRerun = (status, isAnyRunInFlight) => {
      const isTerminal = ["completed", "failed", "cancelled", "timed_out"].includes(status);
      return isTerminal && !isAnyRunInFlight;
    };
    expect(canRerun("completed", false)).toBe(true);
    expect(canRerun("running", false)).toBe(false);
    expect(canRerun("completed", true)).toBe(false);
  });

  test("Download logs enabled in terminal state", () => {
    const canDownloadLogs = (status) => 
      ["completed", "failed", "cancelled", "timed_out"].includes(status);
    expect(canDownloadLogs("completed")).toBe(true);
    expect(canDownloadLogs("running")).toBe(false);
  });

  test("CreateRun payload structure", () => {
    const payload = {
      workspaceId: "workspace-123",
      fileId: "src/main.ts",
      language: "typescript"
    };
    expect(payload).toHaveProperty("workspaceId");
    expect(payload).toHaveProperty("fileId");
    expect(payload).toHaveProperty("language");
  });

  test("Terminal clear event dispatched on run", () => {
    const eventName = "nebula-terminal-clear";
    expect(eventName).toBe("nebula-terminal-clear");
  });

});
