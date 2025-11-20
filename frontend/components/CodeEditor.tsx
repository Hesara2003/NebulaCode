"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language?: string;
  defaultValue?: string;
  theme?: "vs-dark" | "light";
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = "javascript",
  defaultValue = "// Start coding...",
  theme = "vs-dark",
}) => {
  function handleEditorChange(value: string | undefined, event: any) {
    console.log("here is the current model value:", value);
  }

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-gray-700 shadow-lg">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={defaultValue}
        theme={theme}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
