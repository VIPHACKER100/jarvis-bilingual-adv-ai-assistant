import sys, json
from pathlib import Path

ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
# No semantic for code-only corpus
sem = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}

seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n['id'])

merged_edges = ast['edges'] + sem['edges']
merged_hyperedges = sem.get('hyperedges', [])
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
with open('graphify-out/.graphify_extract.json', 'w', encoding='utf-8') as fout:
    json.dump(merged, fout, indent=2, ensure_ascii=False)
total = len(merged_nodes)
edges = len(merged_edges)
print('Merged: {} nodes, {} edges ({} AST + {} semantic)'.format(total, edges, len(ast['nodes']), len(sem['nodes'])))
