# Accessibility Review

## Implemented

- Native labels for filters, selected player, timeline, and map canvas.
- Visible focus outlines for buttons, inputs, selects, and keyboard-focusable Canvas.
- Keyboard controls for playback, stepping, layer toggles, heatmap toggle, and clearing selections.
- Resizable rail handles expose separator semantics and keyboard sizing controls.
- Inspector sections use native `details`/`summary`; interactive insight cards support hover and keyboard focus.
- Textual semantic labels complement color for human/bot/event/heatmap distinctions.

## Remaining validation

Before a public submission, run a screen-reader pass (NVDA/VoiceOver), automated contrast audit, and keyboard-only deployed walkthrough. Canvas path/event content is exposed primarily through the adjacent inspector and labels rather than a complete screen-reader representation; that is an acceptable trade-off for this visual-analysis tool but should be documented.
