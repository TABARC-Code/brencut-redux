// Portable project records. Keep validation away from the editor so a bad file can't half-load a sheet.
export const PROJECT_LIMIT = 40 * 1024 * 1024;
export const PROJECT_ITEMS_LIMIT = 100;
export const SOURCE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const IMAGE_PIXELS_LIMIT = 12_000_000;
const TOTAL_PROJECT_PIXELS_LIMIT = 32_000_000;
const dataUrlPattern = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/;

function checkDataUrl(value, working = false) {
  if (typeof value !== 'string' || value.length > PROJECT_LIMIT) throw new Error('Invalid embedded artwork');
  const match = dataUrlPattern.exec(value);
  if (!match || (working && match[1] !== 'image/png') || match[2].length < 16 || match[2].length % 4 !== 0) {
    throw new Error('Invalid embedded artwork');
  }
  return match[1];
}

export function validateProjectDocument(doc, sheet) {
  if (!doc || doc.format !== 'brencut-project' || ![1, 2].includes(doc.version) ||
      !Array.isArray(doc.sheet) || doc.sheet.length !== 2 ||
      doc.sheet[0] !== sheet.w || doc.sheet[1] !== sheet.h ||
      !Array.isArray(doc.stickers) || doc.stickers.length > PROJECT_ITEMS_LIMIT ||
      !doc.cut || typeof doc.cut !== 'object') throw new Error('Unsupported or malformed project');
  const cut = doc.cut;
  if (!Number.isFinite(cut.marginMm) || cut.marginMm < 0 || cut.marginMm > 10 ||
      !Number.isInteger(cut.knifePressure) || cut.knifePressure < 1 || cut.knifePressure > 100 ||
      typeof cut.cutHoles !== 'boolean') throw new Error('Invalid cutting settings');

  let totalPixels = 0;
  for (const item of doc.stickers) {
    if (!item || typeof item.name !== 'string' || item.name.length > 240 ||
        !Number.isInteger(item.sw) || !Number.isInteger(item.sh) ||
        item.sw < 1 || item.sh < 1 || item.sw * item.sh > IMAGE_PIXELS_LIMIT ||
        !Number.isFinite(item.s) || item.s <= 0 ||
        !Number.isInteger(item.rot) || item.rot < 0 || item.rot > 3 ||
        !Number.isFinite(item.x) || !Number.isFinite(item.y) ||
        typeof item.sheet !== 'boolean') throw new Error('Invalid artwork record');
    totalPixels += item.sw * item.sh;
    if (totalPixels > TOTAL_PROJECT_PIXELS_LIMIT) throw new Error('Project artwork exceeds the memory limit');
    checkDataUrl(item.png, true);
    if (doc.version === 2) {
      if (item.source !== null && item.source !== undefined) {
        if (!item.source || typeof item.source.name !== 'string' || item.source.name.length > 240 ||
            !SOURCE_MIMES.has(checkDataUrl(item.source.data))) throw new Error('Invalid original artwork');
      }
    }
    const w = item.sw * item.s, h = item.sh * item.s;
    const boxW = item.rot % 2 ? h : w, boxH = item.rot % 2 ? w : h;
    if (!Number.isFinite(boxW) || !Number.isFinite(boxH) ||
        item.x < 0 || item.y < 0 || item.x + boxW > sheet.w + 0.01 || item.y + boxH > sheet.h + 0.01) {
      throw new Error('Artwork extends beyond the sheet');
    }
  }
  // A JSON file can be large even when each image looks reasonable on its own.
  if (JSON.stringify(doc).length > PROJECT_LIMIT) throw new Error('Project exceeds 40 MiB');
  return doc;
}

export function makeProjectDocument(stickers, cut, sheet) {
  return validateProjectDocument({
    format: 'brencut-project', version: 2, sheet: [sheet.w, sheet.h], cut, stickers,
  }, sheet);
}
