# AeroCal — Coding Agent Handoff (read before asking for context)

## Project and access
- Repository: https://github.com/sushan5140/AeroCal (branch: `main`)
- Live production: https://aerocal-sigma.vercel.app
- Vercel project: `aerocal`, GitHub-connected. Normal pushes to `main` trigger deployment.
- If your workspace is empty: `git clone https://github.com/sushan5140/AeroCal.git && cd AeroCal`. In restricted network environments, ask the execution environment for GitHub connector access rather than assuming the project is missing.
- Static frontend, ES modules, vendored Three.js. No package installation required for basic use. Serve over HTTP: `python -m http.server 8000` then visit http://localhost:8000. Do not use `file://` for ES modules.

## Key source files
- `index.html`: app shell, replay controls, research dashboard and JS state (`window.AeroCalState`)
- `dashboard.css`: dashboard layout/visual styles
- `airport-3d.js`: Three.js renderer, camera, lighting, atmosphere, shadows, scene lifecycle, flight labels, camera controls, adaptive quality, animations
- `airport-assets.js`: procedural ground, grass, terminals, apron, taxiways, runway, aircraft models, shared materials
- `airport-life.js`: procedural apron/landside service vehicles and moving cloud animation
- `trajectory.js`: deterministic synthetic flight poses, route network, taxiing, landing/takeoff, seek semantics; don't casually alter
- `vendor/three.module.min.js`: local Three.js dependency
- `cinematic.js`, `cinematic.css`, `media/*.mp4`: separate cinematic video mode; not the preferred primary 3D experience
- `README.md`: prior phases, warnings and known limitations

## What the user wants NOW
Improve the existing **interactive Three.js** airport: present colors are dull, gray, washed out and visually flat. Do a tasteful visual fidelity/color and daylight pass:
1. Cleaner sky gradient, richer yet soft blue, haze/fog harmonized with sky.
2. Grass richer and natural (not neon); improve pavement/runway contrast and markings.
3. Directional sunlight warmer/clearer; hemisphere and ambient fill balanced; softer readable shadows.
4. Tune ACES tone mapping/exposure conservatively; preserve highlights and real detail; avoid washing out surfaces.
5. Upgrade terminal glass/building material colors and reflectance tastefully; ensure legibility.
6. Retain polished, **light-theme**, soft cinematic look from approved airport reference: attractive, lively, crisp, professional research portal—not a game, night mode, or cartoon.
7. Improve motion/visual quality of the actual **3D objects**, rather than substituting fixed MP4 replays. Camera tour and ground vehicle motion exist; refine safely if applicable. Do not rebuild from scratch.

The original videos were considered less satisfactory inside the website, and the user specifically favors continuous, navigable Three.js movement over replayed video. Keep Cinematic Mode optional; do not make it the default or remove it without approval.

## Critical preservation
- Preserve all currently working architecture, controls, mobile responsiveness and progressive SVG fallback.
- Retain play/pause, deterministic seek/replay, speed selection, low/medium/high traffic scenarios, flight click/selection, orbit/zoom, zoom buttons, reset Hero and Camera Tour.
- Preserve ground-service motion, clouds, reduced-motion accessibility, adaptive rendering quality and WebGL fallback.
- Keep landing/taxi positions, headings, route markings and scenario time synchronized via `trajectory.js`; if changed, require a scientific and replay consistency reason.
- No made-up research findings. **All existing flights, airport assets, KPIs and trajectories are synthetic illustrations.** Don't claim real measured MAE, empirical interval coverage or calibration; Professor Lee's landing-time uncertainty research still requires reproduced original model/real evaluations.
- Do not turn synthetic animations or AI-generated videos into experimental evidence.
- Avoid unnecessary new dependencies, paid APIs, heavy meshes and expensive postprocessing; performance matters on desktop and mobile.
- Don't touch unrelated projects or repos.

## Implementation guidance
- Inspect existing implementation rather than replacing it; `airport-3d.js` currently uses `THREE.ACESFilmicToneMapping`, exposure approximately 1.1, hemisphere+ambient+directional sun, gradient-sky shader and fog. `airport-assets.js` defines material palette and procedurally creates airport geometry.
- Use targeted, reversible color/material/light changes first. Check materials, tone mapping and atmosphere together to prevent clipping/hazy dullness.
- Keep determinism of research trajectories. Decorative motion should remain clearly illustrative and avoid collisions.
- Test in a local HTTP server with browser. Check JS errors, desktop and mobile, default hero angle, zoom/orbit, camera tour, density switches, play/pause, scrub backwards, video/3D switching, navigation and frame rate.
- If feasible, capture before/after screenshots from the SAME camera/density/time so visual comparison is honest. Don't invent test results; distinguish code inspection from browser testing.
- Use a clear commit on `main` after validating; if deployment fails, **don't repeatedly retry**—report the failure, blockers and commit hash.
- Finish with modified files, what changed, tests actually run, any known regressions, link to deployment/commit.

## User's preferred working style
Act proactively on established requirements, solve normal engineering decisions yourself and don't ask repeatedly for repo, links, filenames or already-known aesthetic target. Ask only when blocked by unavailable permissions, essential reference assets or genuinely consequential decisions. Human-sounding concise updates are preferred.

## Current website
https://aerocal-sigma.vercel.app
