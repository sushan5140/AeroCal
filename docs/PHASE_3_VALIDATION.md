# Phase 3 — visual fidelity refactor

Baseline / rollback: `98fd509b2525bc447af6db6c8519613d4db9d660`, preserved on `rollback/phase-2-98fd509`.

## Implemented

Refined the existing static dashboard and Three.js progressive enhancement. No framework migration or backend was introduced. Light-theme navigation, replay clock, play/pause, reverse seeking, three speeds, density selection and aircraft selection remain connected. The SVG airport remains the fallback if module loading, WebGL creation or the graphics context fails.

The airport includes a multi-section glazed terminal, mullions, canopy, rooftop solar panels and HVAC, seven marked stands and connecting jet bridges, a tower, runway markings, taxi signs, hold-short bars, edge lights, service roads, parked vehicles, carts, hangar, fuel tanks, vegetation, clouds and a fog-separated skyline. Aircraft use a smooth lathed fuselage, swept beveled wings, engines and intakes, fin, stabilizers, cabin windows, cockpit glazing, wheels and struts. Static airport construction uses 1,703 instances in 31 batches. Repeated aircraft details are batched separately. Three static stand models are set dressing, explicitly excluded from replay counts.

Rendering uses ACES tone mapping, hemisphere / ambient / directional lighting, physical glazing, matte standard materials, soft PCF shadows and radial contact-shadow approximations. This is approximate ambient shading, not ray-traced GI or a screen-space AO pass. No bloom is used.

Taxi centre lines, overlays and playback share rounded paths. Arc-length lookup and acceleration / braking profiles give smooth gate stops. Arrival and departure use timed Hermite trajectories. Departure waits off the runway and lines up after the arrival has passed. Positions and orientation are pure functions of replay time. Aircraft dimensions are constant during selection. Hero reset, damped orbit and dolly, wheel and double-click zoom, pointer cancellation and pinch zoom are included. Low-end defaults, an explicit detail switch and automatic quality reduction are implemented. Low quality retains contact shading while disabling expensive shadow maps.

## Checks actually performed

- `node --test tests/*.test.mjs`: **27 passed, 0 failed**.
- Trajectory samples cover the full 300-second replay, reverse seeks, time clamping, finite positions, continuous heading and position, touchdown, rotation / climb, runway choreography separation and gate endpoint holds.
- Taxi checks use a conservative 7.2-unit aircraft envelope against the terminal and runway; positions stay on the shared centre lines.
- Asset-construction checks instantiate the actual Three.js geometry, validate finite transforms / bounds, aircraft dimensions and wheel ground contact, and project terminal / tower / runway landmarks into desktop and mobile camera frustums. A canvas stub is used; these are **not** rendered-image tests.
- Replay tests exercise the existing inline application script in a minimal DOM harness: pause / play, all speeds, seeking, density reduction, keyboard flight selection, navigation, immediate selection synchronization and reduced-motion startup. This is **not** a browser integration test.
- JavaScript syntax checks passed for all three modules.
- The stylesheet was parsed recursively with `tinycss2`, including responsive media queries. CSS syntax validation is **not** responsive visual validation.
- `git diff --check` passed.

## Remaining verification limits

The approved airport reference was retrieved and visually inspected for composition. Actual browser / WebGL rendering, screenshot comparison, pointer interaction in a real browser, mobile-device layout, GPU shader compilation and 60 FPS performance have not been verified. Browser automation was unavailable in this managed environment. The renderer exposes read-only `window.AeroCalDiagnostics` for manual camera, trajectory, draw-call, triangle-count and frame-time inspection. These diagnostics are rendering telemetry, not research measurements.

The assets and choreography are synthetic and stylized. This is not an operational digital twin, airport movement validation or real-flight replay. Stand set dressing is static. Replay loops at five minutes and resets the synthetic scenario. The default hero view begins with an arrival and a departing aircraft waiting to line up; the airborne departure appears later in the replay. Collision checks cover terminal and runway clearance, not a complete mesh-level collision simulation for every piece of airport equipment.

MAE, calibration coverage, interval width and flight prediction / observation values remain unmeasured. Chart outlines and the distribution shape are explicitly illustrative. No experimental improvement, sample size, comparison or professor feedback is asserted.

## Manual follow-up

Open the deployment on a desktop and mobile browser. Pause, seek to 00:00 / 01:40 / 03:35 / 05:00 and reverse-seek. Check every density, labels and table selection, zoom buttons, hero reset, orbit and pinch. Inspect glazing / shadows / geometry, verify absence of shader errors, and measure frame times with real GPU hardware before signing off on visual fidelity or 60 FPS.
