# E01 — Baseline Reliability Audit (13 October 2026)

## Research question
Does empirical prediction-interval coverage of Professor Lee's unchanged landing-time predictor vary with scene traffic density?

## Hypothesis
Nominal 90% marginal coverage may mask lower conditional coverage in dense scenes. This is a falsifiable hypothesis, not a finding.

## Order of operations
1. Recover the published data preprocessing, temporal split, model checkpoints, prediction targets, and evaluation code. Identify any restrictions on Incheon surveillance data.
2. Reproduce the paper's reported evaluation using unchanged model weights and settings, documenting version, seed, hardware, sample count, and any discrepancy.
3. Export held-out predictions with scene_id, aircraft_id, density_count, observed landing time, lower bound, upper bound, and split. Keep units consistent.
4. Validate that no scene/aircraft duplicates, invalid intervals or training/calibration leakage enter evaluation.
5. Compute overall and pre-defined low/medium/high-density empirical coverage, interval width, and scene sample counts; include point-error metrics only if point forecasts exist.
6. Perform scene-cluster uncertainty analysis and sensitivity checks; do not treat aircraft within the same scene as independent draws.
7. **Only after baseline replication** evaluate whether scene-aware calibration is scientifically warranted.

## Important safeguards
- The interactive 3D airport is synthetic and cannot substitute for observed trajectories.
- Density strata must be defined with respect to the paper's scene representation, then fixed before analysis; initial numerical cutoffs in the local evaluation helper are placeholders only.
- Random splits that leak closely related scenes between train/calibration/test are prohibited.
- Dependence alone does not disprove conformal marginal-coverage guarantees; state relevant exchangeability assumptions explicitly.
- No experimental findings have been measured from real surveillance data at E01 protocol creation.

## Execution gate
Await access to the authentic evaluation data/checkpoints or a verifiable independent reproduction. Until then report **NOT MEASURED** for actual model coverage and error.
