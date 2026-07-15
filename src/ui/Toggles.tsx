import { Engine } from '../sim/engine';

interface Props {
  engine: Engine;
  wfTick: boolean;
  dangerousMode: boolean;
  violationsCount: number;
  reachableCount: number;
  stutterTrap: boolean;
  suppressedTicks: number;
}

export function Toggles({
  engine,
  wfTick,
  dangerousMode,
  violationsCount,
  reachableCount,
  stutterTrap,
  suppressedTicks,
}: Props) {
  return (
    <div className="mw-toggles">
      <div className="mw-switch-row">
        <label className="mw-switch">
          <input
            type="checkbox"
            checked={wfTick}
            onChange={e => engine.setWfTick(e.target.checked)}
          />
          <span>
            Weak fairness on <code>Tick</code>
          </span>
        </label>

        <label className={`mw-switch ${dangerousMode ? 'mw-switch-danger' : ''}`}>
          <input
            type="checkbox"
            checked={dangerousMode}
            onChange={e => engine.setDangerousMode(e.target.checked)}
          />
          <span>Dangerous mode</span>
        </label>

        <button className="mw-btn mw-btn-secondary" onClick={() => engine.reset()}>
          Reset
        </button>
      </div>

      <div className="mw-checker">
        <div>
          <span className="mw-checker-label">Reachable states</span>
          <span className="mw-checker-value">{reachableCount}</span>
        </div>
        <div>
          <span className="mw-checker-label">Safety violations</span>
          <span className={`mw-checker-value ${violationsCount ? 'bad' : 'good'}`}>
            {violationsCount}
          </span>
        </div>
        <div>
          <span className="mw-checker-label">Suppressed ticks</span>
          <span className={`mw-checker-value ${stutterTrap ? 'bad' : ''}`}>
            {suppressedTicks}
          </span>
        </div>
      </div>
    </div>
  );
}
