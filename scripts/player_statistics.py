import os
import re
from pathlib import Path
from collections import Counter, defaultdict
import pyarrow.parquet as pq

root = Path('player_data')
files = [p for p in root.rglob('*') if p.is_file() and p.name.endswith('.nakama-0')]

player_rows = Counter()
player_matches = Counter()
player_events = defaultdict(Counter)
player_is_human = {}

for path in files:
    table = pq.read_table(path)
    df = table.to_pandas()
    df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    uid = df['user_id'].iloc[0]
    player_rows[uid] += len(df)
    player_matches[uid] += 1
    player_events[uid].update(df['event'])
    player_is_human[uid] = bool(re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', str(uid)))

print('unique_players', len(player_rows))
print('humans', sum(player_is_human.values()))
print('bots', sum(not v for v in player_is_human.values()))
print('player_rows_stats', {
    'min': min(player_rows.values()),
    'max': max(player_rows.values()),
    'mean': sum(player_rows.values()) / len(player_rows),
})
print('player_matches_stats', {
    'min': min(player_matches.values()),
    'max': max(player_matches.values()),
    'mean': sum(player_matches.values()) / len(player_matches),
})
print('top_players', player_rows.most_common(10))
