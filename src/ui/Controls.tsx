import { Vars } from '../model/state';
import { Actions } from '../checker/spec';
import { Engine } from '../sim/engine';

const BUTTON_LABELS: Record<string, string> = {
  TogglePower: 'Power',
  IncrementTime: '+3s',
  Start: 'Start',
  Cancel: 'Cancel',
  OpenDoor: 'Open door',
  CloseDoor: 'Close door',
  Tick: 'Tick (manual)',
};

const BUTTON_ORDER = [
  'TogglePower',
  'IncrementTime',
  'Start',
  'Cancel',
  'OpenDoor',
  'CloseDoor',
  'Tick',
];

export function Controls({
  engine,
  v,
  dangerousMode,
}: {
  engine: Engine;
  v: Vars;
  dangerousMode: boolean;
}) {
  return (
    <div className="mw-controls">
      {BUTTON_ORDER.map(name => {
        const a = Actions.find(x => x.name === name);
        if (!a) return null;
        const enabled = a.enabled(v);
        // In dangerous mode every button stays live. When a disabled button
        // is actually clicked in dangerous mode, the engine skips the guard.
        const disabled = !dangerousMode && !enabled;
        const title = dangerousMode
          ? enabled
            ? `Fire ${name}`
            : `Fire ${name} anyway (dangerous mode — precondition violated)`
          : enabled
            ? `Fire action ${name}`
            : `Action ${name} is not enabled in the current state`;
        return (
          <button
            key={name}
            className={`mw-btn ${dangerousMode && !enabled ? 'mw-btn-danger-live' : ''}`}
            disabled={disabled}
            onClick={() => engine.dispatch(name)}
            title={title}
          >
            {BUTTON_LABELS[name] ?? name}
          </button>
        );
      })}
    </div>
  );
}
