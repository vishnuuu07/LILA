import os
import re
import math
from pathlib import Path
from collections import Counter
import matplotlib.pyplot as plt
import pyarrow.parquet as pq

root = Path('player_data')
files = [p for p in root.rglob('*') if p.is_file() and p.name.endswith('.nakama-0')]

maps = {
    'AmbroseValley': {'scale': 900, 'origin_x': -370, 'origin_z': -473, 'size': 1024},
    'GrandRift': {'scale': 581, 'origin_x': -290, 'origin_z': -290, 'size': 1024},
    'Lockdown': {'scale': 1000, 'origin_x': -500, 'origin_z': -500, 'size': 1024},
}


def to_pixel(x, z, map_id):
    cfg = maps[map_id]
    u = (x - cfg['origin_x']) / cfg['scale']
    v = (z - cfg['origin_z']) / cfg['scale']
    px = u * cfg['size']
    py = (1 - v) * cfg['size']
    return px, py

selected = []
for path in files:
    table = pq.read_table(path)
    df = table.to_pandas()
    df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    if len(df) >= 10:
        selected.append((path, df))
    if len(selected) >= 10:
        break

fig, axes = plt.subplots(2, 5, figsize=(18, 8))
for ax, (path, df) in zip(axes.flat, selected):
    map_id = df['map_id'].iloc[0]
    pts = []
    for _, row in df.iterrows():
        if row['event'] == 'Position' or row['event'] == 'BotPosition':
            px, py = to_pixel(float(row['x']), float(row['z']), map_id)
            pts.append((px, py))
    if not pts:
        ax.text(0.5, 0.5, 'no points', ha='center', va='center')
        ax.set_title(path.name)
        ax.set_axis_off()
        continue
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    ax.scatter(xs, ys, s=5, alpha=0.6)
    ax.plot(xs, ys, linewidth=0.6, alpha=0.5)
    ax.set_title(path.name)
    ax.set_xlim(0, 1024)
    ax.set_ylim(1024, 0)
    ax.set_axis_off()

plt.tight_layout()
out_path = Path('docs/coordinate_validation_plots.png')
out_path.parent.mkdir(parents=True, exist_ok=True)
plt.savefig(out_path, dpi=150)
print(f'saved={out_path}')
