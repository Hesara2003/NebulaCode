"use client";

import { useCallback, useEffect, useState } from "react";
import MonacoEditor from "./MonacoEditor";
import type { FileEntity } from "@/types/editor";
import { getFile } from "@/lib/api/files";

interface EditorPaneProps {
  workspaceId: string;
  fileId: string;
}

const EditorPane = ({ workspaceId, fileId }: EditorPaneProps) => {
  const [file, setFile] = useState<FileEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getFile(workspaceId, fileId);
      setFile(data);
    } catch (error) {
      console.error("Failed to load file", error);
      setFile(null);
      setErrorMessage("Unable to load file from the backend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, fileId]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  const resolvedFile: FileEntity =
    file ?? {
      id: "placeholder-file",
      name: "welcome.ts",
      path: "/welcome.ts",
      language: "typescript",
      content:
        "// Welcome to Monaco\n// Your file will appear as soon as the backend responds.\n",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  return (
    <div className="relative h-full w-full">
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-black/60 text-xs uppercase tracking-[0.3em] text-gray-100">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Loading file...
        </div>
      ) : null}
      {errorMessage ? (
        <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-11/12 max-w-lg flex-col items-center gap-3 rounded-md border border-red-500/40 bg-red-900/50 px-4 py-3 text-center text-sm text-red-50">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={loadFile}
            className="rounded bg-red-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-red-400"
          >
            Retry
          </button>
        </div>
      ) : null}
      <MonacoEditor
        fileName={resolvedFile.name}
        language={resolvedFile.language}
        value={resolvedFile.content ?? ""}
        onChange={(value: string | undefined) =>
          setFile((prev: FileEntity | null) => ({
            ...(prev ?? resolvedFile),
            content: value ?? prev?.content ?? resolvedFile.content ?? "",
          }))
        }
      />
    </div>
  );
};

export default EditorPane;
