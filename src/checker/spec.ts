// Literal TS transcription of Microwave.tla (lines 14-53).
// Each Action corresponds to one disjunct of Next. UNCHANGED clauses are
// realized by only overwriting the fields that mutate in that disjunct.

import { Vars, MAX_TIME } from '../model/state';

export interface Action {
  name: string;
  enabled(v: Vars): boolean;
  step(v: Vars): Vars;
}

// TogglePower == UNCHANGED <<door, time, radiation>> /\ power' = IF power = ON THEN OFF ELSE ON
const TogglePower: Action = {
  name: 'TogglePower',
  enabled: () => true,
  step: v => ({ ...v, power: v.power === 'ON' ? 'OFF' : 'ON' }),
};

// IncrementTime == UNCHANGED <<door, radiation, power>> /\ time' = time + 3
// (We clamp to MAX_TIME because the Java port does; Microwave.tla is unbounded.)
const IncrementTime: Action = {
  name: 'IncrementTime',
  enabled: v => v.time + 3 <= MAX_TIME,
  step: v => ({ ...v, time: v.time + 3 }),
};

// Start == time > 0 /\ door = CLOSED /\ power = ON /\ radiation' = ON /\ UNCHANGED <<door,time,power>>
const Start: Action = {
  name: 'Start',
  enabled: v => v.time > 0 && v.door === 'CLOSED' && v.power === 'ON',
  step: v => ({ ...v, radiation: 'ON' }),
};

// Tick == time > 0 /\ time' = time - 1 /\ UNCHANGED <<door,power>>
//         /\ radiation' = IF time' = 0 THEN OFF ELSE radiation
const Tick: Action = {
  name: 'Tick',
  enabled: v => v.time > 0,
  step: v => {
    const t2 = v.time - 1;
    return { ...v, time: t2, radiation: t2 === 0 ? 'OFF' : v.radiation };
  },
};

// Cancel == time' = 0 /\ radiation' = OFF /\ UNCHANGED <<door,power>>
const Cancel: Action = {
  name: 'Cancel',
  enabled: () => true,
  step: v => ({ ...v, time: 0, radiation: 'OFF' }),
};

// CloseDoor == door = OPEN /\ door' = CLOSED /\ UNCHANGED <<time,radiation,power>>
const CloseDoor: Action = {
  name: 'CloseDoor',
  enabled: v => v.door === 'OPEN',
  step: v => ({ ...v, door: 'CLOSED' }),
};

// OpenDoor == door = CLOSED /\ door' = OPEN /\ radiation' = OFF /\ UNCHANGED <<time,power>>
const OpenDoor: Action = {
  name: 'OpenDoor',
  enabled: v => v.door === 'CLOSED',
  step: v => ({ ...v, door: 'OPEN', radiation: 'OFF' }),
};

export const Actions: readonly Action[] = [
  TogglePower,
  IncrementTime,
  Start,
  Tick,
  Cancel,
  CloseDoor,
  OpenDoor,
];

// Next == TogglePower \/ IncrementTime \/ Start \/ Tick \/ Cancel \/ CloseDoor \/ OpenDoor
export const Next = (v: Vars): { name: string; v2: Vars }[] =>
  Actions.filter(a => a.enabled(v)).map(a => ({ name: a.name, v2: a.step(v) }));

// Safe == ~(radiation = ON /\ door = OPEN)
export const Safe = (v: Vars): boolean => !(v.radiation === 'ON' && v.door === 'OPEN');
