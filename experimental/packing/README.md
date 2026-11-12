# Experimental packing workbench

Standalone browser-based layout planner for checking precise arrangements before integration into the main BrenCut editor. This folder is isolated from the printer and does not send cutting commands.

Open `index.html` in a modern browser. Add rectangular pieces in millimetres, lock placements, set sheet dimensions and spacing, then choose **Arrange**. A failed arrangement leaves positions unchanged and lists pieces that could not fit. Rotation is opt-in and may be restricted per piece.

This is a geometry workbench, not a verified print-and-cut workflow. It has no material presets, hardware control or automatic cutting.

Run `npm test` to check the packing logic and `npm run build` for JavaScript syntax checks. No dependencies are needed.
