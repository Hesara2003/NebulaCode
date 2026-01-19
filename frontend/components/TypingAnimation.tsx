"use client";

import { useEffect, useState } from "react";

export const TypingAnimation = ({ text, className }: { text: string; className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setI(0);
  }, [text]);

  useEffect(() => {
    if (i >= text.length) {
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText((prevState) => prevState + text.charAt(i));
      setI((prev) => prev + 1);
    }, 50);

    return () => {
      clearTimeout(timeout);
    };
  }, [i, text]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
};
