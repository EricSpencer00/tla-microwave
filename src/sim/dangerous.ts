// Dangerous-mode step overrides.
//
// These are deliberately NOT part of Microwave.tla. They exist so the
// student can drive the microwave into states that violate the safety
// invariant — specifically: radiation = ON while door = OPEN. The normal
// OpenDoor action forces radiation off as part of its step (matching the
// spec); the dangerous variant leaves radiation on so the violation can
// actually materialize.
//
// For every other action, dangerous mode simply skips the `enabled` guard.
// The canonical `step` function still runs: Start turns radiation on,
// IncrementTime adds 3s, etc.

import { Vars } from '../model/state';

export const DANGEROUS_STEP: Record<string, (v: Vars) => Vars> = {
  // OpenDoor normally: { ...v, door: 'OPEN', radiation: 'OFF' }
  // Dangerous:  { ...v, door: 'OPEN' }  — leave radiation alone
  OpenDoor: v => ({ ...v, door: 'OPEN' }),
};
