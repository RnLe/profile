/**
 * The scale of Blaze2D as a few counters that run up to their values when
 * the panel comes into view, each with a thin rule filling underneath, and
 * run again after it has left the view. The server renders the final
 * numbers, which stay as they are without JavaScript or under reduced
 * motion.
 */
import { useEffect, useRef, useState } from 'react';
import type { ScaleMetric } from '../../data/blaze-scale';

const DURATION = 1800;
const STAGGER = 140;

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const format = (value: number) => value.toLocaleString('en-US');

export default function BlazeScale({ metrics }: { metrics: ScaleMetric[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(Number.POSITIVE_INFINITY);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let running = false;
    const total = DURATION + STAGGER * (metrics.length - 1);
    const run = () => {
      if (running) return;
      running = true;
      const start = performance.now();
      const tick = (now: number) => {
        const time = now - start;
        setElapsed(time);
        if (time < total) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      running = false;
      setElapsed(0);
    };
    reset();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.35) run();
        else if (!entry.isIntersecting) reset();
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [metrics.length]);

  return (
    <div className="blaze-scale" ref={ref}>
      {metrics.map((metric, index) => {
        const progress = easeOut(Math.min(1, Math.max(0, (elapsed - index * STAGGER) / DURATION)));
        return (
          <div className="scale-metric" key={metric.label}>
            <p className="scale-value" aria-hidden="true">
              {format(Math.round(metric.value * progress))}
            </p>
            <p className="scale-label">
              <span className="visually-hidden">{format(metric.value)} </span>
              {metric.label}
            </p>
            <p className="scale-detail">{metric.detail}</p>
            <span className="scale-rule" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
