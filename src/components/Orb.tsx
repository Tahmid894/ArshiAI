import React, { useEffect, useRef } from 'react';
import { OrbState } from '../types/assistant';

interface OrbProps {
  state: OrbState;
  size?: number;
  onClick?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  color: string;
}

export const Orb: React.FC<OrbProps> = ({ state, size = 260, onClick, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Initialize ambient particles
    const count = 45;
    const particles: Particle[] = [];
    const colors = ['#ec4899', '#8b5cf6', '#38bdf8', '#f43f5e'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * 80,
        speed: (Math.random() - 0.5) * 0.02,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const render = () => {
      timeRef.current += 0.025;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // State-specific physics and colors
      let coreScale = 1;
      let waveAmp = 1;
      let spinSpeed = 1;
      let primaryColor = '#a855f7'; // purple
      let secondaryColor = '#ec4899'; // pink
      let glowColor = 'rgba(168, 85, 247, 0.45)';

      switch (state) {
        case 'idle':
          coreScale = 1 + Math.sin(t * 1.5) * 0.05;
          waveAmp = 4;
          spinSpeed = 0.5;
          primaryColor = '#9333ea';
          secondaryColor = '#e11d48';
          glowColor = 'rgba(147, 51, 234, 0.35)';
          break;

        case 'listening':
          // Pulsing sound-reactive expansion
          coreScale = 1.08 + Math.sin(t * 5) * 0.08 + Math.cos(t * 3.3) * 0.04;
          waveAmp = 12 + Math.sin(t * 4) * 6;
          spinSpeed = 1.2;
          primaryColor = '#ec4899';
          secondaryColor = '#06b6d4';
          glowColor = 'rgba(236, 72, 153, 0.6)';
          break;

        case 'thinking':
          // Rapid energy swirl
          coreScale = 0.95 + Math.sin(t * 6) * 0.06;
          waveAmp = 8;
          spinSpeed = 3.2;
          primaryColor = '#6366f1';
          secondaryColor = '#d946ef';
          glowColor = 'rgba(99, 102, 241, 0.6)';
          break;

        case 'speaking':
          // Dynamic harmonic vocal frequencies
          coreScale = 1.05 + Math.sin(t * 3.8) * 0.09 + Math.sin(t * 7.5) * 0.05;
          waveAmp = 14 + Math.sin(t * 6) * 8;
          spinSpeed = 1.4;
          primaryColor = '#f43f5e';
          secondaryColor = '#8b5cf6';
          glowColor = 'rgba(244, 63, 94, 0.65)';
          break;

        case 'error':
          // Amber/Crimson warning oscillation
          coreScale = 0.96 + (Math.random() - 0.5) * 0.04;
          waveAmp = 6;
          spinSpeed = 0.3;
          primaryColor = '#ef4444';
          secondaryColor = '#f59e0b';
          glowColor = 'rgba(239, 68, 68, 0.55)';
          break;
      }

      const baseRadius = (size * dpr * 0.28) * coreScale;

      // 1. Outer Ethereal Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 2.2);
      bgGlow.addColorStop(0, glowColor);
      bgGlow.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/g, '0.15)'));
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Multi-layered Harmonic Radial Wave Rings
      const ringCount = state === 'listening' ? 4 : state === 'speaking' ? 3 : 2;
      for (let r = 0; r < ringCount; r++) {
        ctx.save();
        ctx.beginPath();
        const ringRad = baseRadius * (1.15 + r * 0.25);
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const offset = Math.sin(theta * (4 + r * 2) + t * (spinSpeed + r * 0.3)) * waveAmp * (1 / (r + 1));
          const rad = ringRad + offset;
          const px = cx + Math.cos(theta) * rad;
          const py = cy + Math.sin(theta) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = r % 2 === 0 ? primaryColor : secondaryColor;
        ctx.lineWidth = 1.5 * dpr;
        ctx.globalAlpha = Math.max(0.15, 0.6 - r * 0.15);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Central Holographic Core Gradient
      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.25,
        cy - baseRadius * 0.25,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius
      );

      if (state === 'error') {
        coreGrad.addColorStop(0, '#fef2f2');
        coreGrad.addColorStop(0.3, '#f87171');
        coreGrad.addColorStop(0.7, '#b91c1c');
        coreGrad.addColorStop(1, '#450a0a');
      } else {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, secondaryColor);
        coreGrad.addColorStop(0.65, primaryColor);
        coreGrad.addColorStop(1, '#1e1035');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 24 * dpr;
      ctx.fill();
      ctx.restore();

      // 4. Orbiting Quantum Particles
      const particles = particlesRef.current;
      particles.forEach((p) => {
        p.angle += p.speed * spinSpeed;
        const targetR = baseRadius * 1.05 + Math.sin(t + p.angle * 3) * (waveAmp * 1.5);
        const px = cx + Math.cos(p.angle) * targetR;
        const py = cy + Math.sin(p.angle) * targetR;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = state === 'error' ? '#fbbf24' : p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * dpr;
        ctx.fill();
        ctx.restore();
      });

      // 5. Specular Holographic Lens Highlight
      const highlight = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.45,
        1,
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.45,
        baseRadius * 0.6
      );
      highlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx - baseRadius * 0.35, cy - baseRadius * 0.45, baseRadius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = highlight;
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, size]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label={`ArshiAI Orb (${state})`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none drop-shadow-2xl"
      />
    </div>
  );
};
