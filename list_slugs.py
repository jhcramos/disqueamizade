import json
with open('public/blog-posts/index.json') as f:
    data = json.load(f)
for i, e in enumerate(data):
    print(f'{i+1}. {e["slug"]}')
print(f'\n--- Total: {len(data)} articles ---')