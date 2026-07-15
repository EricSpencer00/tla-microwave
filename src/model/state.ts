// TS port of Microwave.tla VARIABLES (lines 4-12).
// These four variables are the full state of the model.
export type DoorState = 'OPEN' | 'CLOSED';
export type OnOff = 'ON' | 'OFF';

// TLC needs a bound to make the state space finite; we bound time at 6
// (two presses of +3s). Small on purpose: the ENTIRE reachable state space
// fits on screen, so the graph you see is the graph TLC checks.
export const MAX_TIME = 6;

export interface Vars {
  door: DoorState;
  time: number;
  radiation: OnOff;
  power: OnOff;
}

// Init == /\ door = CLOSED /\ time = 0 /\ radiation = OFF /\ power = OFF
export const Init: Vars = {
  door: 'CLOSED',
  time: 0,
  radiation: 'OFF',
  power: 'OFF',
};

export const eqVars = (a: Vars, b: Vars): boolean =>
  a.door === b.door && a.time === b.time && a.radiation === b.radiation && a.power === b.power;
