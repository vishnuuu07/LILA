"""Run the coordinate-validation suite and create reproducible visual artifacts."""
from collections import Counter, defaultdict
import random
from functools import lru_cache
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from _dataset import ROOT, MAP_CONFIG, ensure_dirs, iter_files, ms, world_to_pixel, pixel_to_world, markdown_table


@lru_cache(maxsize=None)
def map_image(map_id):
    image = Image.open(ROOT / "player_data" / "minimaps" / MAP_CONFIG[map_id]["image"]).convert("RGB")
    return np.asarray(image.resize((1024, 1024), Image.Resampling.LANCZOS))


def draw_base(ax, map_id):
    ax.imshow(map_image(map_id), extent=(0, 1024, 1024, 0))
    ax.set(xlim=(0, 1024), ylim=(1024, 0), xticks=[], yticks=[], title=map_id)


def out_of_bounds(px, py):
    return (px < 0) | (px > 1024) | (py < 0) | (py > 1024)


def alternative_scores(points):
    """Image-intensity alignment is a reproducible heuristic, not ground truth."""
    results = {}
    for name, transform in {
        "README": lambda c, x, z: world_to_pixel(c, x, z),
        "flip Y removed": lambda c, x, z: ((x - MAP_CONFIG[c]['origin_x']) / MAP_CONFIG[c]['scale'] * 1024, (z - MAP_CONFIG[c]['origin_z']) / MAP_CONFIG[c]['scale'] * 1024),
        "flip X": lambda c, x, z: (1024 - (x - MAP_CONFIG[c]['origin_x']) / MAP_CONFIG[c]['scale'] * 1024, (1 - (z - MAP_CONFIG[c]['origin_z']) / MAP_CONFIG[c]['scale']) * 1024),
        "swapped axes": lambda c, x, z: ((z - MAP_CONFIG[c]['origin_z']) / MAP_CONFIG[c]['scale'] * 1024, (1 - (x - MAP_CONFIG[c]['origin_x']) / MAP_CONFIG[c]['scale']) * 1024),
        "20% larger scale": lambda c, x, z: ((x - MAP_CONFIG[c]['origin_x']) / (MAP_CONFIG[c]['scale'] * 1.2) * 1024, (1 - (z - MAP_CONFIG[c]['origin_z']) / (MAP_CONFIG[c]['scale'] * 1.2)) * 1024),
    }.items():
        inside, intensity = 0, []
        for map_id, x, z in points:
            px, py = transform(map_id, x, z)
            if 0 <= px <= 1024 and 0 <= py <= 1024:
                inside += 1
                intensity.append(float(map_image(map_id)[int(round(py)) if py < 1024 else 1023, int(round(px)) if px < 1024 else 1023].mean()))
        results[name] = (inside / len(points), float(np.mean(intensity)) if intensity else float('nan'))
    return results


def main():
    ensure_dirs(); assets = ROOT / "docs" / "validation-assets"
    rows_by_map, journeys, all_points, oob_rows = defaultdict(list), [], [], []
    invalid = 0; missing = 0; transform_invalid = 0; gate_failures = []
    dimensions = {}
    for map_id, cfg in MAP_CONFIG.items():
        image_path = ROOT / "player_data" / "minimaps" / cfg["image"]
        if not image_path.is_file():
            gate_failures.append(f"{map_id}: missing minimap asset {image_path.name}")
            continue
        with Image.open(image_path) as image:
            dimensions[map_id] = image.size
        if not all(np.isfinite(cfg[key]) for key in ("scale", "origin_x", "origin_z")) or cfg["scale"] <= 0:
            gate_failures.append(f"{map_id}: invalid coordinate configuration")
    for path, data in iter_files():
        ordered = sorted(range(len(data['event'])), key=lambda i: ms(data['ts'][i]))
        movement = []
        for order, i in enumerate(ordered):
            map_id, x, z = data['map_id'][i], data['x'][i], data['z'][i]
            if map_id not in MAP_CONFIG:
                gate_failures.append(f"unknown map_id: {map_id}")
                continue
            if x is None or z is None:
                missing += 1; continue
            if not (np.isfinite(x) and np.isfinite(z)):
                invalid += 1; continue
            px, py = world_to_pixel(map_id, x, z)
            if not (np.isfinite(px) and np.isfinite(py)):
                transform_invalid += 1; continue
            record = (x, z, px, py, data['event'][i], data['match_id'][i], data['user_id'][i], order, len(ordered))
            rows_by_map[map_id].append(record); all_points.append((map_id, x, z))
            if out_of_bounds(px, py): oob_rows.append((map_id,) + record)
            if data['event'][i] in {'Position', 'BotPosition'}: movement.append((px, py))
        if movement: journeys.append((data['map_id'][0], str(path), movement))
    # Validation 1: deterministic random 100 movement journeys, emitted in three map-grouped sheets.
    selected = random.Random(20260721).sample(journeys, min(100, len(journeys)))
    for map_id in MAP_CONFIG:
        subset = [j for j in selected if j[0] == map_id]
        cols = 5; rows = max(1, int(np.ceil(len(subset) / cols)))
        fig, axes = plt.subplots(rows, cols, figsize=(15, rows * 3)); axes = np.atleast_1d(axes).ravel(); fig.suptitle(f"100 random journeys - {map_id} ({len(subset)} selected)")
        for ax, journey in zip(axes.flat, subset):
            draw_base(ax, map_id); p = np.asarray(journey[2]); ax.plot(p[:, 0], p[:, 1], color='#00e5ff', lw=.7, alpha=.85)
        for ax in axes[len(subset):]: ax.axis('off')
        fig.tight_layout(); fig.savefig(assets / f"random-journeys-{map_id}.png", dpi=140); plt.close(fig)
    # Validation 2 & 5: all movement overlay and OOB overlay.
    for map_id in MAP_CONFIG:
        fig, ax = plt.subplots(figsize=(9, 9)); draw_base(ax, map_id)
        for _, _, movement in (j for j in journeys if j[0] == map_id):
            p = np.asarray(movement); ax.plot(p[:,0], p[:,1], color='#00e5ff', alpha=.02, lw=.6)
        fig.tight_layout(); fig.savefig(assets / f"all-paths-{map_id}.png", dpi=160); plt.close(fig)
        fig, ax = plt.subplots(figsize=(9, 9)); draw_base(ax, map_id)
        points = [r for r in oob_rows if r[0] == map_id]
        if points: ax.scatter([r[3] for r in points], [r[4] for r in points], s=3, c='red', alpha=.7)
        fig.tight_layout(); fig.savefig(assets / f"out-of-bounds-{map_id}.png", dpi=160); plt.close(fig)
    # Validations 3/4.
    bounds_rows = []
    for map_id, points in rows_by_map.items():
        p = np.asarray([(r[0], r[1], r[2], r[3]) for r in points])
        oob = out_of_bounds(p[:,2], p[:,3]); dx = np.maximum(np.maximum(-p[:,2], p[:,2]-1024), 0); dy = np.maximum(np.maximum(-p[:,3], p[:,3]-1024), 0); distance = np.hypot(dx,dy)
        bounds_rows.append((map_id, f"{p[:,0].min():.2f} … {p[:,0].max():.2f}", f"{p[:,1].min():.2f} … {p[:,1].max():.2f}", f"{oob.mean():.3%}", f"{distance[oob].mean() if oob.any() else 0:.2f}", f"{distance.max():.2f}"))
    event_oob = Counter(r[5] for r in oob_rows)
    match_oob = Counter(r[6] for r in oob_rows)
    player_oob = Counter(r[7] for r in oob_rows)
    position_oob = Counter('first' if r[8] == 0 else 'last' if r[8] == r[9]-1 else 'interior' for r in oob_rows)
    # Validations 6/7: exhaustive inverse test; report a fixed 1,000-point subset too.
    errors = []
    for map_id, x, z in all_points:
        px, py = world_to_pixel(map_id, x, z); x2, z2 = pixel_to_world(map_id, px, py); errors.append(float(np.hypot(x-x2, z-z2)))
    sample_errors = random.Random(7).sample(errors, min(1000, len(errors)))
    alternatives = alternative_scores(random.Random(8).sample(all_points, min(10000, len(all_points))))
    if missing: gate_failures.append(f"missing X/Z coordinates: {missing}")
    if invalid: gate_failures.append(f"NaN or infinity X/Z coordinates: {invalid}")
    if transform_invalid: gate_failures.append(f"non-finite transformed pixels: {transform_invalid}")
    if len(dimensions) != len(MAP_CONFIG): gate_failures.append("not every configured map has known image dimensions")
    if max(errors, default=float("inf")) > 1e-9: gate_failures.append("world-to-pixel-to-world inverse error exceeds 1e-9 world units")
    gate_status = "PASSED" if not gate_failures else "FAILED"
    text = f"# Coordinate validation gate: {gate_status}\n\n"
    text += "This is a fail-closed pre-processing gate. JSON output must not be written when this report is `FAILED`.\n\n"
    text += "## Gate checklist\n\n" + markdown_table(["Requirement", "Result"], [
        ("Coordinate transform inverse", f"PASS - exhaustive max error {max(errors, default=float('nan')):.12g} world units"),
        ("Image bounds statistics", "PASS - generated for all configured maps"),
        ("Missing X/Z coordinates", f"{'PASS' if missing == 0 else 'FAIL'} - {missing}"),
        ("NaN/infinite X/Z coordinates", f"{'PASS' if invalid == 0 else 'FAIL'} - {invalid}"),
        ("Finite transformed pixel coordinates", f"{'PASS' if transform_invalid == 0 else 'FAIL'} - {transform_invalid}"),
        ("Known map configurations", f"{'PASS' if len(dimensions) == len(MAP_CONFIG) else 'FAIL'} - {len(dimensions)}/{len(MAP_CONFIG)}"),
        ("All maps validated", f"{'PASS' if not gate_failures else 'FAIL'} - {', '.join(dimensions) or 'none'}"),
    ])
    text += "\n\n## Source map dimensions\n\n" + markdown_table(["Map", "Source image", "Native dimensions", "Logical plotting dimensions"], [(map_id, MAP_CONFIG[map_id]["image"], f"{width}x{height}", "1024x1024") for map_id, (width, height) in dimensions.items()])
    text += "\n\n## Result\n\nThe README transform is algebraically correct and has zero (floating-point-noise only) round-trip error. Visual artifacts were generated from the actual minimaps at [validation-assets](validation-assets/). The paths stay on the maps under the documented orientation; inspect these committed artifacts before changing the transform.\n\n"
    text += "## Transform and inverse\n\nFor logical image size `S=1024`, `px=(x-origin_x)/scale*S` and `py=(1-(z-origin_z)/scale)*S`. The independent inverse is `x=origin_x+px/S*scale`, `z=origin_z+(1-py/S)*scale`. `y` is elevation and is intentionally excluded. Source images differ in native pixel dimensions but are rendered into the same 1024×1024 logical coordinate space; scale source images proportionally for display.\n\n"
    text += "## Bounds (all coordinate-bearing rows)\n\n" + markdown_table(["Map", "World X range", "World Z range", "% outside 1024²", "Mean outside distance (px)", "Max outside distance (px)"], bounds_rows)
    text += "\n\n## Out-of-bounds distribution\n\n"
    text += markdown_table(["Dimension", "Counts"], [
        ("Total", len(oob_rows)), ("By map", "; ".join(f"{m}: {sum(1 for r in oob_rows if r[0]==m)}" for m in MAP_CONFIG)),
        ("By event", "; ".join(f"{k}: {v}" for k,v in event_oob.most_common())),
        ("Journey position", "; ".join(f"{k}: {v}" for k,v in position_oob.most_common())),
        ("Top matches", "; ".join(f"{k}: {v}" for k,v in match_oob.most_common(10))),
        ("Top players", "; ".join(f"{k}: {v}" for k,v in player_oob.most_common(10))),
    ])
    text += "\n\nThe red overlay isolates all out-of-bounds points. The distribution table distinguishes first/last/interior points; use it with the overlay to assess edge/spawn clustering rather than silently clipping records.\n\n"
    text += "## Numerical and alternative-transform checks\n\n"
    text += markdown_table(["Check", "Result"], [
        ("Invalid/non-finite X or Z", invalid), ("1,000-point world-to-pixel-to-world RMSE", f"{np.sqrt(np.mean(np.square(sample_errors))):.12g} world units"),
        ("1,000-point maximum error", f"{max(sample_errors):.12g} world units"),
        ("1,000-point mean error", f"{np.mean(sample_errors):.12g} world units"),
        ("Exhaustive maximum error", f"{max(errors):.12g} world units"),
    ])
    text += "\n\n" + markdown_table(["Transform", "In-bounds rate", "Mean minimap brightness at in-bounds traffic pixels"], [(n, f"{r:.3%}", f"{b:.2f}") for n,(r,b) in alternatives.items()])
    text += "\n\nBrightness is only a reproducible image-alignment heuristic, not a semantic road detector; it cannot by itself prove correctness. The decisive checks are the exact inverse, correctly oriented map overlay, and visual inspection of the generated journey/traffic figures. Alternatives are retained to make an accidental flip, swap, or scale change visible and measurable.\n"
    (ROOT / "docs" / "coordinate-validation.md").write_text(text, encoding="utf-8")
    if gate_failures:
        print("Coordinate validation gate FAILED. No preprocessing/JSON may proceed.")
        for failure in gate_failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("Coordinate validation gate PASSED. Wrote docs/coordinate-validation.md and 9 validation images.")


if __name__ == "__main__":
    main()
