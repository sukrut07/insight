import React, { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseAlpha: number;
}

interface TrailPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

export const InteractiveDotCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Just render static dots once
      drawStaticDots(canvas, ctx);
      return;
    }

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let animationFrameId: number;
    let isVisible = true;

    // Canvas size
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Subtle pastel palette matching theme tokens
    const pastelColors = [
      'rgba(205, 239, 212, ', // mint
      'rgba(232, 221, 251, ', // lavender
      'rgba(200, 233, 247, ', // blue
      'rgba(248, 207, 208, ', // pink
      'rgba(249, 233, 183, ', // yellow
    ];

    // Initialize grid of dots (spacing ~48px for clean, uncluttered look)
    const spacing = 52;
    const dots: Dot[] = [];

    const initDots = () => {
      dots.length = 0;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + (j % 2 === 0 ? 0 : spacing * 0.5) + (Math.random() - 0.5) * 8;
          const y = j * spacing + (Math.random() - 0.5) * 8;
          const colorPrefix = pastelColors[(i + j) % pastelColors.length];
          dots.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            radius: Math.random() * 1.5 + 2.0, // 2.0 - 3.5px
            color: colorPrefix,
            baseAlpha: Math.random() * 0.15 + 0.12, // 12% - 27% (max < 30%)
          });
        }
      }
    };

    initDots();

    // Mouse coordinates
    let mouseX = -1000;
    let mouseY = -1000;
    const trail: TrailPoint[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (!isTouch) {
        trail.push({
          x: mouseX,
          y: mouseY,
          radius: Math.random() * 3 + 3,
          alpha: 0.35,
          color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        });

        if (trail.length > 25) {
          trail.shift();
        }
      }
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initDots();
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Animation loop
    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        // Render interactive dots
        const mouseRadius = 140;

        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];

          // Compute distance to mouse
          const dx = mouseX - dot.x;
          const dy = mouseY - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius && dist > 0) {
            // Gentle repulsive force
            const force = (1 - dist / mouseRadius) * 18;
            const angle = Math.atan2(dy, dx);
            const targetX = dot.originX - Math.cos(angle) * force;
            const targetY = dot.originY - Math.sin(angle) * force;

            dot.x += (targetX - dot.x) * 0.15;
            dot.y += (targetY - dot.y) * 0.15;
          } else {
            // Return to origin with gentle spring
            dot.x += (dot.originX - dot.x) * 0.08;
            dot.y += (dot.originY - dot.y) * 0.08;
          }

          // Subtle nearby connection lines only for closest neighboring dots near mouse
          if (dist < mouseRadius * 0.75) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(36, 36, 36, ${(1 - dist / mouseRadius) * 0.08})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }

          // Draw Dot
          const currentAlpha = dist < mouseRadius ? Math.min(dot.baseAlpha + 0.15, 0.3) : dot.baseAlpha;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${dot.color}${currentAlpha})`;
          ctx.fill();

          // Delicate 1px border for neo-brutalist crispness
          ctx.strokeStyle = `rgba(36, 36, 36, ${currentAlpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Render subtle cursor trail (desktop only)
        if (!isTouch && trail.length > 0) {
          for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            p.alpha *= 0.92;
            p.radius *= 0.97;

            if (p.alpha > 0.02) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(p.radius, 1.5), 0, Math.PI * 2);
              ctx.fillStyle = `${p.color}${Math.min(p.alpha, 0.28)})`;
              ctx.fill();
            }
          }

          // Filter out faded points
          for (let i = trail.length - 1; i >= 0; i--) {
            if (trail[i].alpha <= 0.02) {
              trail.splice(i, 1);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-hidden"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
};

function drawStaticDots(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
  const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
  ctx.clearRect(0, 0, width, height);

  const colors = [
    'rgba(205, 239, 212, 0.2)',
    'rgba(232, 221, 251, 0.2)',
    'rgba(200, 233, 247, 0.2)',
    'rgba(248, 207, 208, 0.2)',
    'rgba(249, 233, 183, 0.2)',
  ];

  const spacing = 52;
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * spacing + (j % 2 === 0 ? 0 : spacing * 0.5);
      const y = j * spacing;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = colors[(i + j) % colors.length];
      ctx.fill();
    }
  }
}
