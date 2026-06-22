import networkx as nx
import json
from pathlib import Path
from graphify.build import build
from graphify.cluster import cluster, remap_communities_to_previous, score_all
from graphify.report import generate
from graphify.export import to_json

ext = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))

extraction_data = [{'nodes': ext['nodes'], 'edges': ext['edges'], 'hyperedges': ext.get('hyperedges', [])}]
G = build(extraction_data)
print(f'Built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

# Cluster: returns {community_id: [node_ids]}
communities = cluster(G)
print(f'Communities: {len(communities)}')

# Attach community IDs as node attributes
node_to_cid = {}
for cid, nodes in communities.items():
    for n in nodes:
        node_to_cid[n] = cid
nx.set_node_attributes(G, node_to_cid, 'community')

# Try remap to previous labels
prev_labels = {}
prev_path = Path('graphify-out/.graphify_labels.json')
if prev_path.exists():
    try:
        prev_labels = json.loads(prev_path.read_text(encoding='utf-8'))
        # Build previous node->community mapping from previous labels
        # prev_labels is {node_id: label_string} but we need numeric community ID
        # Can skip remap if no numeric mapping
        print(f'Previous labels: {len(prev_labels)} nodes')
    except Exception as e:
        print(f'Could not load previous labels: {e}')

# Compute cohesion scores
scores = score_all(G, communities)
avg_cohesion = sum(scores.values()) / len(scores) if scores else 0
print(f'Avg cohesion: {avg_cohesion:.4f}')

# Generate labels from subgraph analysis
# Simple label: use the most common file_type or source_file prefix per community
from collections import Counter
for cid, nodes in communities.items():
    if not nodes:
        continue
    sub = G.subgraph(nodes)
    types = [d.get('file_type', '') for _, d in sub.nodes(data=True) if d.get('file_type')]
    if types:
        most_common_type = Counter(types).most_common(1)[0][0]
        type_label = most_common_type.capitalize()
    else:
        type_label = 'Module'
    label = f'{type_label} {cid}'
    for n in nodes:
        # Update node attribute
        G.nodes[n]['community_label'] = label

# Save labels
labels = {}
for n, d in G.nodes(data=True):
    c = d.get('community_label') or str(d.get('community', ''))
    labels[n] = c
Path('graphify-out/.graphify_labels.json').write_text(json.dumps(labels, ensure_ascii=False), encoding='utf-8')
print(f'Labels written for {len(labels)} nodes')

# Save graph.json
to_json(G, communities, output_path='graphify-out/graph.json')
print('Saved graph.json')

# Generate report
try:
    report = generate(G)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    print(f'Report generated: {len(report)} chars')
except Exception as e:
    print(f'Report generation failed: {e}')
    import traceback
    traceback.print_exc()

# Show top communities by size
community_sizes = {cid: len(nodes) for cid, nodes in communities.items()}
top = sorted(community_sizes.items(), key=lambda x: -x[1])[:10]
print(f'\nTop {len(top)} communities:')
for cid, size in top:
    sample = communities[cid][:3]
    sample_labels = [G.nodes[n].get('community_label', n) for n in sample]
    print(f'  Community {cid}: {size} nodes (e.g. {sample_labels})')
