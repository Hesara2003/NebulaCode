import Navbar from "@/components/Navbar";
import Link from "next/link";
import { FileText, Book, Code, Terminal } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      <Navbar />
      
      <div className="pt-24 container mx-auto px-6 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:h-[calc(100vh-6rem)] md:sticky md:top-24 overflow-y-auto py-8">
          <div className="mb-8">
            <h4 className="font-bold text-white mb-4 px-2">Getting Started</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="block px-2 py-1.5 text-red-400 bg-red-500/10 rounded-md text-sm font-medium">Introduction</Link></li>
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">Quick Start</Link></li>
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">Installation</Link></li>
            </ul>
          </div>
          
          <div className="mb-8">
            <h4 className="font-bold text-white mb-4 px-2">Core Concepts</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">Workspaces</Link></li>
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">Environments</Link></li>
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">Docker Integration</Link></li>
            </ul>
          </div>

          <div className="mb-8">
            <h4 className="font-bold text-white mb-4 px-2">API Reference</h4>
            <ul className="space-y-1">
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">REST API</Link></li>
              <li><Link href="#" className="block px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md text-sm transition-colors">CLI</Link></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 py-8 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-6 font-heading">Introduction to NebulaCode</h1>
            <p className="text-xl text-gray-400 leading-relaxed mb-8">
              NebulaCode is a cloud-native development environment that allows you to write, run, and debug code from any device. It provides a full VS Code-like experience in your browser, backed by powerful cloud containers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <Book className="text-red-500 mb-4" size={24} />
                <h3 className="text-lg font-bold mb-2">Documentation</h3>
                <p className="text-gray-400 text-sm">Learn how to configure your workspace and use advanced features.</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <Terminal className="text-green-500 mb-4" size={24} />
                <h3 className="text-lg font-bold mb-2">CLI Reference</h3>
                <p className="text-gray-400 text-sm">Manage your workspaces directly from your local terminal.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 mt-12">Why NebulaCode?</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Traditional development environments are tied to a single machine. Setting up a new environment can take hours or even days. With NebulaCode, you can spin up a fresh, consistent environment in seconds.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <div className="mt-1 p-1 rounded-full bg-red-500/20 text-red-500"><Check size={12} /></div>
                <span><strong>Zero Configuration:</strong> Start coding immediately with pre-configured environments.</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <div className="mt-1 p-1 rounded-full bg-red-500/20 text-red-500"><Check size={12} /></div>
                <span><strong>Consistent:</strong> Everyone on your team uses the exact same OS, libraries, and tools.</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <div className="mt-1 p-1 rounded-full bg-red-500/20 text-red-500"><Check size={12} /></div>
                <span><strong>Secure:</strong> Code lives in the cloud, not on laptops. Revoke access instantly.</span>
              </li>
            </ul>

            <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
              <strong>Note:</strong> NebulaCode is currently in Public Beta. Some features may change.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Check({ size }: { size: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
