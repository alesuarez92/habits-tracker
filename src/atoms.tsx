import { useId } from 'react';
import type { HabitKind } from './db';

const TAU = Math.PI * 2;

interface Shell {
  r: number;
  count: number;
  /** Seconds per revolution; shells alternate direction. */
  dur: number;
}

/** Fill shells from the inside out, like electrons: capacities are per shell. */
function fillShells(total: number, radii: number[], capacities: number[], durs: number[]): Shell[] {
  let left = total;
  return radii.map((r, i) => {
    const count = Math.min(left, capacities[i]);
    left -= count;
    return { r, count, dur: durs[i] };
  });
}

/** Concentric circular orbits around (cx, cy), each slowly spinning its particles. */
function Orbits({ cx, cy, shells, dotR, haloLast = false }: { cx: number; cy: number; shells: Shell[]; dotR: number; haloLast?: boolean }) {
  const outer = shells.reduce((last, s, i) => (s.count > 0 ? i : last), -1);
  return (
    <>
      {shells.map((shell, i) => (
        <g
          key={i}
          className="orbit-spin"
          style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: `${shell.dur}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
        >
          <circle cx={cx} cy={cy} r={shell.r} className={i === shells.length - 1 ? 'orbit-ring outer' : 'orbit-ring'} />
          {Array.from({ length: shell.count }, (_, k) => {
            // Offset each shell so particles on neighbouring shells don't line up.
            const t = (TAU * k) / shell.count + i * 0.9;
            const x = cx + shell.r * Math.cos(t);
            const y = cy + shell.r * Math.sin(t);
            return (
              <g key={k}>
                {haloLast && i === outer && k === shell.count - 1 && <circle cx={x} cy={y} r={dotR * 2.4} className="particle-halo" />}
                <circle cx={x} cy={y} r={dotR} className="particle" />
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}

/** SVG ids must be unique per page and safe inside url(#…). */
function useSvgId() {
  return `g${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function NucleusGradient({ id, variant }: { id: string; variant: string }) {
  return (
    <radialGradient id={id} cx="35%" cy="30%" r="75%" className={variant}>
      <stop offset="0" className="stop-hi" />
      <stop offset="1" className="stop-base" />
    </radialGradient>
  );
}

/**
 * A habit as an atom: the nucleus lights up once today is done, and one particle
 * orbits it for each successful day in the last week (2 on the inner shell, 5 on the outer).
 */
export function AtomIcon({ kind, particles, active, burst = 0, size = 48 }: {
  kind: HabitKind;
  particles: number;
  active: boolean;
  /** Changes each time a vote is cast here, replaying the celebration. */
  burst?: number;
  size?: number;
}) {
  const id = useSvgId();
  const shells = fillShells(Math.min(particles, 7), [13, 20.5], [2, 5], [7, 12]);

  return (
    <svg className={`atom ${kind}${active ? ' active' : ''}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs><NucleusGradient id={id} variant={kind} /></defs>
      <Orbits cx={24} cy={24} shells={shells} dotR={2.4} />
      {active && <circle cx="24" cy="24" r="11.5" className="nucleus-glow" />}
      {burst > 0 && <circle key={`w${burst}`} cx="24" cy="24" r="9" className="shockwave" />}
      <circle key={`n${burst}`} cx="24" cy="24" r="7.5" className={burst > 0 ? 'atom-nucleus pulse' : 'atom-nucleus'} style={active ? { fill: `url(#${id})` } : undefined} />
    </svg>
  );
}

export interface IdentityNode {
  name: string;
  votes: number;
  recent: number;
  votedToday: boolean;
}

const MAX_NODES = 5;

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Identities as a molecule: the strongest at the centre, the rest bonded around it. Each dot is a recent vote. */
export function Molecule({ identities, label }: { identities: IdentityNode[]; label: string }) {
  const id = useSvgId();
  const nodes = [...identities].sort((a, b) => b.votes - a.votes).slice(0, MAX_NODES);
  if (nodes.length === 0) return null;

  const W = 342;
  const CY = 110;
  const placed = nodes.map((node, i) => {
    const center = i === 0;
    const r = center ? 20 + Math.min(8, Math.sqrt(node.votes) * 1.2) : 13 + Math.min(6, Math.sqrt(node.votes));
    let x = W / 2;
    let y = CY;
    if (nodes.length === 2) {
      x = center ? 112 : 244;
    } else if (!center) {
      const t = -Math.PI / 5 + (TAU * (i - 1)) / (nodes.length - 1);
      x = W / 2 + 118 * Math.cos(t);
      y = CY + 66 * Math.sin(t);
    }
    const dotR = center ? 3.4 : 2.9;
    const shells = center
      ? fillShells(node.recent, [r + 9, r + 17], [4, 8], [9, 15])
      : fillShells(node.recent, [r + 8, r + 14], [4, 8], [8, 13]);
    const outer = shells[shells.length - 1].r + dotR;
    return { ...node, x, y, r, dotR, shells, outer, center, labelAbove: !center && y < CY };
  });

  // Crop the view to what was drawn, so one or two identities don't float in empty space.
  const top = Math.min(...placed.map((n) => n.y - n.outer - (n.labelAbove ? 18 : 0))) - 6;
  const bottom = Math.max(...placed.map((n) => n.y + n.outer + (n.labelAbove ? 0 : 20))) + 4;

  return (
    <svg className="molecule" viewBox={`0 ${top} ${W} ${bottom - top}`} role="img" aria-label={label}>
      <defs>
        <NucleusGradient id={`${id}-c`} variant="center" />
        <NucleusGradient id={`${id}-s`} variant="satellite" />
      </defs>
      {placed.slice(1).map((n) => (
        <line key={`b-${n.name}`} x1={placed[0].x} y1={placed[0].y} x2={n.x} y2={n.y} className="mol-bond" />
      ))}
      {placed.map((n) => (
        <g key={n.name}>
          <Orbits cx={n.x} cy={n.y} shells={n.shells} dotR={n.dotR} haloLast={n.votedToday} />
          <circle cx={n.x} cy={n.y} r={n.r + 5} className="nucleus-glow" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={`url(#${id}-${n.center ? 'c' : 's'})`} />
          <text x={n.x} y={n.y + (n.center ? 4.5 : 3.5)} textAnchor="middle" className={n.center ? 'mol-count center' : 'mol-count'}>{n.votes}</text>
          <text
            x={Math.min(Math.max(n.x, 52), W - 52)}
            y={n.labelAbove ? n.y - n.outer - 6 : n.y + n.outer + 14}
            textAnchor="middle"
            className="mol-label"
          >
            {truncate(n.name, 22)}
          </text>
        </g>
      ))}
    </svg>
  );
}

const ICON_PATHS = {
  today: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8.5" /><circle cx="20.5" cy="12" r="1" fill="currentColor" /></>,
  habits: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  progress: <><circle cx="7" cy="15" r="3" /><circle cx="17" cy="8" r="3" /><path d="M9.5 13.5l5-4" /></>,
  scorecard: <path d="M12 4v8M8 8h8M8 19h8" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export function Icon({ name, size = 22 }: { name: keyof typeof ICON_PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}
