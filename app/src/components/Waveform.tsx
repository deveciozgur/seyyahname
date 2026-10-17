'use client';

import { useEffect, useRef } from 'react';

const BAR = 3; // px
const GAP = 3; // px

/**
 * Scrolling amplitude waveform drawn on a canvas.
 * Reads the analyser directly in a rAF loop (no React state per frame).
 * Newest sound enters on the right; older bars fade as they move left.
 */
export default function Waveform({ analyser, active, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim() || '#1f2328';
    const muted = styles.getPropertyValue('--line-strong').trim() || '#c3beb3';

    let width = 0;
    let height = 0;
    let history = new Float32Array(0);
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(8, Math.floor(width / (BAR + GAP)));
      const next = new Float32Array(n);
      next.set(history.slice(-n), Math.max(0, n - history.length));
      history = next;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const buf = analyser ? new Float32Array(analyser.fftSize) : null;
    let raf = 0;
    let last = 0;
    const step = reduce ? 160 : 45; // ms between samples

    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < step) return;
      last = t;

      let level = 0;
      if (analyser && active) {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        level = Math.min(1, Math.sqrt(sum / buf.length) * 5.5);
      }
      history.copyWithin(0, 1);
      history[history.length - 1] = level;

      ctx.clearRect(0, 0, width, height);
      const mid = height / 2;
      const n = history.length;
      const offset = width - n * (BAR + GAP) + GAP;
      for (let i = 0; i < n; i++) {
        const v = history[i];
        const h = Math.max(2, v * (height - 8));
        const x = offset + i * (BAR + GAP);
        ctx.globalAlpha = active ? 0.25 + 0.75 * (i / n) : 1;
        ctx.fillStyle = active && v > 0.02 ? ink : muted;
        ctx.beginPath();
        ctx.roundRect(x, mid - h / 2, BAR, h, BAR / 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-hidden />;
}
