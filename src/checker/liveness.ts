// Liveness analysis for the Microwave spec, following
// Laufer, Mertin, Thiruvathukal (arXiv:2407.21152, Sec. IV.C).
//
// The property of interest is:
//   HeatLiveness == (radiation = ON) ~> (radiation = OFF)
//
// Without weak fairness on Tick, [Next]_vars admits an infinite stuttering
// behavior from a radiating state: the microwave keeps radiating forever
// because time never ticks. We surface this as an explicit "stutter trap":
// a radiating state that has remained radiating across a window of stutter
// steps. The UI uses this to flag the liveness violation the paper
// introduces in Exercise 3a/3b.

import { Vars } from '../model/state';

/** Number of consecutive stutter steps while radiating that we treat as a
 * liveness violation for demonstration purposes. An infinite suffix is the
 * formal criterion; any run greater than this threshold is evidence that
 * the simulator is not making progress. */
export const STUTTER_TRAP_THRESHOLD = 3;

export const isRadiating = (v: Vars) => v.radiation === 'ON';

/**
 * Count consecutive stutter rows at the end of the trace while radiation is
 * ON. Returns 0 once a non-stutter row or a non-radiating state is hit.
 */
export const trailingStutterWhileRadiating = (
  trace: readonly { stutter: boolean; to: Vars }[],
): number => {
  let count = 0;
  for (let i = trace.length - 1; i >= 0; i--) {
    const row = trace[i];
    if (!row.stutter) break;
    if (!isRadiating(row.to)) break;
    count++;
  }
  return count;
};

export const stutterTrapDetected = (
  trace: readonly { stutter: boolean; to: Vars }[],
): boolean => trailingStutterWhileRadiating(trace) >= STUTTER_TRAP_THRESHOLD;
