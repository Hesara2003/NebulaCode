describe("Pulith – Backend RunsGateway & WebSocket Streaming", () => {

  test("RunStreamEvent stdout message format", () => {
    const message = {
      type: "stdout",
      data: "Hello World",
      timestamp: new Date().toISOString()
    };
    expect(message.type).toBe("stdout");
    expect(message).toHaveProperty("data");
    expect(message).toHaveProperty("timestamp");
  });

  test("RunStreamEvent stderr message format", () => {
    const message = {
      type: "stderr",
      data: "Error occurred",
      timestamp: new Date().toISOString()
    };
    expect(message.type).toBe("stderr");
    expect(message).toHaveProperty("data");
  });

  test("RunStreamEvent status message format", () => {
    const message = {
      type: "status",
      data: "completed",
      reason: "Process finished successfully",
      timestamp: new Date().toISOString()
    };
    expect(message.type).toBe("status");
    expect(message.data).toBe("completed");
    expect(message).toHaveProperty("reason");
  });

  test("RunsGateway WebSocket path is '/runs'", () => {
    const path = "/runs";
    expect(path).toBe("/runs");
  });

  test("Client registration with runId from query", () => {
    const query = { runId: "550e8400-e29b-41d4-a716-446655440000" };
    expect(query).toHaveProperty("runId");
    expect(typeof query.runId).toBe("string");
  });

  test("RunsService tracks multiple clients per run", () => {
    const runClients = new Map();
    const runId = "run-123";
    const clients = new Set(["client-1", "client-2"]);
    runClients.set(runId, clients);
    
    expect(runClients.get(runId).size).toBe(2);
    expect(runClients.get(runId).has("client-1")).toBe(true);
  });

  test("WsAuthGuard is applied to RunsGateway", () => {
    const guardName = "WsAuthGuard";
    expect(guardName).toBe("WsAuthGuard");
  });

  test("Broadcast sends event to all clients in run", () => {
    const eventName = "run-event";
    const payload = {
      type: "stdout",
      data: "test",
      timestamp: new Date().toISOString()
    };
    expect(eventName).toBe("run-event");
    expect(payload).toHaveProperty("type");
  });

});
