import json
from pathlib import Path
from graphify.build import build_merge
from graphify.detect import save_manifest

# Save old graph for diff
old_graph = Path('graphify-out/graph.json')
if old_graph.exists():
    import shutil
    shutil.copy2('graphify-out/graph.json', 'graphify-out/.graphify_old.json')

# Create minimal extraction for the new file
new_extraction = {
    'nodes': [
        {
            'id': 'refproject_github_workflows_codeql_codeql_advanced',
            'label': 'CodeQL Advanced Workflow',
            'file_type': 'document',
            'source_file': 'ref-project-ui/jarvis-bilingual-ai-assistant/.github/workflows/codeql.yml',
            'source_location': None,
            'source_url': None,
            'captured_at': None,
            'author': None,
            'contributor': None,
        },
        {
            'id': 'refproject_github_workflows_codeql_codeql_analysis',
            'label': 'CodeQL Analysis Job',
            'file_type': 'concept',
            'source_file': 'ref-project-ui/jarvis-bilingual-ai-assistant/.github/workflows/codeql.yml',
            'source_location': None,
            'source_url': None,
            'captured_at': None,
            'author': None,
            'contributor': None,
        },
        {
            'id': 'refproject_github_workflows_codeql_javascript_typescript',
            'label': 'JavaScript/TypeScript Analysis',
            'file_type': 'concept',
            'source_file': 'ref-project-ui/jarvis-bilingual-ai-assistant/.github/workflows/codeql.yml',
            'source_location': None,
            'source_url': None,
            'captured_at': None,
            'author': None,
            'contributor': None,
        },
    ],
    'edges': [
        {
            'source': 'refproject_github_workflows_codeql_codeql_advanced',
            'target': 'refproject_github_workflows_codeql_codeql_analysis',
            'relation': 'references',
            'confidence': 'EXTRACTED',
            'confidence_score': 1.0,
            'source_file': 'ref-project-ui/jarvis-bilingual-ai-assistant/.github/workflows/codeql.yml',
        },
        {
            'source': 'refproject_github_workflows_codeql_codeql_analysis',
            'target': 'refproject_github_workflows_codeql_javascript_typescript',
            'relation': 'references',
            'confidence': 'EXTRACTED',
            'confidence_score': 1.0,
            'source_file': 'ref-project-ui/jarvis-bilingual-ai-assistant/.github/workflows/codeql.yml',
        },
    ],
    'hyperedges': [],
    'input_tokens': 0,
    'output_tokens': 0,
}

# Load incremental state
incremental = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding='utf-8'))
deleted = list(incremental.get('deleted_files', []))

# Merge with existing graph
G = build_merge(
    [new_extraction],
    graph_path='graphify-out/graph.json',
    prune_sources=deleted or None,
)
print(f'Merged: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

# Write merged result
merged_out = {
    'nodes': [{'id': n, **d} for n, d in G.nodes(data=True)],
    'edges': [
        {**{k: val for k, val in d.items() if k not in ('_src', '_tgt', 'source', 'target')},
         'source': d.get('_src', u), 'target': d.get('_tgt', v)}
        for u, v, d in G.edges(data=True)
    ],
    'hyperedges': list(G.graph.get('hyperedges', [])),
    'input_tokens': 0,
    'output_tokens': 0,
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged_out, ensure_ascii=False), encoding='utf-8')
print(f'Merged extraction written ({len(merged_out["nodes"])} nodes, {len(merged_out["edges"])} edges)')

# Save manifest so next --update diffs against today's state
# Use the full corpus from incremental
save_manifest(incremental.get('files', {}))
print('Manifest saved.')
