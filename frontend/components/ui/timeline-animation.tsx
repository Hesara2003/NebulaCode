"use client";
import React, { useRef, useEffect } from "react";
import { motion, useInView, useAnimation, Variant } from "framer-motion";

interface TimelineContentProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  customVariants?: {
    visible: (i: number) => Variant;
    hidden: Variant;
  };
}

export const TimelineContent: React.FC<TimelineContentProps> = ({
  children,
  as: Component = "div",
  className = "",
  animationNum = 0,
  timelineRef,
  customVariants,
  ...props
}) => {
  const controls = useAnimation();
  const ref = useRef(null);
  // Use the provided timelineRef or fallback to local ref
  const inViewRef = timelineRef || ref;
  const isInView = useInView(inViewRef, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const defaultVariants = {
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <Component
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={customVariants || defaultVariants}
      custom={animationNum}
      {...props}
    >
      {children}
    </Component>
  );
};
