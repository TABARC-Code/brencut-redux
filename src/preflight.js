// The cutter only gets a job after the sheet, borders and traced paths agree.
const PX_PER_MM = 300 / 25.4;
const EDGE_MM = 3;

function bounds(k) {
  const w = k.sw * k.s, h = k.sh * k.s;
  return { x: k.x, y: k.y, w: k.rot % 2 ? h : w, h: k.rot % 2 ? w : h };
}

function intersects(a, b, gap = 0) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap &&
    a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

export function inspectSheet(stickers, cut, settings, sheet, stale = false) {
  const errors = [], warnings = [];
  const error = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });
  if (!Array.isArray(stickers) || !stickers.length) error('empty', 'Add artwork before printing');
  if (!settings || !Number.isFinite(settings.marginMm) || settings.marginMm < 0 || settings.marginMm > 10 ||
      !Number.isInteger(settings.knifePressure) || settings.knifePressure < 1 || settings.knifePressure > 100 ||
      typeof settings.cutHoles !== 'boolean') error('settings', 'Cutting settings are invalid');
  if (stale) error('stale', 'The cut preview is still being updated');
  if (!cut || typeof cut.plt !== 'string' || !cut.plt || !Array.isArray(cut.paths) || !cut.paths.length ||
      !Array.isArray(cut.contours) || !cut.contours.length) error('no-cut', 'No usable cutting paths detected');

  const boxes = [];
  if (Array.isArray(stickers)) for (const k of stickers) {
    if (!k || !Number.isInteger(k.sw) || !Number.isInteger(k.sh) || k.sw < 1 || k.sh < 1 ||
        !Number.isFinite(k.s) || k.s <= 0 || !Number.isInteger(k.rot) || k.rot < 0 || k.rot > 3) {
      error('geometry', 'Artwork has invalid dimensions or rotation'); continue;
    }
    const b = bounds(k);
    if (![b.x, b.y, b.w, b.h].every(Number.isFinite) || b.w <= 0 || b.h <= 0 ||
        b.x < 0 || b.y < 0 || b.x + b.w > sheet.w + 0.01 || b.y + b.h > sheet.h + 0.01) {
      error('bounds', (k.name || 'Artwork') + ' extends beyond the sheet'); continue;
    }
    boxes.push({ name: k.name || 'Artwork', ...b });
  }
  const gap = (Number.isFinite(settings?.marginMm) ? 2 * settings.marginMm + 1 : 1) * PX_PER_MM;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (intersects(a, b)) error('overlap', a.name + ' overlaps ' + b.name);
    else if (intersects(a, b, gap)) error('cut-gap', a.name + ' and ' + b.name + ' are too close for their cut borders');
  }

  if (Array.isArray(cut?.contours)) {
    let nearEdge = false;
    for (const contour of cut.contours) {
      if (settings?.cutHoles && !Array.isArray(contour?.inners)) error('contour', 'A cut contour is missing its inner paths');
      const polys = [contour?.outer, ...(Array.isArray(contour?.inners) ? contour.inners : [])];
      for (const poly of polys) {
        if (!Array.isArray(poly) || poly.length < 3) { error('contour', 'A cut contour is malformed'); continue; }
        for (const p of poly) {
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
              p.x < 0 || p.y < 0 || p.x > sheet.w || p.y > sheet.h) {
            error('cut-bounds', 'A cutting path leaves the sheet'); break;
          }
          if (p.x < EDGE_MM * PX_PER_MM || p.y < EDGE_MM * PX_PER_MM ||
              p.x > sheet.w - EDGE_MM * PX_PER_MM || p.y > sheet.h - EDGE_MM * PX_PER_MM) nearEdge = true;
        }
      }
    }
    if (nearEdge) warn('edge', 'A cutting path is within 3 mm of the sheet edge; check alignment');
  }
  return { ok: errors.length === 0, errors, warnings };
}
