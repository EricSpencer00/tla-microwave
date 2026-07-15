import { describe, it, expect } from 'vitest';
import { Engine } from '../engine';

describe('dangerous mode', () => {
  it('Start is blocked in normal mode without power+time+closed', () => {
    const e = new Engine();
    expect(e.dispatch('Start')).toBe(false);
    expect(e.getState().radiation).toBe('OFF');
  });

  it('Start fires in dangerous mode even when preconditions fail', () => {
    const e = new Engine();
    e.setDangerousMode(true);
    // From Init: door=CLOSED, time=0, radiation=OFF, power=OFF
    expect(e.dispatch('Start')).toBe(true);
    expect(e.getState().radiation).toBe('ON');
  });

  it('OpenDoor in normal mode forces radiation OFF (spec-compliant)', () => {
    const e = new Engine();
    // Get the microwave into the "radiating with door closed" state via normal path.
    e.dispatch('TogglePower');
    e.dispatch('IncrementTime');
    e.dispatch('Start');
    expect(e.getState().radiation).toBe('ON');
    e.dispatch('OpenDoor');
    expect(e.getState().door).toBe('OPEN');
    expect(e.getState().radiation).toBe('OFF');
  });

  it('OpenDoor in dangerous mode leaves radiation ON (safety violation)', () => {
    const e = new Engine();
    e.dispatch('TogglePower');
    e.dispatch('IncrementTime');
    e.dispatch('Start');
    e.setDangerousMode(true);
    e.dispatch('OpenDoor');
    expect(e.getState().door).toBe('OPEN');
    expect(e.getState().radiation).toBe('ON'); // <-- the unsafe state
  });

  it('dangerousMode off restores precondition enforcement', () => {
    const e = new Engine();
    e.setDangerousMode(true);
    e.dispatch('Start'); // now radiating from Init
    e.setDangerousMode(false);
    // In normal mode, CloseDoor requires door OPEN. Door is CLOSED. Should fail.
    expect(e.dispatch('CloseDoor')).toBe(false);
  });
});
