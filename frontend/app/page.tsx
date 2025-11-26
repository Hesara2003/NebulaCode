"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { TypingAnimation } from "@/components/TypingAnimation";
import BrandCarousel from "@/components/BrandCarousel";
import ClientFeedback from "@/components/ui/testimonial";
import Navbar from "@/components/Navbar";
import RotatingGradientRight from "@/components/ui/rotating-gradient-right";
import { Feature108 } from "@/components/ui/feature-108";
import { Timeline } from "@/components/ui/timeline";
import StorySection from "@/components/StorySection";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animation
    const tl = gsap.timeline();

    tl.fromTo(
      heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }
    );

    // Terminal Animation
    if (terminalRef.current) {
      gsap.fromTo(
        terminalRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.5,
          ease: "power2.out"
        }
      );
    }

    // Stats Animation
    if (statsRef.current) {
      const statItems = statsRef.current.children;
      gsap.fromTo(
        statItems,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          delay: 0.8,
          ease: "power2.out"
        }
      );
    }

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

    // CTA Section Animation
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
          }
        }
      );
    }

  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500 selection:text-white font-sans">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Simple Background */}
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="Space Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        <div ref={heroRef} className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-sm font-medium text-red-400 mb-12">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            v1.0 Public Beta is Live
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white font-heading">
            Code in the Cloud
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            A high-performance cloud IDE with real-time collaboration,
            instant Docker sandboxes, and a powerful AI assistant.
          </p>

          {/* Terminal Preview */}
          <div ref={terminalRef} className="mb-12 max-w-2xl mx-auto">
            <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-left font-mono text-sm">
                <TypingAnimation
                  text="> npm install -g nebulacode"
                  className="text-green-400"
                />
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/editor"
              className="px-8 py-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Start Building Free
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              View Documentation
            </Link>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-gray-500">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">&lt;100ms</div>
              <div className="text-sm text-gray-500">Latency</div>
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
      <Timeline
        title="How NebulaCode Works"
        subtitle="From zero to deployed in minutes. We handle the infrastructure so you can focus on code."
        steps={[
          {
            number: "01",
            title: "Create Workspace",
            description: "Spin up a new environment in seconds. Choose your stack, and we'll provision the containers instantly."
          },
          {
            number: "02",
            title: "Code & Collaborate",
            description: "Invite your team. Edit files together, share terminals, and debug in real-time with low latency."
          },
          {
            number: "03",
            title: "Deploy Anywhere",
            description: "Push to GitHub or deploy directly to our cloud. Your code is always production-ready."
          }
        ]}
      />

      {/* Testimonials Section */}
      <ClientFeedback />

      {/* CTA Section */}
      <section ref={ctaRef} className="py-32 relative overflow-hidden">
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

      {/* Story Section */}
      <StorySection />

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400 text-sm flex flex-col md:flex-row items-center gap-4">
            <img src="/Nebula Logo.svg" alt="NebulaCode Logo" className="h-8 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
            <span>© 2025 NebulaCode. All rights reserved.</span>
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
