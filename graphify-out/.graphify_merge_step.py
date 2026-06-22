import json, glob
from pathlib import Path

chunks = sorted(glob.glob('graphify-out/.graphify_chunk_*.json'))
print(f'Found {len(chunks)} chunk file(s)')
for c in chunks:
    d = json.loads(Path(c).read_text(encoding='utf-8-sig'))
    nn = len(d.get('nodes', []))
    ne = len(d.get('edges', []))
    nh = len(d.get('hyperedges', []))
    print(f'  {c}: {nn} nodes, {ne} edges, {nh} hyperedges')
