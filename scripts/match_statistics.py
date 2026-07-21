import os
import re
from pathlib import Path
from collections import Counter, defaultdict
import pyarrow.parquet as pq

root = Path('player_data')
files = [p for p in root.rglob('*') if p.is_file() and p.name.endswith('.nakama-0')]

match_rows = Counter()
match_players = Counter()
match_map = {}
match_uid = defaultdict(set)

for path in files:
    table = pq.read_table(path)
    df = table.to_pandas()
    df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    mid = df['match_id'].iloc[0]
    match_rows[mid] += len(df)
    match_players[mid] += 1
    match_map[mid] = df['map_id'].iloc[0]
    match_uid[mid].add(df['user_id'].iloc[0])

print('matches', len(match_rows))
print('maps', Counter(match_map.values()))
print('players_per_match_stats', {
    'min': min(match_players.values()),
    'max': max(match_players.values()),
    'mean': sum(match_players.values()) / len(match_players),
})
print('rows_per_match_stats', {
    'min': min(match_rows.values()),
    'max': max(match_rows.values()),
    'mean': sum(match_rows.values()) / len(match_rows),
})
print('top_matches', match_rows.most_common(10))
