---- MODULE Microwave ----
EXTENDS Integers, TLC

VARIABLES door, time, radiation, power

CONSTANTS OPEN, CLOSED, ON, OFF

Init ==
/\ door = CLOSED
/\ time = 0
/\ radiation = OFF
/\ power = OFF

TogglePower ==
/\ UNCHANGED <<door, time, radiation>>
/\ power' = IF power = ON THEN OFF ELSE ON

IncrementTime ==
/\ UNCHANGED <<door, radiation, power>>
/\ time' = time + 3

Start ==
/\ time > 0
/\ door = CLOSED
/\ power = ON
/\ radiation' = ON
/\ UNCHANGED <<door, time, power>>

Tick ==
/\ time > 0
/\ time' = time - 1
/\ UNCHANGED <<door, power>>
/\ radiation' = IF time' = 0 THEN OFF ELSE radiation

Cancel ==
/\ time' = 0
/\ radiation' = OFF
/\ UNCHANGED <<door, power>>

CloseDoor ==
/\ door = OPEN
/\ door' = CLOSED
/\ UNCHANGED <<time, radiation, power>>

OpenDoor ==
/\ door = CLOSED
/\ door' = OPEN
/\ radiation' = OFF
/\ UNCHANGED <<time, power>>

Next == TogglePower \/ IncrementTime \/ Start \/ Tick \/ Cancel \/ CloseDoor \/ OpenDoor

\* Safety invariant: radiation must never be ON with the door OPEN.
Safe == ~(radiation = ON /\ door = OPEN)

\* Liveness property (Laufer, Mertin, Thiruvathukal, arXiv:2407.21152, Sec. IV.C):
\* whenever the microwave is radiating, it must eventually stop. Without this
\* property, stuttering lets the microwave radiate forever, overheating.
HeatLiveness == (radiation = ON) ~> (radiation = OFF)

\* Top-level specification with weak fairness on Tick. Without WF_vars(Tick),
\* the [Next]_vars form admits an infinite stuttering behavior from a radiating
\* state, violating HeatLiveness. Weak fairness forces Tick to eventually fire
\* whenever it is continuously enabled.
Spec == Init /\ [][Next]_<<door,time,radiation,power>> /\ WF_<<door,time,radiation,power>>(Tick)

\* CONSTRAINT-friendly bound so TLC explores a finite state space.
TimeBound == time <= 6

====
