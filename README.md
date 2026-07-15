# The TLA+ Microwave

An interactive, fully browser-based tour of a TLA+ specification — its **entire
state space drawn on one screen** — using the classic microwave-oven model.

**Live:** https://ericspencer00.github.io/tla-microwave/

The goal is to make three ideas click for people who have never read TLA+:

1. **A spec is a state machine.** Every button on the page is one disjunct of
   the spec's `Next` relation. The microwave you click and the formula you
   read are the same object.
2. **A model checker sees a graph, not a program.** The timer is bounded at 6
   seconds, so the whole reachable state space is ~40 states — small enough to
   draw. Your current state, your visited trail, and the actions enabled right
   now are rendered live on that graph.
3. **Safety and liveness are different, and fairness matters.**
   - Flip on **dangerous mode** to delete the door interlock and drive the
     model into the red `radiation = ON /\ door = OPEN` states — the ones the
     invariant `Safe` forbids and TLC proves unreachable.
   - Flip off **weak fairness on `Tick`** and the microwave radiates forever
     without ever entering a "bad" state — a liveness violation
     (`HeatLiveness == radiation = ON ~> radiation = OFF`) that safety
     checking cannot see. This is why `Spec` ends with `WF_vars(Tick)`.

The model follows Läufer, Mertin & Thiruvathukal,
[*An Engaging Undergraduate Intro to Model Checking in Software Engineering
Using TLA+*](https://arxiv.org/abs/2407.21152).

## The spec

[`Microwave.tla`](Microwave.tla) is the source of truth. The TypeScript in
[`src/checker/spec.ts`](src/checker/spec.ts) is a line-by-line transcription:
each action is an `enabled` predicate (the unprimed conjuncts) plus a `step`
function (the primed conjuncts). `src/checker/bfs.ts` enumerates the reachable
state space exactly the way TLC does, and `src/sim/engine.ts` implements the
`[Next]_vars`-with-stuttering semantics, including the weak-fairness toggle.

Run TLC yourself:

```sh
tlc Microwave.tla -config Microwave.cfg
```

(The config bounds `time <= 6` with a `CONSTRAINT`, checks the `Safe`
invariant and the `HeatLiveness` property.)

## Development

```sh
npm install
npm run dev     # local dev server
npm test        # engine tests
npm run build   # static site in dist/
```

No backend, no WASM, no TLC in the loop — the state space is small enough to
check exhaustively in a few microseconds of JavaScript, which is rather the
point.

## License

MIT
