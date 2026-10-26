import type { HabitKind } from './db';

const TAU = Math.PI * 2;

/** A point on an ellipse (rx, ry) centred at (cx, cy) and rotated by `deg`. */
function onOrbit(cx: number, cy: number, rx: number, ry: number, deg: number, t: number) {
  const a = (deg * Math.PI) / 180;
  const x = rx * Math.cos(t);
  const y = ry * Math.sin(t);
  return { x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a), behind: Math.sin(t) < 0 };
}

/**
 * A habit as an atom: the nucleus fills in once today is done, and one particle
 * orbits it for each successful day in the last week.
 */
export function AtomIcon({ kind, particles, active, size = 48 }: { kind: HabitKind; particles: number; active: boolean; size?: number }) {
  const slots = Array.from({ length: 7 }, (_, k) => onOrbit(24, 24, 22, 10, -25, (TAU * k) / 7));
  const shown = slots.slice(0, Math.min(particles, 7));
  const dot = (p: { x: number; y: number }, i: number) => <circle key={i} cx={p.x} cy={p.y} r={2.7} className="atom-particle" />;

  return (
    <svg className={`atom ${kind}${active ? ' active' : ''}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="24" rx="22" ry="10" transform="rotate(-25 24 24)" className="atom-orbit" />
      {shown.filter((p) => p.behind).map(dot)}
      <circle cx="24" cy="24" r="9" className="atom-nucleus" />
      {shown.filter((p) => !p.behind).map(dot)}
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
const MAX_PARTICLES = 12;

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Identities as a molecule: the strongest at the centre, the rest bonded around it. Every dot is a vote. */
export function Molecule({ identities, label }: { identities: IdentityNode[]; label: string }) {
  const nodes = [...identities].sort((a, b) => b.votes - a.votes).slice(0, MAX_NODES);
  if (nodes.length === 0) return null;

  const W = 342;
  const H = 236;
  const placed = nodes.map((node, i) => {
    const center = i === 0;
    const r = center ? 24 + Math.min(10, Math.sqrt(node.votes) * 1.5) : 16 + Math.min(8, Math.sqrt(node.votes) * 1.2);
    let x = W / 2;
    let y = 104;
    if (nodes.length === 2) {
      x = center ? 112 : 250;
    } else if (!center) {
      const t = -Math.PI / 5 + (TAU * (i - 1)) / (nodes.length - 1);
      x = W / 2 + 112 * Math.cos(t);
      y = 104 + 62 * Math.sin(t);
    }
    const tilt = [-25, 20, -15, 30, -35][i];
    const orbitR = r + 18;
    const count = Math.min(node.recent, MAX_PARTICLES);
    const particles = Array.from({ length: count }, (_, k) => ({
      ...onOrbit(x, y, orbitR, orbitR * 0.45, tilt, (TAU * k) / Math.max(count, 1)),
      newest: node.votedToday && k === count - 1,
    }));
    return { ...node, x, y, r, tilt, orbitR, particles, center };
  });

  // Crop the view to what was drawn, so one or two identities don't float in empty space.
  const labelBelow = (n: (typeof placed)[number]) => n.y + n.r + 30 < H;
  const top = Math.min(...placed.map((n) => (labelBelow(n) ? n.y - n.orbitR * 0.75 : n.y - n.r - 30))) - 8;
  const bottom = Math.max(...placed.map((n) => (labelBelow(n) ? n.y + n.r + 30 : n.y + n.orbitR * 0.75))) + 4;

  return (
    <svg className="molecule" viewBox={`0 ${top} ${W} ${bottom - top}`} role="img" aria-label={label}>
      {placed.slice(1).map((n) => (
        <line key={`b-${n.name}`} x1={placed[0].x} y1={placed[0].y} x2={n.x} y2={n.y} className="mol-bond" />
      ))}
      {placed.map((n) => {
        const dot = (p: (typeof n.particles)[number], k: number) => (
          <g key={k}>
            {p.newest && <circle cx={p.x} cy={p.y} r={9} className="mol-halo" />}
            <circle cx={p.x} cy={p.y} r={n.center ? 4 : 3.4} className="mol-particle" />
          </g>
        );
        const below = labelBelow(n);
        return (
          <g key={n.name}>
            <ellipse cx={n.x} cy={n.y} rx={n.orbitR} ry={n.orbitR * 0.45} transform={`rotate(${n.tilt} ${n.x} ${n.y})`} className="mol-orbit" />
            {n.particles.filter((p) => p.behind).map(dot)}
            <circle cx={n.x} cy={n.y} r={n.r} className={n.center ? 'mol-nucleus center' : 'mol-nucleus'} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" className="mol-count">{n.votes}</text>
            {n.particles.filter((p) => !p.behind).map(dot)}
            <text
              x={Math.min(Math.max(n.x, 50), W - 50)}
              y={below ? n.y + n.r + 26 : n.y - n.r - 16}
              textAnchor="middle"
              className="mol-label"
            >
              {truncate(n.name, 22)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const ICON_PATHS = {
  today: <><circle cx="12" cy="12" r="3.5" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" /></>,
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
