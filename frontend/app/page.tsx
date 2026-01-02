/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ArrowRight, Play, Share2, Zap } from "lucide-react";

import Navbar from "@/components/Navbar";
import { TypingAnimation } from "@/components/TypingAnimation";
import BrandCarousel from "@/components/BrandCarousel";
import ClientFeedback from "@/components/ui/testimonial";
import RotatingGradientRight from "@/components/ui/rotating-gradient-right";
import { Feature108 } from "@/components/ui/feature-108";
import { Timeline } from "@/components/ui/timeline";
import StorySection from "@/components/StorySection";
import CodeEditor from "@/components/CodeEditor";
import Sidebar from "@/components/Sidebar";
import ActivityBar from "@/components/ActivityBar";

const PresenceBar = dynamic(() => import("@/components/PresenceBar"), {
  ssr: false,
});

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );

    if (terminalRef.current) {
      gsap.fromTo(
        terminalRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, delay: 0.4 }
      );
    }

    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.2, delay: 0.6 }
      );
    }

    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          },
        }
      );
    }

    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
          },
        }
      );
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            className="w-full h-full object-cover opacity-60"
            alt="Background"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div ref={heroRef} className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
            v1.0 Public Beta
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Code in the Cloud
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            High-performance cloud IDE with real-time collaboration and AI assistance.
          </p>

          <div ref={terminalRef} className="max-w-xl mx-auto mb-10">
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
              <TypingAnimation
                text="> npm install -g nebulacode"
                className="text-green-400 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/editor"
              className="px-8 py-4 bg-red-500 rounded-lg font-semibold hover:bg-red-600"
            >
              Start Building
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 border border-white/20 rounded-lg hover:bg-white/10"
            >
              Documentation
            </Link>
          </div>

          <div
            ref={statsRef}
            className="grid grid-cols-3 gap-8 mt-16 text-center"
          >
            <div>
              <h3 className="text-3xl font-bold">10K+</h3>
              <p className="text-gray-500">Developers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">99.9%</h3>
              <p className="text-gray-500">Uptime</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">&lt;100ms</h3>
              <p className="text-gray-500">Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <section className="mx-auto max-w-6xl px-6 mt-20">
        <div className="rounded-xl border border-white/10 bg-black/40">
          <div className="flex justify-between px-6 py-4 border-b border-white/10">
            <span className="text-sm text-gray-300">Live Workspace</span>
            <PresenceBar />
          </div>

          <div className="flex h-[360px]">
            <ActivityBar />
            <Sidebar />

            <div className="flex-1 bg-[#1e1e1e]">
              <div className="flex justify-between px-4 py-2 border-b border-[#2d2d2d]">
                <span className="font-mono">app.tsx</span>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-400">
                    <Zap size={12} /> AI
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Share2 size={12} /> Share
                  </span>
                </div>
              </div>

              <CodeEditor
                language="typescript"
                theme="vs-dark"
                value={`export const users = ["Ari", "Nova", "Sol"];`}
              />
            </div>
          </div>
        </div>
      </section>

      <RotatingGradientRight />
      <BrandCarousel />
      <Feature108 />

      <Timeline
        title="How NebulaCode Works"
        subtitle="Build, collaborate, and deploy in minutes."
        steps={[
          { number: "01", title: "Create Workspace", description: "Instant setup" },
          { number: "02", title: "Collaborate", description: "Live coding" },
          { number: "03", title: "Deploy", description: "Ship instantly" },
        ]}
      />

      <ClientFeedback />

      <section ref={ctaRef} className="py-32 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Ready to start building?
        </h2>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-10 py-4 bg-white text-black rounded-full font-bold"
        >
          Get Started <ArrowRight />
        </Link>
      </section>

      <StorySection />

      <footer className="border-t border-white/10 py-10 text-center text-gray-500">
        © 2025 NebulaCode. All rights reserved.
      </footer>
    </main>
  );
}
