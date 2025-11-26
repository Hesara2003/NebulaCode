"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function Globe({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [1, 1, 1],
            markerColor: [1, 0.1, 0.1],
            glowColor: [1, 0.1, 0.1],
            markers: [
                // Sri Lanka
                { location: [7.8731, 80.7718], size: 0.1 },
                // New York
                { location: [40.7128, -74.0060], size: 0.05 },
                // London
                { location: [51.5074, -0.1278], size: 0.05 },
                // Tokyo
                { location: [35.6762, 139.6503], size: 0.05 },
                // Sydney
                { location: [-33.8688, 151.2093], size: 0.05 },
            ],
            onRender: (state) => {
                // Called on every animation frame.
                // `state` will be an empty object, return updated params.
                state.phi = phi;
                phi += 0.01;
            },
        });

        return () => {
            globe.destroy();
        };
    }, []);

    return (
        <div
            className={cn(
                "flex items-center justify-center z-[10] w-full max-w-[600px] mx-auto aspect-square relative",
                className
            )}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    aspectRatio: "1",
                }}
            />
        </div>
    );
}
