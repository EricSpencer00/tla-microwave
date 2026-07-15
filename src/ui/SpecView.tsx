import { Fragment } from 'react';

// The actual Microwave.tla, rendered with the just-fired action highlighted.
// Each block is keyed by the action name the engine dispatches, so the spec
// lights up as you drive the model — the fastest way to learn that "the
// buttons ARE the disjuncts of Next".

interface Block {
  /** Action name this block corresponds to (matches TraceRow.name), or null for structural blocks. */
  action: string | null;
  lines: string[];
  note?: string;
}

const BLOCKS: Block[] = [
  {
    action: null,
    lines: ['---- MODULE Microwave ----', 'EXTENDS Integers, TLC', '', 'VARIABLES door, time, radiation, power'],
    note: 'Four variables. A "state" is one assignment to all four — nothing else exists.',
  },
  {
    action: 'Init',
    lines: ['Init ==', '  /\\ door = CLOSED', '  /\\ time = 0', '  /\\ radiation = OFF', '  /\\ power = OFF'],
    note: 'The starting state. /\\ is AND: every conjunct must hold.',
  },
  {
    action: 'TogglePower',
    lines: ['TogglePower ==', "  /\\ UNCHANGED <<door, time, radiation>>", "  /\\ power' = IF power = ON THEN OFF ELSE ON"],
    note: "power' (with a prime) is the value in the NEXT state. UNCHANGED says the rest stays put.",
  },
  {
    action: 'IncrementTime',
    lines: ['IncrementTime ==', '  /\\ UNCHANGED <<door, radiation, power>>', "  /\\ time' = time + 3"],
    note: 'No guard — you can always add time (we bound it at 6 to keep the state space finite).',
  },
  {
    action: 'Start',
    lines: ['Start ==', '  /\\ time > 0', '  /\\ door = CLOSED', '  /\\ power = ON', "  /\\ radiation' = ON", '  /\\ UNCHANGED <<door, time, power>>'],
    note: 'Unprimed conjuncts are the GUARD: Start is only enabled when time is set, the door is closed, and power is on.',
  },
  {
    action: 'Tick',
    lines: ['Tick ==', '  /\\ time > 0', "  /\\ time' = time - 1", '  /\\ UNCHANGED <<door, power>>', "  /\\ radiation' = IF time' = 0 THEN OFF ELSE radiation"],
    note: 'One second passes. When the timer hits zero, radiation shuts off in the same step.',
  },
  {
    action: 'Cancel',
    lines: ['Cancel ==', "  /\\ time' = 0", "  /\\ radiation' = OFF", '  /\\ UNCHANGED <<door, power>>'],
  },
  {
    action: 'CloseDoor',
    lines: ['CloseDoor ==', '  /\\ door = OPEN', "  /\\ door' = CLOSED", '  /\\ UNCHANGED <<time, radiation, power>>'],
  },
  {
    action: 'OpenDoor',
    lines: ['OpenDoor ==', '  /\\ door = CLOSED', "  /\\ door' = OPEN", "  /\\ radiation' = OFF", '  /\\ UNCHANGED <<time, power>>'],
    note: 'The safety mechanism lives HERE: opening the door kills the radiation as part of the same atomic step. Dangerous mode deletes this line.',
  },
  {
    action: null,
    lines: ['Next ==', '  \\/ TogglePower  \\/ IncrementTime  \\/ Start  \\/ Tick', '  \\/ Cancel  \\/ CloseDoor  \\/ OpenDoor'],
    note: '\\/ is OR: each step of the system is exactly one of these actions. The buttons above ARE these disjuncts.',
  },
  {
    action: 'Safe',
    lines: ['Safe == ~(radiation = ON /\\ door = OPEN)'],
    note: 'The safety invariant (~ is NOT). TLC checks it holds in every reachable state — all of them, exhaustively.',
  },
  {
    action: 'HeatLiveness',
    lines: ['HeatLiveness == (radiation = ON) ~> (radiation = OFF)'],
    note: '~> is "leads to": whenever radiation is on, it must EVENTUALLY turn off. Safety says nothing bad happens; liveness says something good does.',
  },
  {
    action: 'Spec',
    lines: ['Spec == Init /\\ [][Next]_vars /\\ WF_vars(Tick)'],
    note: '[][Next]_vars means: every step is a Next action OR a stutter (nothing changes). WF_vars(Tick) is weak fairness — Tick cannot be ignored forever. Turn the fairness toggle off and watch HeatLiveness fail.',
  },
];

export function SpecView({ lastAction }: { lastAction?: string }) {
  return (
    <div className="spec">
      {BLOCKS.map((b, i) => {
        const hot = b.action !== null && b.action === lastAction;
        return (
          <Fragment key={i}>
            <pre className={`spec-block ${hot ? 'spec-hot' : ''}`}>
              {b.lines.join('\n')}
            </pre>
            {b.note && <p className="spec-note">{b.note}</p>}
          </Fragment>
        );
      })}
    </div>
  );
}
