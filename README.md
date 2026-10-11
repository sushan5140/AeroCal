# AeroCal

**Aircraft Landing-Time Prediction & Uncertainty Calibration**

A lightweight, professor-facing visual research portal prototype for exploring airport traffic scenarios and, eventually, examining landing-time prediction reliability under dense traffic.

## Phase 1 — interactive research visualization

- Light-theme isometric airport scene, mobile-friendly
- Animated aircraft with deterministic, synthetic movement
- Pause/play, seek, and playback-speed controls
- Low, medium, and high illustrative traffic scenarios
- Clickable aircraft, flight selection and detail display
- Research KPI placeholders intentionally marked **not measured**
- Accessible keyboard aircraft selection and reduced-motion styling

### Run locally

This is a zero-dependency static prototype. Open `index.html` in a current browser, or serve the directory:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

### Data integrity

**No real flight records, validated calibration findings, or measured MAE, coverage, or interval widths are provided in Phase 1.** The movement model is illustrative and should not be interpreted as a physically validated air-traffic simulator.

The next research integration phase must consume versioned experiment artifacts, with methodology, sample counts, predicted and observed times, nominal coverage, stratification criteria, interval widths, and source provenance. Synthetic demo states must remain visibly separate from empirical measurements.

### Proposed next phases

1. Replace simple geometric scene with reusable smoothly animated 3D assets, maintaining stable and physically plausible route paths.
2. Define `experiment.json` schema, fixture loader, validation and provenance checks.
3. Replay actual recorded aircraft trajectories when available.
4. Implement paired baseline vs calibrated predictions, coverage-by-density and interval-width plots with traceable calculations.
5. Add professor-facing weekly updates, review comments and experiment links (auth/access control needed before accepting private research data).

## Project scope

This is a visualization prototype—not air-traffic control software, operational prediction software, or a validated research result. No external services or paid dependencies are required for Phase 1.


## Phase 2 — optional Three.js airport scene (October 2026)

The app now attempts to load `airport-3d.js` as an ES module via a public Three.js CDN. A successfully initialized WebGL scene renders terminal buildings, runways, taxiways, lights, aircraft models, colored trajectories, orbit/zoom camera controls, and the same pause/scrub/speed/density interactions as the original timeline. Select a 3D aircraft to inspect it in the existing flight detail card. If module loading fails, the original SVG airport remains visible.

**Validation status:** Changes committed and connector-verified in GitHub. An end-to-end browser rendering test and deployment have **not** been completed in this session; external GitHub raw download was unavailable in the test container. The models and flight trajectories are illustrative—not an aviation-grade simulation.

**Next:** test on desktop and mobile browser, fix any issues discovered, then consider self-hosting the Three.js dependency and deploying a static preview. A verified deployment URL has not been established yet.

## Phase 3 — visual fidelity refactor

The current scene has a detailed multi-section terminal, marked stands and jet bridges, tower, service equipment, smooth aircraft assets, atmospheric depth and a lower hero camera. Timed trajectories share taxi centre lines with the environment; arrival flare / rollout, departure lineup / rotation / climb and final gate stops are deterministic when seeking. Aircraft labels follow their 3D positions. Wheel, pinch and button zoom, damped orbit, **Reset to Hero View**, adaptive detail and the original SVG fallback are available. Three.js 0.166.1 is now bundled locally under its MIT license; no CDN is required at runtime.

Run the dependency-free validation suite with Node 20 or later:

```bash
node --test tests/*.test.mjs
```

The current suite has 27 passing checks covering geometry, trajectory clearance / determinism and the replay control contract. Read [the Phase 3 validation record](docs/PHASE_3_VALIDATION.md) for the exact checks and limitations. Browser-rendered visual fidelity, real mobile behavior and 60 FPS have **not** been verified. All airport assets, scenarios and charts remain synthetic; research measurements are not loaded. The original Phase 2 validation note above is historical.

Rollback is preserved at branch `rollback/phase-2-98fd509` (commit `98fd509`).


## Cinematic Mode (three complementary AI-generated airport views)

The airport scene now has **3D Interactive / Cinematic** selectors. Cinematic offers **Hero Wide**, **Terminal** and **Runway** views; it does not replace the operationally meaningful interactive renderer. The video view is explicitly marked an AI-generated illustration, and never synchronizes generated aircraft imagery with experimental results.

**Media delivery pending:** Place three user-generated MP4 videos into these paths in the repository, then allow Vercel to redeploy:
- `media/hero-wide.mp4` — first 8-second hero-wide animation
- `media/terminal-focus.mp4` — second terminal animation
- `media/runway-focus.mp4` — third runway animation

Video assets are not committed via the current text-only GitHub connector. Until uploaded, a missing-media message appears in Cinematic Mode; interactive 3D continues working. Files can be uploaded through the GitHub web interface, subject to GitHub's file-size limits. The three views are separate shots, not a geometrically accurate multi-camera capture. They are not perfect loops, so the player intentionally seeks to the start at the end (a visible reset may occur).

No real prediction error, interval coverage, or interval width data are encoded in these videos.
