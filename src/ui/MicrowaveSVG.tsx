import { Vars } from '../model/state';

// A flat, crisp SVG microwave. The door swings via a CSS transform, the
// cavity glows when radiating, and the display shows the timer. No 3D — the
// point of the page is the state machine, not the render.

export function MicrowaveSVG({
  v,
  stutterTrap,
  dangerousMode,
}: {
  v: Vars;
  stutterTrap: boolean;
  dangerousMode: boolean;
}) {
  const radiating = v.radiation === 'ON';
  const open = v.door === 'OPEN';
  const powered = v.power === 'ON';
  const unsafe = radiating && open;

  const mm = Math.floor(v.time / 60).toString().padStart(2, '0');
  const ss = (v.time % 60).toString().padStart(2, '0');

  return (
    <div
      className="mw-svg-wrap"
      aria-label={`microwave: door ${v.door.toLowerCase()}, radiation ${v.radiation.toLowerCase()}, power ${v.power.toLowerCase()}, time ${v.time}`}
    >
      <svg viewBox="0 0 460 260" className="mw-svg" role="img">
        {/* body */}
        <rect x="20" y="20" width="420" height="220" rx="14" className="mw-body" />
        {/* cavity */}
        <rect x="42" y="42" width="270" height="176" rx="6" className={`mw-cavity ${radiating ? (unsafe || stutterTrap ? 'mw-cavity-danger' : 'mw-cavity-on') : ''}`} />
        {/* food */}
        <g className="mw-food">
          <ellipse cx="177" cy="196" rx="52" ry="10" className="mw-plate" />
          <path d="M150 190 q27 -26 54 0 z" className="mw-mug" />
        </g>
        {/* radiation waves */}
        {radiating && (
          <g className="mw-waves">
            <path d="M110 90 q10 -10 20 0 t20 0" />
            <path d="M160 120 q10 -10 20 0 t20 0" />
            <path d="M120 150 q10 -10 20 0 t20 0" />
            <path d="M200 80 q10 -10 20 0 t20 0" />
          </g>
        )}
        {/* door (hinged on the left edge of the cavity frame) */}
        <g className={`mw-door ${open ? 'mw-door-open' : ''}`}>
          <rect x="34" y="34" width="286" height="192" rx="8" className="mw-door-frame" />
          <rect x="52" y="52" width="250" height="156" rx="4" className="mw-door-glass" />
          {/* mesh dots — uniform grid, equal spacing both axes, centered in the glass */}
          <g className="mw-door-mesh">
            {Array.from({ length: 7 }, (_, r) =>
              Array.from({ length: 11 }, (_, c) => (
                <circle key={`${r}-${c}`} cx={67 + c * 22} cy={64 + r * 22} r="2.2" />
              )),
            )}
          </g>
          <rect x="300" y="60" width="9" height="140" rx="4" className="mw-door-handle" />
        </g>
        {/* control panel */}
        <rect x="330" y="34" width="96" height="192" rx="8" className="mw-panel" />
        {/* display */}
        <rect x="342" y="48" width="72" height="34" rx="4" className="mw-display" />
        <text x="378" y="72" textAnchor="middle" className={`mw-display-text ${powered ? '' : 'mw-display-off'}`}>
          {powered ? `${mm}:${ss}` : '--:--'}
        </text>
        {/* LEDs */}
        <circle cx="352" cy="100" r="5" className={powered ? 'mw-led mw-led-power' : 'mw-led'} />
        <text x="362" y="104" className="mw-led-label">power</text>
        <circle cx="352" cy="120" r="5" className={radiating ? 'mw-led mw-led-rad' : 'mw-led'} />
        <text x="362" y="124" className="mw-led-label">magnetron</text>
        {/* decorative buttons */}
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: 2 }, (_, c) => (
            <rect key={`${r}-${c}`} x={344 + c * 38} y={140 + r * 26} width="32" height="18" rx="4" className="mw-fake-btn" />
          )),
        )}
        {/* feet */}
        <rect x="50" y="240" width="30" height="8" rx="3" className="mw-foot" />
        <rect x="380" y="240" width="30" height="8" rx="3" className="mw-foot" />
      </svg>

      {unsafe && (
        <div className="mw-badge mw-badge-unsafe" role="alert">
          Safety violation — radiation on, door open
        </div>
      )}
      {stutterTrap && !unsafe && (
        <div className="mw-badge mw-badge-stutter" role="status">
          Liveness violation — radiating, but time never passes
        </div>
      )}
      {dangerousMode && (
        <div className="mw-badge mw-badge-danger-mode" role="status">
          dangerous mode
        </div>
      )}
    </div>
  );
}
