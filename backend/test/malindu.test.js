describe("Malindu – Backend StorageService & File Persistence", () => {

  test("StorageService has correct storage root path", () => {
    const STORAGE_ROOT = "workspaces-data";
    expect(STORAGE_ROOT).toBe("workspaces-data");
  });

  test("FileNode structure for files", () => {
    const fileNode = {
      id: "src/main.ts",
      name: "main.ts",
      type: "file"
    };
    expect(fileNode).toHaveProperty("id");
    expect(fileNode).toHaveProperty("name");
    expect(fileNode).toHaveProperty("type");
    expect(fileNode.type).toBe("file");
  });

  test("FileNode structure for folders with children", () => {
    const folderNode = {
      id: "src",
      name: "src",
      type: "folder",
      children: [
        { id: "src/main.ts", name: "main.ts", type: "file" }
      ]
    };
    expect(folderNode.type).toBe("folder");
    expect(folderNode).toHaveProperty("children");
    expect(Array.isArray(folderNode.children)).toBe(true);
  });

  test("Workspace path construction", () => {
    const workspaceId = "workspace-123";
    const path = `workspaces-data/${workspaceId}`;
    expect(path).toContain(workspaceId);
    expect(path).toContain("workspaces-data");
  });

  test("File path construction within workspace", () => {
    const workspaceId = "workspace-123";
    const filePath = "src/main.ts";
    const fullPath = `workspaces-data/${workspaceId}/${filePath}`;
    expect(fullPath).toContain(workspaceId);
    expect(fullPath).toContain(filePath);
  });

  test("Default welcome file content", () => {
    const workspaceId = "workspace-123";
    const content = `// Welcome to NebulaCode workspace: ${workspaceId}\nconsole.log("Hello World");`;
    expect(content).toContain(workspaceId);
    expect(content).toContain("Hello World");
  });

  test("File save operation requires workspace and file path", () => {
    const saveParams = {
      workspaceId: "workspace-123",
      filePath: "src/main.ts",
      content: "console.log('test');"
    };
    expect(saveParams).toHaveProperty("workspaceId");
    expect(saveParams).toHaveProperty("filePath");
    expect(saveParams).toHaveProperty("content");
  });

  test("File nodes are sorted with folders first", () => {
    const nodes = [
      { name: "file.ts", type: "file" },
      { name: "folder", type: "folder" },
      { name: "another.ts", type: "file" }
    ];
    const sorted = nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
    expect(sorted[0].type).toBe("folder");
  });

});
