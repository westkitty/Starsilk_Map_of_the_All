/** Clamp animation clock discontinuities before procedural curve sampling.
 * RAF timestamps can be slightly older than performance.now() at construction.
 * Returning a negative elapsed delta sends getPointAt(t<0) outside a curve's domain.
 */
export function frameDelta(now, previous, maxDelta=80) {
  if (!Number.isFinite(now) || !Number.isFinite(previous)) return 0;
  return Math.max(0, Math.min(maxDelta, now-previous));
}

/** Wrap finite cyclic animation phases into the [0,1) curve domain. */
export function wrapCurvePhase(value) {
  if (!Number.isFinite(value)) return 0;
  return ((value%1)+1)%1;
}

/** Cubic ease-out for responsive camera decelerations. */
export function easeOutCubic(t) {
  if (!Number.isFinite(t)) return 0;
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/** Cubic ease-in-out for smooth cinematic camera journeys between scales. */
export function easeInOutCubic(t) {
  if (!Number.isFinite(t)) return 0;
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5 ? 4 * clamped * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

