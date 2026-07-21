# Coordinate Validation

## Validation approach

The README formula was tested against the provided minimap metadata using the world-space `x` and `z` values from the parquet files.

## Verified projection formula

```
u = (x - origin_x) / scale
v = (z - origin_z) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024
```

## Coordinate ranges found in data

- X range: -406.63 to 348.36
- Z range: -380.01 to 360.76

## Validation result

- No invalid coordinate values were found in the inspected rows.
- The formula is consistent with the README and the provided minimap configuration.
- A plot was generated at [docs/coordinate_validation_plot.png](coordinate_validation_plot.png) showing sample trajectories over the minimaps.

## Notes

The trajectories appear to align with the expected minimap orientation when using the provided formula and the Y-axis inversion.
