import { Vars } from '../model/state';
import { Actions } from '../checker/spec';

interface Props {
  v: Vars;
  wfTick: boolean;
  dangerousMode: boolean;
  stutterTrap: boolean;
}

// Short, state-tied explanations. We keep one "primary" card plus a small
// list of enabled actions so the user always knows what's legal next.
export function ContextHelp({ v, wfTick, dangerousMode, stutterTrap }: Props) {
  const card = pickCard({ v, wfTick, dangerousMode, stutterTrap });
  const enabled = Actions.filter(a => a.enabled(v)).map(a => a.name);

  return (
    <div className="mw-help">
      <div className={`mw-help-card mw-help-${card.tone}`}>
        <div className="mw-help-title">{card.title}</div>
        <p>{card.body}</p>
        {card.cta && <p className="mw-help-cta">{card.cta}</p>}
      </div>

      <div className="mw-help-actions">
        <div className="mw-help-subtitle">Enabled actions</div>
        <ul>
          {enabled.map(a => (
            <li key={a}>
              <code>{a}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="mw-help-invariants">
        <div className="mw-help-subtitle">Invariants</div>
        <ul>
          <li>
            <strong>Safety.</strong> Radiation must never be on while the door is open.
          </li>
          <li>
            <strong>Liveness.</strong> If radiation is on, it must eventually turn off.
          </li>
        </ul>
      </div>
    </div>
  );
}

type Tone = 'neutral' | 'warn' | 'bad';
interface Card { title: string; body: string; cta?: string; tone: Tone; }

function pickCard({ v, wfTick, dangerousMode, stutterTrap }: Props): Card {
  if (v.radiation === 'ON' && v.door === 'OPEN') {
    return {
      title: 'Safety violation',
      body: dangerousMode
        ? 'Dangerous mode let you reach a state the spec forbids: radiation on with the door open. The safety invariant catches this.'
        : 'Radiation is on with the door open. This is exactly the state the safety invariant forbids.',
      cta: 'Close the door, or press Cancel to stop radiation.',
      tone: 'bad',
    };
  }
  if (dangerousMode) {
    return {
      title: 'Dangerous mode',
      body: 'Every button is live and preconditions are ignored. Open the door while radiating, or press Start from Init — normally illegal moves are available so you can watch the safety invariant fail.',
      cta: 'Turn dangerous mode off to restore spec-faithful behavior.',
      tone: 'warn',
    };
  }
  if (stutterTrap) {
    return {
      title: 'Stuck while radiating',
      body: 'Fairness on Tick is off. The simulator is allowed to stall the tick indefinitely, so radiation never ends. This is the liveness problem that weak fairness fixes.',
      cta: 'Turn weak fairness back on to let Tick resume.',
      tone: 'warn',
    };
  }
  if (v.radiation === 'ON') {
    return {
      title: 'Running',
      body: wfTick
        ? 'Weak fairness forces Tick to fire every second, so the timer decrements to zero and radiation shuts off automatically.'
        : 'Weak fairness is off. Tick is allowed to stall — watch what happens to the timer.',
      cta: 'Try Open door to see the safety invariant enforced.',
      tone: 'neutral',
    };
  }
  if (v.power === 'OFF') {
    return {
      title: 'Welcome',
      body: 'This is the TLA+ microwave model running entirely in your browser. Every button corresponds to one disjunct of the spec\u2019s Next relation.',
      cta: 'Press Power to turn it on.',
      tone: 'neutral',
    };
  }
  if (v.time === 0) {
    return {
      title: 'Powered, idle',
      body: 'Power is on. The Start action needs time > 0, so first add some cooking time.',
      cta: 'Press +3s, then Start.',
      tone: 'neutral',
    };
  }
  return {
    title: 'Ready',
    body: 'Time is set and the door is closed. Start is enabled.',
    cta: 'Press Start.',
    tone: 'neutral',
  };
}
