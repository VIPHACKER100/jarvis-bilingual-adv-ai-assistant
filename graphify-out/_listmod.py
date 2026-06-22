import graphify
modules = [x for x in dir(graphify) if not x.startswith('_')]
print('Top-level attrs:', modules)
for m in modules:
    obj = getattr(graphify, m)
    if hasattr(obj, '__file__'):
        items = [x for x in dir(obj) if not x.startswith('_')]
        print(f'  {m}: {items}')
