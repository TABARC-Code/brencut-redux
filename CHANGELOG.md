# Changes

## 1.4.1 — explicit import mode

- Default to importing individual stickers; matching a 4:7 ratio no longer silently turns an image into a full sheet.
- Add a persistent Full 4 × 7 sheet option for deliberately prepared sheets, with aspect-ratio validation.
- Portable project files and print mode from earlier releases remain available.
- Browser and physical-device regression tests remain outstanding.

## 1.3.7 — portable projects

- Add Save project / Open project controls and versioned .brencut documents with embedded working PNG images.
- Restore artwork order, geometry, rotation and cut settings after validating the complete document.
- Reject oversized or malformed files without replacing the current sheet; opening never triggers automatic printing.
- Original uncropped uploads are not retained. Hardware and browser regression checks remain outstanding.

## 1.3.2 — import printing and preflight

- Add persisted Manual / Automatic print selector; Manual remains the default.
- Print at most once per completed artwork import batch when printer and cut are ready.
- Reject overlapping or out-of-bounds artwork, invalid cut paths and printer readiness failures.
- Refuse new artwork imports while printing. Physical printer verification is outstanding.

## 1.2.8 — uncertain job declaration

- Distinguish an early cancellation from a cancellation requested while the printer may already have created a job.
- Require reconnecting when job declaration fails without a confirmed job number; do not claim that an unknown job never started.
- Report printer cancellation error replies rather than treating them as accepted.
- Add tests for an unconfirmed declaration and a rejected cancellation response. Physical printer behaviour remains unverified.


## 1.2.3 — bounded transfers and status recovery

- Cap USB command writes, replies, chunk writes and acknowledgements. A stuck transfer no longer holds the interface indefinitely.
- Retry status polling after transient failures without resending print or cut data; stop after repeated failures or a run timeout.
- Request cancellation after a failed declared job and require a fresh printer connection before another attempt. If the connection is gone, the physical job state cannot be confirmed.
- Wake waiting USB readers on disconnect and clear queued data from a closed connection.
- Add simulated stalled acknowledgement, status retry, disconnect and timeout cases. No physical printer test has been carried out.


## 1.1.7 — cancellation during transfer

- Stop queuing further cut-path or image chunks when Cancel is pressed, including while a USB read or write is waiting.
- Send one `cancel-job` command after the printer assigns a job number; avoid duplicate commands from the interface.
- Keep the printer's response separate from confirmation that the mechanism has physically stopped.
- Add simulated cancellation tests for early abort, blocked acknowledgement and blocked write. No printer hardware was used.


## 1.1.0 — switchable interface styles and clearer workflow

- Add Simple, Kawaii and Engineer appearance buttons with local preference persistence; these alter display styling only.
- Add a `?` help dialog with import, cut preview, keyboard and WebUSB guidance.
- Restructure visible controls as three steps and improve visual hierarchy, empty states, disabled-action explanations and focus handling.
- Improve mobile layout and progress accessibility; retain original cutting and printer logic.
- Add appearance regression tests and a standalone, non-printing UI preview. See `UX-UI-REVIEW.md`.

The production bundling step and physical PixCut S1 operation have not been verified here. Printer testing remains open.


## 1.0.1 — safety and test reliability

- Explain when a fully opaque sheet cannot define cut lines; refuse to print when tracing produced no actual cutting paths. A non-empty PLT header alone is insufficient.
- Detect the tracer's 100-contour limit and refuse incomplete jobs rather than silently omitting cuts. Developers can raise the limit through `traceSheet` overrides; this is **not** a tested printer capability.
- Prevent Arrange from moving stickers into an overlapping overflow layout when the shelf packer cannot fit everything.
- Prevent a stale trace or failed recomputation being sent when Print is clicked; capture the cut file before asynchronous JPEG encoding.
- Fix `npm test` for supported Node 22 runtimes and add regression cases.
- Match both vendor and product ID when connecting to a newly plugged-in USB device.

The hardware protocol, sheet geometry, margin and knife-pressure defaults, print encoding and upload sequence are unchanged. No physical printer test has been run. The 1.0.1 archive is a local review build, not an official upstream release.

## Remaining priorities

- Add reliable cancellation and a bounded run-state timeout, using a mocked transport first and real S1 hardware before release.
- Add optional save/open project files (including source artwork) and restore without changing print output.
- Warn about manual sticker overlaps, and replace the basic shelf packer with an improved packing algorithm while allowing intentional overlaps.
- Offer an explicit import mode for full sheets, so a similarly shaped sticker isn't misclassified.
- Test cut geometry and printer alignment on real stock before adding new media or pressure presets.
