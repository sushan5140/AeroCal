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
