# BrenCut Workshop: experimental multi-sheet and model-making release

This is a standalone browser workspace in `experimental/packing`. Open `index.html` to create products, queue production quantities, arrange independent sheets and export the selected sheet. The main BrenCut printer application is unchanged.

## Included

- A reusable catalogue for stickers, labels, decals, panels, strips and components, with dimensions, materials, quantities, optional embedded artwork and score/through operations.
- Multiple independent sheets with editable dimensions, material, spacing, kerf clearance, rotation and locked placements.
- Batch planning that groups materials, places quantities on compatible sheets, creates additional sheets when required and reports products that cannot fit. Batches are prepared on a copy; failed batches do not alter the open project.
- Deterministic rectangular packing without resizing. Rotation is optional and respects grain restrictions.
- Separate SVG and DXF geometry exports for score and through-cut operations, scoped to the selected sheet.
- JSON project save and load with validation. Catalogue products are reusable; changing catalogue entries does not rewrite existing sheet dimensions.
- Regression tests for packing, projects, batches, materials, locked placements and geometry exports.

## Limits

This is an experimental layout and vector geometry editor. It does not connect to the PixCut S1, send cutting commands, or supply material pressure presets. Artwork is retained in the catalogue, but the sheet preview and vector exports represent geometry only; they are **not** print-ready raster sticker sheets. Kerf is currently a clearance allowance in packing, not a compensated toolpath. SVG/DXF outputs require inspection in the intended manufacturing workflow. The default generated batch sheets are 101.6 × 177.8 mm; manually created sheets can use other dimensions.

## Checks

From this folder run `npm test` and `npm run build`. No external dependencies are required.
