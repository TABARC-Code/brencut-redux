// Visual guides only. They never move the artwork or alter the print raster.
const bounds = k => {
  const w = k.sw * k.s, h = k.sh * k.s;
  return { x: k.x, y: k.y, w: k.rot % 2 ? h : w, h: k.rot % 2 ? w : h };
};
function nearest(anchors, targets, tolerance) {
  let best = null;
  for (const anchor of anchors) for (const target of targets) {
    const distance = Math.abs(anchor - target);
    if (distance <= tolerance && (!best || distance < best.distance)) best = { value: target, distance };
  }
  return best?.value ?? null;
}
export function findGuides(item, others, sheet, tolerance = 12) {
  if (!item || !sheet || !Number.isFinite(tolerance) || tolerance < 0) return { x: null, y: null };
  const b = bounds(item);
  const xs = [sheet.w / 2], ys = [sheet.h / 2];
  for (const k of others) {
    if (k === item) continue;
    const q = bounds(k);
    xs.push(q.x, q.x + q.w / 2, q.x + q.w);
    ys.push(q.y, q.y + q.h / 2, q.y + q.h);
  }
  return {
    x: nearest([b.x, b.x + b.w / 2, b.x + b.w], xs, tolerance),
    y: nearest([b.y, b.y + b.h / 2, b.y + b.h], ys, tolerance),
  };
}
