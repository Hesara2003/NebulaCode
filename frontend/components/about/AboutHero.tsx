"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AboutHero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      titleRef.current,
      { scale: 1.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5, ease: "power4.out" }
    ).fromTo(
      subtitleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
      "-=1"
    );
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://wallpapers.com/images/hd/gta-5-background-790-x-485-3p67543853875385.jpg')] bg-cover bg-center opacity-40 grayscale hover:grayscale-0 transition-all duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h1
          ref={titleRef}
          className="text-7xl md:text-9xl font-bold text-white tracking-tighter mb-4 drop-shadow-2xl"
          style={{ fontFamily: "Impact, sans-serif" }}
        >
          <span className="text-[#2E8B57]">NEBULA</span>CODE
        </h1>
        <div className="h-1 w-32 bg-[#2E8B57] mx-auto mb-6" />
        <p
          ref={subtitleRef}
          className="text-xl md:text-3xl text-gray-200 font-medium tracking-widest uppercase"
        >
          Wasted Potential? <span className="text-[#2E8B57] font-bold">Never.</span>
        </p>
      </div>

      {/* GTA Style Corner UI */}
      <div className="absolute top-24 right-6 md:right-12 text-right">
        <div className="text-4xl font-bold text-[#2E8B57] drop-shadow-md" style={{ fontFamily: "Impact, sans-serif" }}>
          $ 1,000,000,000
        </div>
        <div className="text-sm text-white uppercase tracking-wider font-bold">
          Cloud Credits
        </div>
      </div>
    </section>
  );
}
