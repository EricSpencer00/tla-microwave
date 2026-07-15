import { useMemo } from 'react';
import { Vars, Init, MAX_TIME, eqVars } from '../model/state';
import { Next, Safe } from '../checker/spec';
import { reachable } from '../checker/bfs';
import { TraceRow } from '../sim/engine';

// The entire reachable state space, drawn as a grid:
//   columns = time (0..MAX_TIME), rows = (power, door, radiation) combos.
// Nodes the user has visited are filled; the current state pulses; edges
// are drawn from the current state so you can see exactly which disjuncts
// of Next are enabled right now. Unsafe states (reachable only through
// dangerous mode) appear in red — they are NOT in the reachable set of the
// spec, which is the whole point.

const key = (v: Vars) => `${v.door}|${v.time}|${v.radiation}|${v.power}`;

// Canonical row order, roughly "more is happening" as you go down.
const ROWS: { door: Vars['door']; radiation: Vars['radiation']; power: Vars['power']; label: string; unsafe?: boolean }[] = [
  { power: 'OFF', door: 'OPEN',   radiation: 'OFF', label: 'power off · door open' },
  { power: 'OFF', door: 'CLOSED', radiation: 'OFF', label: 'power off · door closed' },
  { power: 'ON',  door: 'OPEN',   radiation: 'OFF', label: 'power on · door open' },
  { power: 'ON',  door: 'CLOSED', radiation: 'OFF', label: 'power on · door closed' },
  { power: 'ON',  door: 'CLOSED', radiation: 'ON',  label: 'RADIATING · door closed' },
  { power: 'OFF', door: 'CLOSED', radiation: 'ON',  label: 'RADIATING · power off' },
  { power: 'ON',  door: 'OPEN',   radiation: 'ON',  label: 'RADIATING · DOOR OPEN', unsafe: true },
  { power: 'OFF', door: 'OPEN',   radiation: 'ON',  label: 'RADIATING · DOOR OPEN', unsafe: true },
];

const rowIndex = (v: Vars) =>
  ROWS.findIndex(r => r.door === v.door && r.radiation === v.radiation && r.power === v.power);

const LABEL_W = 190;
const CELL_W = 52;
const CELL_H = 44;
const PAD = 16;
const R = 9;

const cx = (v: Vars) => LABEL_W + PAD + v.time * CELL_W + CELL_W / 2;

const ACTION_COLOR: Record<string, string> = {
  TogglePower: 'var(--gr-power)',
  IncrementTime: 'var(--gr-time)',
  Start: 'var(--gr-start)',
  Tick: 'var(--gr-tick)',
  Cancel: 'var(--gr-cancel)',
  OpenDoor: 'var(--gr-door)',
  CloseDoor: 'var(--gr-door)',
};

export function StateGraph({ v, trace }: { v: Vars; trace: readonly TraceRow[] }) {
  const nodes = useMemo(() => reachable(Init), []);

  const visited = useMemo(() => {
    const set = new Set<string>([key(Init)]);
    for (const row of trace) set.add(key(row.to));
    set.add(key(v));
    return set;
  }, [trace, v]);

  // Off-spec states reached via dangerous mode: draw them too, in red.
  const extraNodes = useMemo(() => {
    const extras = new Map<string, Vars>();
    const consider = (s: Vars) => {
      if (!nodes.has(key(s)) && rowIndex(s) >= 0 && s.time <= MAX_TIME) extras.set(key(s), s);
    };
    for (const row of trace) consider(row.to);
    consider(v);
    return extras;
  }, [trace, v, nodes]);

  const successors = useMemo(() => Next(v), [v]);
  const last = trace.length ? trace[trace.length - 1] : undefined;

  // Only rows that actually contain states get vertical space. Unsafe rows
  // appear (and the graph grows) the moment dangerous mode reaches them.
  const rowPos = useMemo(() => {
    const present = new Set<number>();
    for (const s of nodes.values()) present.add(rowIndex(s));
    for (const s of extraNodes.values()) present.add(rowIndex(s));
    const pos = new Map<number, number>();
    let i = 0;
    for (let r = 0; r < ROWS.length; r++) if (present.has(r)) pos.set(r, i++);
    return pos;
  }, [nodes, extraNodes]);

  const cy = (s: Vars) => PAD + (rowPos.get(rowIndex(s)) ?? 0) * CELL_H + CELL_H / 2;

  const width = LABEL_W + PAD * 2 + (MAX_TIME + 1) * CELL_W;
  const height = PAD * 2 + rowPos.size * CELL_H + 24;

  const edge = (from: Vars, to: Vars, name: string, emphasized: boolean) => {
    const x1 = cx(from), y1 = cy(from), x2 = cx(to), y2 = cy(to);
    const color = ACTION_COLOR[name] ?? 'var(--ink-3)';
    if (eqVars(from, to)) {
      // self-loop (e.g. Cancel from an already-idle state)
      return (
        <path
          key={`${name}-self`}
          d={`M ${x1 - 6} ${y1 - R} a 10 10 0 1 1 12 0`}
          className={`gr-edge ${emphasized ? 'gr-edge-hot' : ''}`}
          style={{ stroke: color }}
          markerEnd="url(#gr-arrow)"
        />
      );
    }
    // slight curve so parallel edges don't overlap
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12;
    const my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
    return (
      <path
        key={`${name}-${key(to)}`}
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        className={`gr-edge ${emphasized ? 'gr-edge-hot' : ''}`}
        style={{ stroke: color }}
        markerEnd="url(#gr-arrow)"
      />
    );
  };

  return (
    <div className="gr-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="gr-svg" role="img" aria-label="state space graph">
        <defs>
          <marker id="gr-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* column headers: time values */}
        {Array.from({ length: MAX_TIME + 1 }, (_, t) => (
          <text key={t} x={LABEL_W + PAD + t * CELL_W + CELL_W / 2} y={height - 8} textAnchor="middle" className="gr-time-label">
            {t === 0 ? 'time = 0' : t}
          </text>
        ))}

        {/* row labels */}
        {ROWS.map((r, i) => {
          const p = rowPos.get(i);
          if (p === undefined) return null;
          return (
            <text key={r.label + i} x={LABEL_W} y={PAD + p * CELL_H + CELL_H / 2 + 4} textAnchor="end" className={`gr-row-label ${r.unsafe ? 'gr-row-unsafe' : ''} ${r.radiation === 'ON' && !r.unsafe ? 'gr-row-hot' : ''}`}>
              {r.label}
            </text>
          );
        })}

        {/* edges: last transition (dimmed trail) + enabled actions from current state */}
        {last && !last.stutter && !eqVars(last.from, last.to) && edge(last.from, last.to, last.name, true)}
        {successors.map(s => edge(v, s.v2, s.name, false))}

        {/* reachable nodes */}
        {[...nodes.values()].map(s => {
          const k = key(s);
          const isCur = eqVars(s, v);
          const cls = [
            'gr-node',
            visited.has(k) ? 'gr-node-visited' : '',
            isCur ? 'gr-node-current' : '',
            !Safe(s) ? 'gr-node-unsafe' : '',
          ].join(' ');
          return (
            <circle key={k} cx={cx(s)} cy={cy(s)} r={isCur ? R + 2 : R} className={cls}>
              <title>{`door=${s.door} time=${s.time} radiation=${s.radiation} power=${s.power}`}</title>
            </circle>
          );
        })}

        {/* off-spec (dangerous) nodes */}
        {[...extraNodes.values()].map(s => {
          const isCur = eqVars(s, v);
          return (
            <circle key={key(s)} cx={cx(s)} cy={cy(s)} r={isCur ? R + 2 : R} className={`gr-node gr-node-offspec ${isCur ? 'gr-node-current' : ''}`}>
              <title>{`OFF-SPEC: door=${s.door} time=${s.time} radiation=${s.radiation} power=${s.power}`}</title>
            </circle>
          );
        })}
      </svg>

      <div className="gr-legend">
        <span><i className="gr-dot gr-dot-reachable" /> reachable, unvisited</span>
        <span><i className="gr-dot gr-dot-visited" /> visited by you</span>
        <span><i className="gr-dot gr-dot-current" /> current state</span>
        <span><i className="gr-dot gr-dot-offspec" /> off-spec (dangerous mode)</span>
      </div>
      <div className="gr-legend gr-legend-actions">
        {Object.entries(ACTION_COLOR).map(([name, color]) => (
          <span key={name}><i className="gr-line" style={{ background: color }} /> {name}</span>
        ))}
      </div>
    </div>
  );
}
