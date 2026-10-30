# BrenCut Redux

A small browser-based workspace for preparing sticker sheets and cutting them on a **Liene PixCut S1**. Import artwork, arrange it on the page, check the cut line, then print and cut over USB. The aim is to make the job less fiddly without turning a sticker utility into half a design suite.

This is the **TABARC-Code** fork of [LTKMN/brencut](https://github.com/LTKMN/brencut). The original project and its contributors made direct USB printing possible; this fork develops the interface, safeguards and everyday workflow while keeping that working core in place.

**Version:** 1.8.4  
**Status:** Development release. Software checks pass; cancellation and bounded transfer recovery have simulated transport tests; physical PixCut S1 confirmation remains outstanding.

Manual printing remains the default. The print panel also offers automatic printing after an artwork import batch. This requires an idle, alert-free connected printer, valid cut paths and non-overlapping, in-bounds artwork. Hardware validation is still outstanding.

**Portable projects:** Save project exports a versioned .brencut JSON document with the working PNG bitmaps, original uploaded artwork (when available), geometry and cutting settings. Open project checks the entire document before replacing the current sheet. Version 1 projects still open, though they cannot recover originals that were never saved. Opening does not start printing. Maximum project size: 40 MiB; individual original images are limited to 12 MiB, with a 32-million-pixel total working-artwork budget on load. Saving snapshots the current geometry before encoding images; importing or opening a project cannot race the start of a print job.

**Explicit import mode:** Artwork is imported as individual stickers by default, even if its dimensions happen to match a full sheet. Select Full 4 × 7 sheet when importing a prepared page. This preference is stored locally. Full-sheet import requires an empty page and exactly one image; padded printer rasters are cropped only in this mode.

## Getting started

1. Open the application in **Chrome or Edge** over HTTPS or localhost. Plug in the PixCut S1 and select **Connect**. Close the Liene application or any other tab using the printer first.
2. Add transparent PNG artwork by file picker, drag-and-drop or paste. Drag to position it, pull the corner handle to resize, or use the artwork list for precise dimensions. **Arrange** packs separate stickers without changing their size. Tick **Allow 90° rotation** to try both orientations. If any item will not fit, the existing positions stay untouched.
3. Set the white border and knife pressure, inspect the cut preview, then choose **Print & Cut**. You can export the JPEG and PLT files without a printer attached.

The working sticker area is **4 × 7 inches**, at **300 DPI**. Full sheets are supported when imported at the expected aspect ratio. The import mode is explicit: individual stickers are the default; choose Full 4 × 7 sheet for prepared artwork. A sticker matching the printer raster dimensions is no longer cropped by mistake. If new artwork cannot fit without an overlap, it is not added; oversized stickers are reported when reduced to fit.

**WebUSB matters:** Chrome and Edge can connect to the printer. Browsers without WebUSB can still prepare artwork and export files, but cannot print directly. Nothing is uploaded to a server by the application.

## Three looks, same cutter

Choose an appearance at the top of the window:

- **Simple:** the original dark, uncluttered approach.
- **Kawaii:** light colours, soft corners and a friendlier workbench.
- **Engineer:** a more technical, grid-led layout.

The selection is remembered in your browser and doesn't affect cut geometry, USB commands or saved printer settings. The **?** button explains the controls and useful keyboard shortcuts. The layout also adapts to narrower screens.

There is an offline appearance demo in [`appearance-preview.html`](appearance-preview.html). It is a visual preview only; for actual image work and printing, run the application.

## Controls and shortcuts

- Drag artwork to move it; drag its corner to resize.
- Arrow keys move a selected item by **1 mm**, or **5 mm** while holding Shift.
- **R** rotates, **D** duplicates, **Delete** removes and **Escape** clears the selection.
- **Ctrl+V** pastes artwork from the clipboard.
- **Ctrl+Z** undoes the last layout edit; **Ctrl+Y** or **Ctrl+Shift+Z** redoes it. Undo and Redo buttons are alongside Arrange. History holds up to 40 edits in the current session and resets when a project is opened.

For transparent artwork, the cut follows the visible shape with an adjustable white border. Fully opaque individual images produce a rectangular cut. A fully opaque sheet cannot supply the individual cut outlines. Don't rely on a preview that contains no cut paths: BrenCut refuses to print those jobs.

## Build and test

Node.js **22.6 or newer** is required by the current test setup.

```sh
npm install
npm test           # protocol, tracing, safety and appearance checks
npm run dev        # development server: http://localhost:5174
npm run build      # self-contained dist/index.html
```

The application is plain JavaScript with a vendored TypeScript cut tracer. `src/app.js` handles the editing canvas and print workflow, `src/appearance.js` handles appearance and Help, `src/cut.js` prepares PLT instructions, `src/protocol.js` handles printer commands and `src/webusb.js` handles the USB connection.

The current automated checks cover only simulated code paths. They do not replace a real print-and-cut check on sticker stock.

## Safety and current limits

- Default knife pressure is **42**, the setting documented for Liene sticker stock. Adjustable range is **1–100**; different media require testing. Don't guess a pressure for expensive paper.
- Cut tracing has a **100-contour limit**. If there are too many separate shapes the job is refused rather than silently dropping cuts.
- Very small artwork can disappear during tracing. Increase its size or adjust the border, then check the preview.
- Arrange tries several space-saving placements and can rotate stickers by 90° when you allow it. No automatic shrinking or partial rearrangement. It will refuse a crowded sheet rather than quietly overlapping the cuts.
- Cutting preflight blocks overlapping stickers, unsafe gaps between cut borders, malformed or out-of-sheet paths and invalid cutting settings. A path within 3 mm of an edge produces a warning. Print and export controls stay disabled until blocking errors are fixed. Export actions also recheck the current cut, including after dragging artwork.
- Cancel stops scheduling further upload chunks and sends a single cancel command once the printer has assigned a job number. Already-started USB transfers cannot be recalled, and the printer may continue moving. Confirm it has stopped before handling the sheet. A failed or interrupted transfer requires disconnecting and reconnecting before sending another job.

USB writes, acknowledgements and printer status requests now have finite timeouts. Lost status replies are retried without resending image or cut-path chunks; after repeated failures, BrenCut requests cancellation and asks for a fresh connection. The printer's actual state remains uncertain after a disconnection, or if job declaration times out before the printer returns its job number. Cancellation error replies are also reported rather than treated as success.

See [`CHANGELOG.md`](CHANGELOG.md) for changes and [`ROADMAP.md`](ROADMAP.md) for the staged work: safe cancellation, project files, a proper cutting preflight, better packing, explicit sheet import and editing conveniences.

## Credits and licence

BrenCut began with [LTKMN/brencut](https://github.com/LTKMN/brencut). The cut tracer is from [honeymaro/pixcut](https://github.com/honeymaro/pixcut) (MIT), and the USB work is based on [popcornhax/PixCut-App](https://github.com/popcornhax/PixCut-App) (MIT). Their copyright notices and licences remain with the source. See [`LICENSE`](LICENSE) and [`vendor/pixcut-trace/LICENSE`](vendor/pixcut-trace/LICENSE).

BrenCut Redux is maintained by **TABARC-Code**. It is independent software and is not endorsed by Liene or Hannto. Use it with the usual care around a machine with a blade and a heater.
