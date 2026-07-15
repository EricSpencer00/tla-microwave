// Bounded reachability for the Microwave spec. Since the reachable state
// space from Init is tiny (roughly door × radiation × power × (0..MAX_TIME)),
// we enumerate it exhaustively and surface any Safe violations.
//
// We intentionally use plain Next here, not NextWithStutter: stuttering
// adds no new reachable states (v -> v), so including it would only inflate
// the work without changing results.

import { Vars } from '../model/state';
import { Next, Safe } from './spec';

const key = (v: Vars) => `${v.door}|${v.time}|${v.radiation}|${v.power}`;

export const reachable = (init: Vars): Map<string, Vars> => {
  const seen = new Map<string, Vars>();
  const stack: Vars[] = [init];
  while (stack.length) {
    const v = stack.pop()!;
    const k = key(v);
    if (seen.has(k)) continue;
    seen.set(k, v);
    for (const { v2 } of Next(v)) stack.push(v2);
  }
  return seen;
};

export const findViolations = (init: Vars): Vars[] =>
  [...reachable(init).values()].filter(v => !Safe(v));
