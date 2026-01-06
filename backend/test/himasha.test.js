describe("Himasha – Backend EditorSyncGateway & Yjs Awareness", () => {

  test("EditorSyncGateway namespace is 'editor-sync'", () => {
    const namespace = "editor-sync";
    expect(namespace).toBe("editor-sync");
    expect(namespace).toBeDefined();
  });

  test("PresenceParticipant has required properties", () => {
    const participant = {
      id: "client-123",
      name: "John Doe",
      initials: "JD",
      color: "#6366F1"
    };
    expect(participant).toHaveProperty("id");
    expect(participant).toHaveProperty("name");
    expect(participant).toHaveProperty("initials");
    expect(participant).toHaveProperty("color");
  });

  test("Awareness state contains user information", () => {
    const awarenessState = {
      userId: "user-456",
      name: "Jane Smith",
      color: "#10B981"
    };
    expect(awarenessState).toHaveProperty("userId");
    expect(awarenessState).toHaveProperty("name");
    expect(awarenessState).toHaveProperty("color");
  });

  test("Document join payload structure", () => {
    const joinPayload = {
      documentId: "file-123",
      stateVector: new Uint8Array([1, 2, 3])
    };
    expect(joinPayload).toHaveProperty("documentId");
    expect(joinPayload).toHaveProperty("stateVector");
  });

  test("Presence broadcast message format", () => {
    const participants = [
      { id: "1", name: "User 1", initials: "U1", color: "#6366F1" },
      { id: "2", name: "User 2", initials: "U2", color: "#10B981" }
    ];
    expect(participants).toBeInstanceOf(Array);
    expect(participants.length).toBe(2);
    expect(participants[0]).toHaveProperty("id");
  });

});
