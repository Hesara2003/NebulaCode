/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Code2, Cpu, Globe, Layers, Terminal, Zap, CheckCircle2, Star } from "lucide-react";
import { TypingAnimation } from "@/components/TypingAnimation";
import { BlurredTextReveal } from "@/components/BlurredTextReveal";
import BrandCarousel from "@/components/BrandCarousel";
import ClientFeedback from "@/components/ui/testimonial";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import RotatingGradientRight from "@/components/ui/rotating-gradient-right";
import { Feature108 } from "@/components/ui/feature-108";
import CodeEditor from "@/components/CodeEditor";
import Sidebar from "@/components/Sidebar";
import ActivityBar from "@/components/ActivityBar";
import dynamic from "next/dynamic";
import { Play, Share2 } from "lucide-react";

const PresenceBar = dynamic(() => import("@/components/PresenceBar"), {
  ssr: false,
});


gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animation
    const tl = gsap.timeline();
    
    tl.fromTo(
      heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }
    );

    // Features Scroll Animation
    const features = featuresRef.current?.children;
    if (features) {
      gsap.fromTo(
        features,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // How It Works Animation
    const steps = howItWorksRef.current?.children;
    if (steps) {
        gsap.fromTo(
            steps,
            { opacity: 0, x: -50 },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                stagger: 0.3,
                scrollTrigger: {
                    trigger: howItWorksRef.current,
                    start: "top 75%",
                }
            }
        )
    }

  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500 selection:text-white font-sans">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Black Hole Image Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/60 z-10" /> {/* Overlay */}
            <img 
                src="https://media.idownloadblog.com/wp-content/uploads/2015/01/star-gazing-night-bw-9-wallpaper.jpg" 
                alt="Star Gazing Night" 
                className="w-full h-full object-cover opacity-50"
            />
        </div>

        <div ref={heroRef} className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/50 bg-red-500/10 text-xs font-medium text-red-400 mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            v1.0 Public Beta is Live
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 font-heading">
            The Future of <br />
            <span className="text-white">Cloud Development</span>
          </h1>
          
          <div className="h-8 mb-10">
             <TypingAnimation 
                text="> npm install -g nebulacode" 
                className="text-lg md:text-xl text-green-400 font-mono"
             />
          </div>
          
          <BlurredTextReveal 
            text="A high-performance cloud IDE with real-time collaboration, instant Docker sandboxes, and a powerful AI assistant."
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/editor"
              className="group relative px-8 py-4 bg-red-500 text-white font-bold rounded-full overflow-hidden transition-transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Building <ArrowRight size={18} />
              </span>
            </Link>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm">
              Read the Docs
            </button>
          </div>
        </div>
      </section>

      {/* Collaboration Preview */}
      <section id="live-preview" className="relative z-20 mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-lg shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live Workspace Preview
            </div>
            <PresenceBar />
          </div>
          <div className="flex h-[360px] overflow-hidden rounded-b-2xl">
            <ActivityBar />
            <Sidebar />
            <div className="flex flex-1 flex-col bg-[#1e1e1e]">
              <div className="flex items-center justify-between border-b border-[#2d2d2d] px-4 py-2 text-sm text-gray-300">
                <span className="font-mono">app.tsx</span>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wide">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Zap size={12} /> AI Assist
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Share2 size={12} /> Share
                  </span>
                </div>
              </div>
              <div className="flex flex-1">
                <CodeEditor
                  language="typescript"
                  theme="vs-dark"
                  defaultValue={`/**
 * NebulaCode Presence Demo
 */

export const collaborators = [
  "Ari",
  "Nova",
  "Sol",
  "Zen"
];
`}
                />
              </div>
              <div className="border-t border-[#2d2d2d] bg-[#151515] px-4 py-2 text-xs text-gray-400">
                Participants who join the room instantly appear above with their colors and initials.
              </div>
            </div>
            <div className="hidden w-72 border-l border-white/10 bg-[#151515] p-4 lg:flex lg:flex-col lg:justify-between">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">Presence Insights</h3>
                <p className="text-xs text-gray-400">
                  This panel reacts when awareness updates arrive from Yjs. Try opening another tab to see the list change in real time.
                </p>
              </div>
              <button className="mt-6 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-blue-500">
                <Share2 size={12} /> Invite Teammate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rotating Gradient Section */}
      <RotatingGradientRight />

      {/* Brand Carousel */}
      <BrandCarousel />

      {/* Features Section */}
      <Feature108 />

      {/* How It Works Section */}
      <section className="py-32 bg-[#050505] relative z-20 border-t border-white/5">
        <div className="container mx-auto px-6">
            <div className="mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">How NebulaCode Works</h2>
                <p className="text-gray-400 max-w-xl">From zero to deployed in minutes. We handle the infrastructure so you can focus on code.</p>
            </div>

            <div ref={howItWorksRef} className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="relative">
                    <div className="text-8xl font-bold text-white/5 absolute -top-10 -left-4 font-heading">01</div>
                    <h3 className="text-2xl font-bold mb-4 relative z-10 font-heading">Create Workspace</h3>
                    <p className="text-gray-400 relative z-10">Spin up a new environment in seconds. Choose your stack, and we will provision the containers instantly.</p>
                </div>
                <div className="relative">
                    <div className="text-8xl font-bold text-white/5 absolute -top-10 -left-4 font-heading">02</div>
                    <h3 className="text-2xl font-bold mb-4 relative z-10 font-heading">Code & Collaborate</h3>
                    <p className="text-gray-400 relative z-10">Invite your team. Edit files together, share terminals, and debug in real-time with low latency.</p>
                </div>
                <div className="relative">
                    <div className="text-8xl font-bold text-white/5 absolute -top-10 -left-4 font-heading">03</div>
                    <h3 className="text-2xl font-bold mb-4 relative z-10 font-heading">Deploy Anywhere</h3>
                    <p className="text-gray-400 relative z-10">Push to GitHub or deploy directly to our cloud. Your code is always production-ready.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <ClientFeedback />

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-black z-0" />
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 font-heading">Ready to code in the cloud?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of developers building the future with NebulaCode.</p>
            <Link 
              href="/editor"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Get Started for Free <ArrowRight size={18} />
            </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400 text-sm">
            © 2025 NebulaCode. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
