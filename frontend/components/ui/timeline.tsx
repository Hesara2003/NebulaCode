"use client";

import React from "react";
import { motion } from "framer-motion";

interface TimelineStep {
    number: string;
    title: string;
    description: string;
}

interface TimelineProps {
    title: string;
    subtitle: string;
    steps: TimelineStep[];
}

export function Timeline({ title, subtitle, steps }: TimelineProps) {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 font-heading text-white">
                        {title}
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        {subtitle}
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent transform md:-translate-x-1/2" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Content */}
                                <div className="flex-1 md:text-right">
                                    <div
                                        className={`bg-zinc-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-zinc-900/80 transition-colors ${index % 2 === 0 ? "md:text-left" : "md:text-right"
                                            }`}
                                    >
                                        <div className="text-red-500 font-mono text-sm mb-2">
                                            {step.number}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Center Dot */}
                                <div className="absolute left-[20px] md:left-1/2 w-10 h-10 flex items-center justify-center transform -translate-x-1/2 md:translate-x-[-50%]">
                                    <div className="w-4 h-4 bg-black border-2 border-red-500 rounded-full z-10 relative">
                                        <div className="absolute inset-0 bg-red-500/50 blur-sm rounded-full animate-pulse" />
                                    </div>
                                </div>

                                {/* Spacer for the other side */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
