# BrenCut Redux

A small browser-based workspace for preparing sticker sheets and cutting them on a **Liene PixCut S1**. Import artwork, arrange it on the page, check the cut line, then print and cut over USB. The aim is to make the job less fiddly without turning a sticker utility into half a design suite.

This is the **TABARC-Code** fork of [LTKMN/brencut](https://github.com/LTKMN/brencut). The original project and its contributors made direct USB printing possible; this fork develops the interface, safeguards and everyday workflow while keeping that working core in place.

**Version:** 1.3.2  
**Status:** Development release. Software checks pass; cancellation and bounded transfer recovery have simulated transport tests; physical PixCut S1 confirmation remains outstanding.

Manual printing remains the default. The print panel also offers automatic printing after an artwork import batch. This requires an idle, alert-free connected printer, valid cut paths and non-overlapping, in-bounds artwork. Hardware validation is still outstanding.

## Getting started

1. Open the application in **Chrome or Edge** over HTTPS or localhost. Plug in the PixCut S1 and select **Connect**. Close the Liene application or any other tab using the printer first.
2. Add transparent PNG artwork by file picker, drag-and-drop or paste. Drag to position it, pull the corner handle to resize, or use the artwork list for precise dimensions. **Arrange** lays out separate stickers automatically.
3. Set the white border and knife pressure, inspect the cut preview, then choose **Print & Cut**. You can export the JPEG and PLT files without a printer attached.

The working sticker area is **4 × 7 inches**, at **300 DPI**. Full sheets are supported when imported at the expected aspect ratio. A large single sticker can currently be mistaken for a complete sheet; an explicit import choice is planned.

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
- Arrange uses a basic row layout. If it can't fit the artwork, it leaves the previous arrangement alone. Better packing is in the plan.
- Cancel stops scheduling further upload chunks and sends a single cancel command once the printer has assigned a job number. Already-started USB transfers cannot be recalled, and the printer may continue moving. Confirm it has stopped before handling the sheet. A failed or interrupted transfer requires disconnecting and reconnecting before sending another job.

USB writes, acknowledgements and printer status requests now have finite timeouts. Lost status replies are retried without resending image or cut-path chunks; after repeated failures, BrenCut requests cancellation and asks for a fresh connection. The printer's actual state remains uncertain after a disconnection, or if job declaration times out before the printer returns its job number. Cancellation error replies are also reported rather than treated as success.

See [`CHANGELOG.md`](CHANGELOG.md) for changes and [`ROADMAP.md`](ROADMAP.md) for the staged work: safe cancellation, project files, a proper cutting preflight, better packing, explicit sheet import and editing conveniences.

## Credits and licence

BrenCut began with [LTKMN/brencut](https://github.com/LTKMN/brencut). The cut tracer is from [honeymaro/pixcut](https://github.com/honeymaro/pixcut) (MIT), and the USB work is based on [popcornhax/PixCut-App](https://github.com/popcornhax/PixCut-App) (MIT). Their copyright notices and licences remain with the source. See [`LICENSE`](LICENSE) and [`vendor/pixcut-trace/LICENSE`](vendor/pixcut-trace/LICENSE).

BrenCut Redux is maintained by **TABARC-Code**. It is independent software and is not endorsed by Liene or Hannto. Use it with the usual care around a machine with a blade and a heater.
