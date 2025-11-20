"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DottedSurface } from '@/components/ui/dotted-surface'

export default function RotatingGradientRight() {
  return (
    <section className="min-h-screen w-full bg-black text-white px-8 py-16 md:px-16 relative">
      <DottedSurface className="pointer-events-none absolute inset-0 h-full w-full opacity-15" width={20} height={20} />
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 relative z-10">
        {/* LEFT: Text */}
        <div className="relative mx-auto flex h-[40rem] w-full max-w-[60rem] items-center justify-center overflow-hidden rounded-3xl">
          {/* Rotating conic gradient glow */}
          <div className="absolute -inset-10 flex items-center justify-center">
            <div
              className="
                h-[120%] w-[120%] rounded-[36px] blur-3xl opacity-80
                bg-[conic-gradient(from_0deg,theme(colors.red.500),theme(colors.black),theme(colors.red.500),theme(colors.black))]
                animate-[spin_8s_linear_infinite]
              "
            />
          </div>

          {/* Black card inside the glow */}
          <Card className="w-[340px] z-10 rounded-2xl border border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">NebulaCode</span>
                <span className="text-xs text-zinc-400">99 / 99</span>
              </div>

              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full
                                bg-[linear-gradient(90deg,theme(colors.red.400),theme(colors.red.500),theme(colors.red.600))]" />
              </div>

              <p className="text-xs text-zinc-400">
                Initializing workspace… please keep the session open until setup is complete.
              </p>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Rotating gradient with black card */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl lg:text-3xl font-normal text-white leading-relaxed">
            NebulaCode {" "}
            <span className="text-gray-400 text-sm sm:text-base lg:text-3xl">Build powerful cloud development environments with real-time collaboration, instant Docker sandboxes, and AI assistance. No setup required.</span>
          </h2>
          <Button variant="link" className="px-0 bg-black text-white">
            Try NebulaCode <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}