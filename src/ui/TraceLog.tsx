import { TraceRow } from '../sim/engine';

const fmt = (v: TraceRow['to']) =>
  `door=${v.door.toLowerCase()}, time=${v.time}, radiation=${v.radiation.toLowerCase()}, power=${v.power.toLowerCase()}`;

interface Props {
  trace: readonly TraceRow[];
  suppressedTicks: number;
}

export function TraceLog({ trace, suppressedTicks }: Props) {
  return (
    <div className="mw-trace">
      <div className="mw-trace-header">
        <span>TLA+ trace</span>
        <span className="mw-trace-count">{trace.length}</span>
      </div>

      {suppressedTicks > 0 && (
        <div className="mw-trace-pinned" role="status">
          <strong>Stuttering…</strong> <code>vars′ = vars</code> for{' '}
          <strong>{suppressedTicks}</strong> tick{suppressedTicks === 1 ? '' : 's'}
        </div>
      )}

      <ol className="mw-trace-list">
        {trace.slice().reverse().map((r, i) => (
          <li
            key={`${r.t}-${i}`}
            className={`mw-trace-row ${r.stutter ? 'stutter' : ''} ${!r.safe ? 'violation' : ''}`}
          >
            <span className="mw-trace-name">
              {r.stutter ? '(stutter)' : `\\* ${r.name}`}
            </span>
            <span className="mw-trace-state">{fmt(r.to)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
