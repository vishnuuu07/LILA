import os
import re
from pathlib import Path
import pyarrow.parquet as pq

root = Path('player_data')
files = [p for p in root.rglob('*') if p.is_file() and p.name.endswith('.nakama-0')]
print(f'files={len(files)}')

for path in files[:5]:
    table = pq.read_table(path)
    print(f'FILE={path}')
    print(table.schema)
    print('rows=', table.num_rows)
    print('sample=')
    print(table.slice(0, 3).to_pydict())
    print('---')
