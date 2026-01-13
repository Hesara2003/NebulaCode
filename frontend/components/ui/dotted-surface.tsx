"use client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points[];
    animationId: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000,
      );
      camera.position.set(0, 355, 1220);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(scene.fog.color, 0);

    // Attach canvas and ensure it stays behind all content.
    // Append the canvas to document.body to guarantee it sits behind all content
    // even when sections create new stacking contexts (transforms, z-index, etc.).
    const canvas = renderer.domElement as HTMLCanvasElement;
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    // Use a negative z-index so the canvas sits behind the page content
    canvas.style.zIndex = '-1';

    let appendedToBody = false;
    try {
      if (document && document.body) {
        document.body.appendChild(canvas);
        appendedToBody = true;
      } else if (containerRef.current) {
        containerRef.current.appendChild(canvas);
      }
    } catch (e) {
      // Fallback to mounting inside the container if body append fails for any reason
      if (containerRef.current) containerRef.current.appendChild(canvas);
    }

    // Create particles
    const particles: THREE.Points[] = [];
    const positions: number[] = [];
    const colors: number[] = [];

    // Create geometry for all particles
    const geometry = new THREE.BufferGeometry();

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0; // Will be animated
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        if (theme === 'dark') {
          colors.push(200, 200, 200);
        } else {
          colors.push(0, 0, 0);
        }
      }
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId = 0;

    // Animation function
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positions = positionAttribute.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;

          // Animate Y position with sine waves
          positions[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;

          i++;
        }
      }

      positionAttribute.needsUpdate = true;

      // Update point sizes based on wave
      const customMaterial = material as THREE.PointsMaterial & {
        uniforms?: Record<string, unknown>;
      };
      if (!customMaterial.uniforms) {
        // For dynamic size changes, we'd need a custom shader
        // For now, keeping constant size for performance
      }

      renderer.render(scene, camera);
      count += 0.1;
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start animation
    animate();

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles: [points],
      animationId,
      count,
    };

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);

        // Clean up Three.js objects
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        sceneRef.current.renderer.dispose();

        if (sceneRef.current && sceneRef.current.renderer.domElement) {
          const domEl = sceneRef.current.renderer.domElement as HTMLCanvasElement;
          if (appendedToBody && document && document.body && document.body.contains(domEl)) {
            document.body.removeChild(domEl);
          } else if (containerRef.current && containerRef.current.contains(domEl)) {
            containerRef.current.removeChild(domEl);
          }
        }
      }
    };
    } catch (error) {
      console.warn('[DottedSurface] WebGL not available, skipping 3D background:', error);
      // Gracefully continue without 3D background
      return () => {}; // Return empty cleanup function
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 -z-20', className)}
      {...props}
    />
  );
}
