"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const BlurredTextReveal = ({ text, className }: { text: string; className?: string }) => {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { filter: "blur(10px)", opacity: 0, y: 20 },
        {
          filter: "blur(0px)",
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 85%",
          },
        }
      );
    }
  }, []);

  return (
    <p ref={textRef} className={className}>
      {text}
    </p>
  );
};
