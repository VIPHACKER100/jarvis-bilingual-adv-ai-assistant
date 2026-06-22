import json
from pathlib import Path
r = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding='utf-8'))
new_files = r.get('new_files', {})
changed = r.get('changed', [])
all_changed = [f for files in new_files.values() for f in files]
print('New files by type:')
for k, v in new_files.items():
    print(f'  {k}: {len(v)} files')
    for f in v[:5]:
        print(f'    {f}')
print(f'Changed entries: {changed}')
code_exts = {'.py','.ts','.js','.go','.rs','.java','.cpp','.c','.rb','.swift','.kt','.cs','.scala','.php','.cc','.cxx','.hpp','.h','.kts','.lua','.toc','.f','.F','.f90','.F90','.f95','.F95','.f03','.F03','.f08','.F08'}
code_only = all(Path(f).suffix.lower() in code_exts for f in all_changed)
print(f'code_only: {code_only}')
nt = r.get('new_total')
print(f'new_total: {nt}')
deleted = r.get('deleted_files', [])
print(f'deleted: {deleted}')
