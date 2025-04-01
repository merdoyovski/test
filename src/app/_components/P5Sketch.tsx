"use client";
import { useEffect, useRef, useState } from "react";

interface P5SketchProps {
  color?: string;
  speed?: number;
  backgroundColor?: string;
}

export function P5Sketch({ 
  color = "#ffffff", 
  speed = 1, 
  backgroundColor = "#0000001A" // Hex with alpha
}: P5SketchProps) {
  const sketchRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const particlesRef = useRef<any[]>([]);
  const currentColorRef = useRef(color);
  const currentBackgroundColorRef = useRef(backgroundColor);
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!sketchRef.current || !isClient) return;

    const initP5 = async () => {
      const p5 = (await import('p5')).default;

      const sketch = (p: any) => {
        const num = 100;
        const noiseScale = 500;
        const noiseStrength = 1;

        class Particle {
          loc: any;
          speed: number;
          size: number;

          constructor() {
            this.loc = p.createVector(p.random(p.width), p.random(p.height));
            this.speed = p.random(0.5, 1) * speed;
            this.size = 2;
          }

          run() {
            this.move();
            this.checkEdges();
            this.update();
          }

          move() {
            let noiseVal = p.noise(
              this.loc.x / noiseScale,
              this.loc.y / noiseScale,
              p.frameCount / noiseScale
            );
            let xOffset = p.map(noiseVal, 0, 1, -noiseStrength, noiseStrength);
            this.loc.x += xOffset;
            this.loc.y -= this.speed;
          }

          checkEdges() {
            if (this.loc.y < 0) {
              this.loc.y = p.height;
            }
            if (this.loc.x < 0) {
              this.loc.x = p.width;
            }
            if (this.loc.x > p.width) {
              this.loc.x = 0;
            }
          }

          update() {
            p.fill(currentColorRef.current);
            p.ellipse(this.loc.x, this.loc.y, this.size);
          }

          updateSpeed(newSpeed: number) {
            this.speed = p.random(0.5, 1) * newSpeed;
          }
        }

        p.setup = () => {
          const canvas = p.createCanvas(24, window.innerHeight);
          if (sketchRef.current) {
            canvas.parent(sketchRef.current);
          }
          p.noStroke();
          particlesRef.current = [];
          for (let i = 0; i < num; i++) {
            particlesRef.current[i] = new Particle();
          }
          setIsLoaded(true);
        };

        p.windowResized = () => {
          p.resizeCanvas(24, window.innerHeight);
        };

        p.draw = () => {
          p.fill(currentBackgroundColorRef.current);
          p.rect(0, 0, p.width, p.height);
          for (let i = 0; i < particlesRef.current.length; i++) {
            particlesRef.current[i]?.run();
          }
        };
      };

      // Only create the sketch once
      if (!p5InstanceRef.current && sketchRef.current) {
        p5InstanceRef.current = new p5(sketch, sketchRef.current);
      }
    };

    initP5();

    return () => {
      // Don't remove the sketch on cleanup
      // Only remove when component is unmounted
    };
  }, [isClient]); // Add isClient to dependencies

  // Update particle speeds when speed prop changes
  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.forEach(particle => {
        if (particle) {
          particle.updateSpeed(speed);
        }
      });
    }
  }, [speed]);

  // Update color when color prop changes
  useEffect(() => {
    currentColorRef.current = color;
  }, [color]);

  // Update background color when backgroundColor prop changes
  useEffect(() => {
    currentBackgroundColorRef.current = backgroundColor;
  }, [backgroundColor]);

  return (
    <div className="relative h-full w-full">
      {!isLoaded && (
        <div 
          className="absolute inset-0 h-full w-full"
          style={{ backgroundColor: "#000000" }}
        />
      )}
      <div ref={sketchRef} className="h-full w-full" />
    </div>
  );
} 