# Coordinate validation gate: PASSED

This is a fail-closed pre-processing gate. JSON output must not be written when this report is `FAILED`.

## Gate checklist

| Requirement | Result |
| --- | --- |
| Coordinate transform inverse | PASS - exhaustive max error 1.02475930688e-13 world units |
| Image bounds statistics | PASS - generated for all configured maps |
| Missing X/Z coordinates | PASS - 0 |
| NaN/infinite X/Z coordinates | PASS - 0 |
| Finite transformed pixel coordinates | PASS - 0 |
| Known map configurations | PASS - 3/3 |
| All maps validated | PASS - AmbroseValley, GrandRift, Lockdown |

## Source map dimensions

| Map | Source image | Native dimensions | Logical plotting dimensions |
| --- | --- | --- | --- |
| AmbroseValley | AmbroseValley_Minimap.png | 4320x4320 | 1024x1024 |
| GrandRift | GrandRift_Minimap.png | 2160x2158 | 1024x1024 |
| Lockdown | Lockdown_Minimap.jpg | 9000x9000 | 1024x1024 |

## Result

The README transform is algebraically correct and has zero (floating-point-noise only) round-trip error. Visual artifacts were generated from the actual minimaps at [validation-assets](validation-assets/). The paths stay on the maps under the documented orientation; inspect these committed artifacts before changing the transform.

## Transform and inverse

For logical image size `S=1024`, `px=(x-origin_x)/scale*S` and `py=(1-(z-origin_z)/scale)*S`. The independent inverse is `x=origin_x+px/S*scale`, `z=origin_z+(1-py/S)*scale`. `y` is elevation and is intentionally excluded. Source images differ in native pixel dimensions but are rendered into the same 1024×1024 logical coordinate space; scale source images proportionally for display.

## Bounds (all coordinate-bearing rows)

| Map | World X range | World Z range | % outside 1024² | Mean outside distance (px) | Max outside distance (px) |
| --- | --- | --- | --- | --- | --- |
| AmbroseValley | -324.97 … 301.79 | -380.01 … 360.76 | 0.000% | 0.00 | 0.00 |
| GrandRift | -225.90 … 256.62 | -194.00 … 170.11 | 0.000% | 0.00 | 0.00 |
| Lockdown | -406.63 … 348.36 | -285.10 … 329.24 | 0.000% | 0.00 | 0.00 |

## Out-of-bounds distribution

| Dimension | Counts |
| --- | --- |
| Total | 0 |
| By map | AmbroseValley: 0; GrandRift: 0; Lockdown: 0 |
| By event |  |
| Journey position |  |
| Top matches |  |
| Top players |  |

The red overlay isolates all out-of-bounds points. The distribution table distinguishes first/last/interior points; use it with the overlay to assess edge/spawn clustering rather than silently clipping records.

## Numerical and alternative-transform checks

| Check | Result |
| --- | --- |
| Invalid/non-finite X or Z | 0 |
| 1,000-point world-to-pixel-to-world RMSE | 2.97411155777e-14 world units |
| 1,000-point maximum error | 8.03887338846e-14 world units |
| 1,000-point mean error | 1.56374123093e-14 world units |
| Exhaustive maximum error | 1.02475930688e-13 world units |

| Transform | In-bounds rate | Mean minimap brightness at in-bounds traffic pixels |
| --- | --- | --- |
| README | 100.000% | 87.78 |
| flip Y removed | 100.000% | 60.41 |
| flip X | 100.000% | 53.21 |
| swapped axes | 100.000% | 54.59 |
| 20% larger scale | 100.000% | 58.33 |

Brightness is only a reproducible image-alignment heuristic, not a semantic road detector; it cannot by itself prove correctness. The decisive checks are the exact inverse, correctly oriented map overlay, and visual inspection of the generated journey/traffic figures. Alternatives are retained to make an accidental flip, swap, or scale change visible and measurable.
