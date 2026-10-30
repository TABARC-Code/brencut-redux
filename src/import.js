// Only the selected import mode decides whether artwork is a prepared sheet.
export function classifyImport(mode, width, height, sheet) {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      !sheet || !Number.isInteger(sheet.w) || !Number.isInteger(sheet.h)) {
    throw new Error('Invalid artwork dimensions');
  }
  if (mode === 'stickers') return { sheet: false, crop: null, landscape: false };
  if (mode !== 'sheet') throw new Error('Unknown import mode');
  const padded = width === sheet.rasterW && height === sheet.rasterH;
  const crop = padded ? { x: sheet.padX, y: sheet.padY, w: sheet.w, h: sheet.h } : null;
  const w = crop ? crop.w : width, h = crop ? crop.h : height;
  const aspect = w / h;
  const landscape = Math.abs(aspect - sheet.h / sheet.w) < 0.01;
  if (!landscape && Math.abs(aspect - sheet.w / sheet.h) >= 0.01) {
    throw new Error('Full-sheet import requires a 4:7 or 7:4 aspect ratio');
  }
  return { sheet: true, crop, landscape };
}
