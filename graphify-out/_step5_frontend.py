import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
analysis   = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

# Human-readable labels derived from node content
labels = {
    0: "API Client Service Layer",
    1: "Core App Layout & Components",
    2: "Arc Reactor & Automation UI",
    3: "Header Navigation & Voice Control",
    4: "API Type Definitions",
    5: "API Client Types & Settings",
    6: "Activity Feed & Device Sync",
    7: "Error Boundary",
    8: "Config, Audio WebSocket & Bridge",
    9: "Command Input & Agent Streaming",
    10: "WebSocket Connection Service",
    11: "Memory Viewer & Security Dashboard",
    12: "Audio System Utilities",
    13: "Micro-interactions & HUD Audio",
    14: "Automation Dashboard & Editor",
    15: "Tooltip UI Component",
    16: "Quick Responses",
    17: "Select UI Component",
    18: "Skeleton Loading Component",
    19: "Textarea UI Component",
    20: "Neural Network Visualizer",
    21: "Test Setup",
}

questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, 'src', suggested_questions=questions)
with open('graphify-out/GRAPH_REPORT.md', 'w', encoding='utf-8') as fout:
    fout.write(report)
with open('graphify-out/.graphify_labels.json', 'w', encoding='utf-8') as fout:
    json.dump({str(k): v for k, v in labels.items()}, fout, ensure_ascii=False)
to_json(G, communities, 'graphify-out/graph.json', force=True)
print('Report and graph updated with community labels')
print('Nodes:', G.number_of_nodes(), 'Edges:', G.number_of_edges())
