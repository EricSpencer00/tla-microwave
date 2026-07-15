import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Engine } from '../sim/engine';
import { Init } from '../model/state';
import { findViolations, reachable } from '../checker/bfs';
import { STUTTER_TRAP_THRESHOLD } from '../checker/liveness';
import { MicrowaveSVG } from './MicrowaveSVG';
import { Controls } from './Controls';
import { TraceLog } from './TraceLog';
import { Toggles } from './Toggles';
import { ContextHelp } from './ContextHelp';
import { StateGraph } from './StateGraph';
import { SpecView } from './SpecView';

function useEngine(): Engine {
  const [engine] = useState(() => new Engine());
  useEffect(() => {
    engine.startTickLoop();
    return () => engine.stopTickLoop();
  }, [engine]);
  return engine;
}

export function App() {
  const engine = useEngine();

  useSyncExternalStore(
    cb => engine.subscribe(cb),
    () =>
      engine.getTrace().length +
      (engine.wfTick ? 10_000_000 : 0) +
      (engine.dangerousMode ? 100_000_000 : 0) +
      engine.suppressedTicks * 37,
  );

  const v = engine.getState();
  const trace = engine.getTrace();
  const stutterTrap = engine.suppressedTicks >= STUTTER_TRAP_THRESHOLD;
  const last = trace.length ? trace[trace.length - 1] : undefined;
  const lastAction = stutterTrap ? 'Spec' : last && !last.stutter ? last.name : undefined;

  const checker = useMemo(() => {
    const r = reachable(Init);
    const violations = findViolations(Init);
    return { reachableCount: r.size, violationsCount: violations.length };
  }, []);

  return (
    <div id="mw-app" className="mw-app">
      <header className="mw-hero">
        <p className="mw-kicker">TLA+, running in your browser</p>
        <h1>The Microwave</h1>
        <p className="mw-lede">
          A microwave oven is four variables: a <em>door</em>, a <em>timer</em>,
          a <em>magnetron</em>, and a <em>power switch</em>. That's small enough
          to draw its <strong>entire state space</strong> on one screen — and
          big enough to hide a real bug. This page runs a faithful port of a
          TLA+ specification: every button is one action of the spec, and the
          model checker's view of the world is drawn live below.
        </p>
      </header>

      <section className="mw-section">
        <div className="mw-layout">
          <main className="mw-main">
            <MicrowaveSVG v={v} stutterTrap={stutterTrap} dangerousMode={engine.dangerousMode} />
            <Controls engine={engine} v={v} dangerousMode={engine.dangerousMode} />
            <Toggles
              engine={engine}
              wfTick={engine.wfTick}
              dangerousMode={engine.dangerousMode}
              violationsCount={checker.violationsCount}
              reachableCount={checker.reachableCount}
              stutterTrap={stutterTrap}
              suppressedTicks={engine.suppressedTicks}
            />
          </main>
          <aside className="mw-side">
            <ContextHelp
              v={v}
              wfTick={engine.wfTick}
              dangerousMode={engine.dangerousMode}
              stutterTrap={stutterTrap}
            />
          </aside>
        </div>
      </section>

      <section className="mw-section">
        <h2>The entire state space</h2>
        <p className="mw-section-lede">
          Every dot is a reachable state; the columns are the timer value, the
          rows are the other three variables. This is what a model checker
          "sees": not a running program, but a finite graph it can visit{' '}
          <em>exhaustively</em>. TLC visits all{' '}
          <strong>{checker.reachableCount}</strong> of these states and proves
          the unsafe row is unreachable — something no amount of testing can
          promise. Arrows show the actions enabled <em>right now</em>.
        </p>
        <StateGraph v={v} trace={trace} />
      </section>

      <section className="mw-section">
        <h2>Read the spec</h2>
        <p className="mw-section-lede">
          This is the actual specification, annotated. Press buttons above and
          watch the matching action light up. TLA+ describes a system as a
          logical formula: what's true initially, and how each step may change
          the variables.
        </p>
        <div className="mw-spec-layout">
          <SpecView lastAction={lastAction} />
          <div className="mw-trace-panel">
            <TraceLog trace={trace} suppressedTicks={engine.suppressedTicks} />
          </div>
        </div>
      </section>

      <section className="mw-section">
        <h2>Why bother?</h2>
        <div className="mw-benefits">
          <div>
            <h3>Exhaustive, not hopeful</h3>
            <p>
              Tests sample a few paths through a system. TLC enumerates{' '}
              <em>every</em> reachable state and every transition between them.
              For this spec that's {checker.reachableCount} states — for real
              designs it's billions, and it still works.
            </p>
          </div>
          <div>
            <h3>Safety: nothing bad, ever</h3>
            <p>
              <code>Safe == ~(radiation = ON /\ door = OPEN)</code>. Flip on{' '}
              <strong>dangerous mode</strong> to remove the interlock from{' '}
              <code>OpenDoor</code> and watch the red states appear — that's
              the counterexample TLC would hand you as a trace.
            </p>
          </div>
          <div>
            <h3>Liveness: something good, eventually</h3>
            <p>
              <code>HeatLiveness == radiation = ON ~&gt; radiation = OFF</code>.
              Turn off <strong>weak fairness on Tick</strong> and the microwave
              radiates forever without a single "bad" state — a bug invisible
              to safety checking, caught by liveness.
            </p>
          </div>
        </div>
        <footer className="mw-footer">
          <p>
            Model after Läufer, Mertin &amp; Thiruvathukal,{' '}
            <a target="_blank" rel="noreferrer" href="https://arxiv.org/abs/2407.21152">
              “An Engaging Undergraduate Intro to Model Checking in Software Engineering Using TLA+” (arXiv:2407.21152)
            </a>
            . Source:{' '}
            <a target="_blank" rel="noreferrer" href="https://github.com/EricSpencer00/tla-microwave">
              github.com/EricSpencer00/tla-microwave
            </a>{' '}
            · Learn more at <a target="_blank" rel="noreferrer" href="https://lamport.azurewebsites.net/tla/tla.html">lamport.azurewebsites.net/tla</a>.
          </p>
        </footer>
      </section>
    </div>
  );
}
