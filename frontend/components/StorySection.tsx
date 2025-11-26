"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Globe from "@/components/ui/globe";

gsap.registerPlugin(ScrollTrigger);

export default function StorySection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sectionRef.current;
        const content = contentRef.current;
        const globe = globeRef.current;

        if (el && content && globe) {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",
                    toggleActions: "play none none reverse",
                },
            });

            tl.fromTo(
                content,
                { opacity: 0, x: -50 },
                { opacity: 1, x: 0, duration: 1, ease: "power3.out" }
            ).fromTo(
                globe,
                { opacity: 0, scale: 0.8, x: 50 },
                { opacity: 1, scale: 1, x: 0, duration: 1, ease: "power3.out" },
                "-=0.8"
            );
        }
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative py-40 overflow-hidden bg-black"
        >
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-900/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Text Content */}
                    <div ref={contentRef} className="flex-1 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-6 backdrop-blur-sm">
                            <span className="text-lg">🇱🇰</span>
                            <span className="font-medium">Origin Story</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-6 font-heading leading-tight">
                            Born in Sri Lanka, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
                                Built for the World.
                            </span>
                        </h2>

                        <p className="text-lg text-gray-400 leading-relaxed mb-8">
                            NebulaCode is the <span className="text-white font-semibold">first-ever Cloud IDE developed in Sri Lanka</span>.
                            What started as a local initiative has grown into a global platform, empowering developers
                            from Colombo to California to code without limits.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    Global Latency
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Optimized edge network ensuring low latency connections worldwide.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    Local Roots
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Proudly engineered by Sri Lankan talent, competing on the world stage.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Globe Visualization */}
                    <div ref={globeRef} className="flex-1 w-full flex justify-center lg:justify-end relative">
                        {/* Glow Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-[100px] rounded-full opacity-40 pointer-events-none" />
                        <Globe className="w-full max-w-[600px] z-10" />
                    </div>

                </div>
            </div>
        </section>
    );
}
