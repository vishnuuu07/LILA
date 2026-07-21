import os
import re
from pathlib import Path
from collections import Counter, defaultdict
import pyarrow.parquet as pq

root = Path('player_data')
files = [p for p in root.rglob('*') if p.is_file() and p.name.endswith('.nakama-0')]

event_counts = Counter()
map_counts = Counter()
match_ids = set()
user_ids = set()
rows_total = 0
rows_by_file = []

for path in files:
    table = pq.read_table(path)
    df = table.to_pandas()
    df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    event_counts.update(df['event'])
    map_counts[df['map_id'].iloc[0]] += 1
    match_ids.add(df['match_id'].iloc[0])
    user_ids.add(df['user_id'].iloc[0])
    rows_total += len(df)
    rows_by_file.append(len(df))

print('files', len(files))
print('rows_total', rows_total)
print('matches', len(match_ids))
print('users', len(user_ids))
print('events', dict(event_counts))
print('maps', dict(map_counts))
print('rows_per_file_stats', {
    'min': min(rows_by_file),
    'max': max(rows_by_file),
    'mean': sum(rows_by_file) / len(rows_by_file),
})
