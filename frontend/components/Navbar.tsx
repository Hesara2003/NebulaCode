"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/Nebula Logo.svg" alt="NebulaCode Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold tracking-tighter font-heading">
            Nebula<span className="text-red-500">Code</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</Link>
          <Link
            href="/editor"
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full hover:bg-red-600 transition-colors"
          >
            Launch Editor
          </Link>
        </div>
      </div>
    </nav>
  );
}
