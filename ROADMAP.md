# BrenCut Redux — development notes

Maintainer: TABARC-Code  
Working baseline: 1.9.2

Keep the USB protocol, 4 × 7-inch output format, existing cut geometry and three appearance options stable unless tests or hardware evidence justify a change. Make each release buildable before moving on. The machine gets the final say.

## v1.1.0 — Interface and baseline [DONE]

- Three switchable appearances: Simple, Kawaii and Engineer.
- Help button with controls and keyboard shortcuts.
- Clearer editor actions, printer status and mobile layout.
- Safety checks for empty cuts, 100-contour overflow and failed arrangements.
- Existing hardware behaviour intentionally left alone.

## v1.1.7 — Cancellation [DONE]

- Stop scheduling further upload chunks after a cancellation request.
- Send one cancellation command when the job ID is known.
- Simulated cancellation cases cover blocked reads and writes. Physical stop timing remains unverified.

## v1.2.3 — Bounded transfer and recovery [DONE]

Follow-up v1.2.8 [DONE]: declaration timeout now leaves the connection marked uncertain; cancellation error replies are not mistaken for success.

- Bound time waiting for a printer job; make failure and retry states legible. Reconnect after an interrupted transfer.
- Add simulated USB tests for a blocked transfer, lost connection, a cancelled upload and recovery.
- Do not claim the device will stop mid-cut until hardware testing proves it.

Acceptance: the application stops *sending* additional chunks after cancel; the printer receives a cancel request when a job ID exists; no stalled operation leaves the interface permanently busy; mocked transport tests pass.

## v1.3.x — Project files and cutting preflight [PARTIAL]

- Save source artwork with position, rotation, scale and cutting settings in a portable project file.
- Reopen without depending on browser storage; validate file version and corrupted inputs.
- Preview missing cut paths, contours near the edge, overlaps and unsupported sheet layouts before printing.
- Distinguish warnings from hard stops; don't invent physical tolerances.
- Compare exported JPEG and PLT against the original before and after a project round-trip.

Acceptance: reopen a project with the same sheet geometry and settings; tests for invalid or incomplete files; preflight blocks known unsafe output.

## v1.4.x–v1.7.x — Layout and explicit import [PARTIAL]

Follow-up v1.7.3 [DONE]: bounded packing, optional 90° rotation and all-or-nothing placement with dense fixture coverage.

Follow-up v1.7.8 [DONE]: prepared-sheet import no longer crops ordinary sticker artwork; mixed-mode imports are refused.

- Offer **individual sticker** and **full sheet** during import instead of guessing solely from dimensions.
- Improve packing with optional 90-degree rotation and real cut margins.
- Leave manually placed stickers alone unless the user chooses Arrange.
- Show exactly what didn't fit rather than shifting or shrinking artwork silently.

Acceptance: packing never silently overlaps stickers; dense fixtures demonstrate equal or better use of space; the original arrange behaviour remains available as fallback.

## v1.5.x–v1.8.x — Editing workflow [PARTIAL]

Follow-up v1.8.4 [DONE]: 40-step undo/redo for geometry and artwork list edits.

Follow-up v1.9.2 [DONE]: visual alignment guides during dragging. Multiple sheets and optional snapping remain open.

- Undo/redo for placement, resizing, rotating and deletion.
- Alignment guides and reliable dimensions in millimetres.
- Multiple sheets as independent pages, with deliberate exports and print order.
- Keep printer state separate from document state so changing appearance or changing pages never triggers a print job.

Acceptance: undo/redo round-trips geometry; no shared-state leaks between sheets; keyboard operations remain accessible.

## Still open

- Printer-dependent cancellation timing, alignment and pressure need a real PixCut S1.
- Project-file format must be versioned without making the archive fragile.
- Full-sheet import needs a deliberate default, not another silent heuristic.
- Future ideas are useful; quietly breaking print output to add them isn't.

## Current verification ledger (v1.6.2)

- Implemented: working-bitmap project save/open, original uploaded artwork in v2 projects, strict transactional validation, manual/automatic print selection, shared cut preflight with overlap, border-gap and path bounds checks, explicit import selection.
- Not yet verified: browser JPEG byte fidelity after project reopen, physical PixCut S1 operation and full browser workflow. PNG/PLT and padded-raster fixture equivalence now have a regression check.
- Not complete: real printer alignment verification, reliable no-overlap packing, undo/redo, multiple sheets and independent page print ordering.
- Do not mark these complete based on source inspection alone.
