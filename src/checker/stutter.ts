// Stuttering steps for the Microwave spec.
//
// Spec == Init /\ [][Next]_vars /\ WF_vars(Tick)
//
// The [Next]_vars square-bracket form admits two kinds of step:
//   1. A Next step (one of the action disjuncts), OR
//   2. A stuttering step where vars' = vars.
//
// Per Laufer/Mertin/Thiruvathukal (arXiv:2407.21152, Sec. IV.C), stuttering
// is not a trace-display nicety — it is a *liveness hazard*. Without
// WF_vars(Tick), a radiating microwave can stutter forever, violating
// HeatLiveness ("radiation = ON ~> radiation = OFF"). This module exposes
// Stutter as a first-class pseudo-action; the engine and UI combine it with
// the fairness toggle to reproduce and resolve the paper's Figure 7 failure.

import { Vars } from '../model/state';
import { Action, Next } from './spec';

export const STUTTER_NAME = '(stutter)';

export const Stutter: Action = {
  name: STUTTER_NAME,
  enabled: () => true,
  // vars' = vars — return a new object so identity comparisons don't lie,
  // but every field is equal to the predecessor.
  step: v => ({ ...v }),
};

// [Next]_vars realized as concrete successor list.
// Real actions first, stutter last, matching the "action-or-stutter" reading.
export const NextWithStutter = (v: Vars): { name: string; v2: Vars }[] => [
  ...Next(v),
  { name: Stutter.name, v2: Stutter.step(v) },
];
