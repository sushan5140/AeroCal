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
