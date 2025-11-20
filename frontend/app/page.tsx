"use client";

import CodeEditor from "@/components/CodeEditor";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          NebulaCode Cloud IDE
        </p>
      </div>

      <div className="w-full max-w-6xl h-[70vh] flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold">main.js</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
              Run Code
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors">
              Share
            </button>
          </div>
        </div>
        
        <CodeEditor 
          language="javascript"
          theme="vs-dark"
          defaultValue={`// Welcome to NebulaCode
// Start writing your code here...

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
`}
        />
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left mt-12">
        {/* Footer content or features list */}
      </div>
    </main>
  );
}
