"use client";

import Editor, { OnChange } from "@monaco-editor/react";

interface MonacoEditorProps {
  fileName?: string;
  language?: string;
  value: string;
  theme?: "vs-dark" | "light";
  onChange?: OnChange;
  readOnly?: boolean;
}

const MonacoEditor = ({
  fileName,
  language = "plaintext",
  value,
  theme = "vs-dark",
  onChange,
  readOnly = false,
}: MonacoEditorProps) => {
  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e]">
      {fileName ? (
        <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 bg-[#252526] border-b border-gray-800">
          <span className="font-mono">{fileName}</span>
        </div>
      ) : null}
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={theme}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
