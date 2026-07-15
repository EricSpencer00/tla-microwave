// Engine: owns the current Vars, dispatches user actions, and runs a tick
// loop. The tick loop has two modes corresponding to the paper
// (Laufer/Mertin/Thiruvathukal, arXiv:2407.21152, Sec. IV.C):
//
//   wfTick = true  -> models Spec /\ WF_vars(Tick): whenever Tick is enabled
//                     it fires, so a radiating microwave cannot stall.
//   wfTick = false -> models Spec with no fairness: the tick loop is allowed
//                     to stutter even when Tick is enabled, demonstrating the
//                     liveness violation of HeatLiveness.
//
// Dispatches from user actions always fire (a user click is not subject to
// fairness; it is a voluntary step in the model).

import { Vars, Init } from '../model/state';
import { Actions } from '../checker/spec';
import { Stutter, STUTTER_NAME } from '../checker/stutter';
import { DANGEROUS_STEP } from './dangerous';

export interface TraceRow {
  t: number;
  name: string;
  from: Vars;
  to: Vars;
  safe: boolean;
  stutter: boolean;
}

type Listener = () => void;

const isSafe = (v: Vars) => !(v.radiation === 'ON' && v.door === 'OPEN');
const MAX_TRACE = 500;

export class Engine {
  private v: Vars = { ...Init };
  private trace: TraceRow[] = [];
  private listeners = new Set<Listener>();
  private tickHandle: ReturnType<typeof setInterval> | undefined;
  /** Weak fairness on Tick (WF_vars(Tick)). Default on, matching the
   * final fixed specification in Microwave.tla. When turned off, ticks that
   * would otherwise fire are suppressed as stutter steps. */
  public wfTick = true;
  /** Count of consecutive wall-clock seconds where Tick *would* have fired
   * but was suppressed by a stutter step (only possible when wfTick is off).
   * Resets to 0 whenever a real transition occurs. This is how the UI
   * surfaces the liveness failure — one state, not a flood of log rows. */
  public suppressedTicks = 0;
  /** Dangerous mode bypasses the `enabled` predicate on every action and
   * swaps in alternate step functions for actions whose normal step
   * enforces safety (e.g. OpenDoor normally forces radiation off). This
   * is how students drive the model into the states the safety invariant
   * is meant to forbid. */
  public dangerousMode = false;

  getState(): Vars {
    return this.v;
  }
  getTrace(): readonly TraceRow[] {
    return this.trace;
  }
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    this.listeners.forEach(l => l());
  }

  /** Returns true iff the action fired. In normal mode we require
   * `action.enabled(v)`; in dangerous mode the guard is skipped and, if the
   * action has a dangerous override, that step replaces the canonical one. */
  dispatch(name: string): boolean {
    const action = Actions.find(a => a.name === name);
    if (!action) return false;
    if (!this.dangerousMode && !action.enabled(this.v)) return false;
    const from = this.v;
    const stepFn = this.dangerousMode && DANGEROUS_STEP[name] ? DANGEROUS_STEP[name] : action.step;
    const to = stepFn(this.v);
    this.v = to;
    this.push(name, from, to, false);
    // Any real transition resets the suppressed-tick counter — the system
    // "made progress", so the stutter trap is not currently active.
    this.suppressedTicks = 0;
    this.notify();
    return true;
  }

  startTickLoop() {
    if (this.tickHandle !== undefined) return;
    this.tickHandle = setInterval(() => this.onTick(), 1000);
  }

  stopTickLoop() {
    if (this.tickHandle !== undefined) {
      clearInterval(this.tickHandle);
      this.tickHandle = undefined;
    }
  }

  /**
   * One tick of wall-clock time.
   *
   *   - If Tick is enabled (radiating + time > 0) AND fairness is on:
   *     fire Tick. Normal operation.
   *   - If Tick is enabled AND fairness is off: suppress the tick. Increment
   *     `suppressedTicks`. The trace gets a single "stutter trap" row on the
   *     first suppressed tick; subsequent suppressed ticks do NOT append more
   *     rows — they just bump the counter.
   *   - Otherwise (Tick not enabled): do nothing. No trace row, no state
   *     change. Stuttering is a legal TLA+ step but rendering it every second
   *     while idle is noise.
   */
  private onTick() {
    const tick = Actions.find(a => a.name === 'Tick')!;
    const wouldTick = tick.enabled(this.v) && this.v.radiation === 'ON';

    if (wouldTick && this.wfTick) {
      const from = this.v;
      const to = tick.step(this.v);
      this.v = to;
      this.push('Tick', from, to, false);
      this.suppressedTicks = 0;
      this.notify();
      return;
    }

    if (wouldTick && !this.wfTick) {
      // First suppressed tick gets a single row; subsequent ones update the
      // counter without spamming the trace.
      const first = this.suppressedTicks === 0;
      this.suppressedTicks += 1;
      if (first) {
        this.push(STUTTER_NAME, this.v, Stutter.step(this.v), true);
      }
      this.notify();
      return;
    }

    // Idle wall-clock tick with no fairness concern: don't touch the trace.
  }

  private push(name: string, from: Vars, to: Vars, stutter: boolean) {
    this.trace.push({ t: Date.now(), name, from, to, safe: isSafe(to), stutter });
    if (this.trace.length > MAX_TRACE) {
      this.trace.splice(0, this.trace.length - MAX_TRACE);
    }
  }

  reset() {
    this.v = { ...Init };
    this.trace = [];
    this.suppressedTicks = 0;
    this.notify();
  }

  setWfTick(on: boolean) {
    this.wfTick = on;
    if (on) this.suppressedTicks = 0;
    this.notify();
  }

  setDangerousMode(on: boolean) {
    this.dangerousMode = on;
    this.notify();
  }
}
