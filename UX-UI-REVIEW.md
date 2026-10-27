# BrenCut v1.1.0 — UX/UI review

## Aim

Preserve the 4 × 7-inch PixCut S1 print-and-cut workflow; provide three interchangeable visual styles without affecting the cutter. The original dark interface is the Simple baseline. Kawaii offers a light, softly coloured sticker-studio layout. Engineer uses a dark technical palette and workspace grid. All three share the same controls.

## What changed

- Added Simple / Kawaii / Engineer toolbar buttons with `aria-pressed` selection state. Preference is kept under `brencut.appearance` in localStorage and validated on read.
- Introduced one CSS semantic colour system. Preview overlays and drag/selection outlines update to match each appearance; no colours leak into the JPEG or PLT output.
- Added a `?` button and native accessible help dialog covering import, transparency, cut outlines, shortcuts, connection and the effect of style changes.
- Organised the sidebar into three sequential tasks: Add & arrange artwork, Set up the cut, Print or export.
- Added contextual status text for missing artwork, stale or invalid cut paths, unsupported USB browsers, ready jobs and running jobs.
- Improved the empty workspace, item-list empty state, minimum button sizes, focus outlines and mobile layout.
- Added accessible names for item action buttons and a progress bar value; suppressed sticker shortcuts while focused on a control or Help.
- Preserved the original application's import behaviour, placement rules, media dimensions, tracing code, protocol and file-export routines.

## Inspection and verification

- `npm test` on Node v22.16.0: 19 passing, 0 failing, including four appearance tests.
- `node --check src/app.js`: passed.
- Chromium rendering inspected for Simple, Kawaii and Engineer at 1440 × 900, and Kawaii at 390 × 844. The three selectors changed background and pressed states without browser errors; the mobile page had no horizontal overflow.
- Native help modal opened and Escape closed it.
- SHA-256 of `src/protocol.js` and `src/cut.js` matches the v1.0.1 input source; vendored tracer unchanged.
- Screenshot previews were made from the actual updated HTML/CSS and appearance module with a static placeholder canvas, **not** from a fully bundled/running cutter.
- `npm ci --offline` could not populate dependencies because the available cache is incomplete (`zod` missing), so the `esbuild` production compilation could not be run here.
- No PixCut S1 is connected in this environment. Live printing, hardware cancellation, browser WebUSB permissions and exact output on physical stock were not tested.

## Use

Run `npm ci && npm test && npm run build` with Node 22.6+ and a working npm connection, then serve the resulting `dist/index.html` over HTTPS or localhost to use WebUSB. The source ZIP includes a separate `appearance-preview.html` that opens offline and lets you compare themes and Help; it is a **non-printing design preview**.

## Next UX improvements, without scope creep

- Save/reopen sheet projects with original artwork embedded.
- Add an Undo/Redo history for arrange, resize and rotate.
- Offer a preflight summary of sticker count, overlaps and number of cut paths before printing.
- Design a clearer blocked-job recovery route when cut tracing fails.
