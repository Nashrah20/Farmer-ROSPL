#!/usr/bin/env python
"""List all Flask routes"""
from app import app

print("\n" + "="*70)
print("REGISTERED FLASK ROUTES")
print("="*70)

routes = []
for rule in app.url_map.iter_rules():
    routes.append({
        'endpoint': rule.endpoint,
        'methods': ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'})),
        'path': str(rule)
    })

# Sort by path
routes.sort(key=lambda x: x['path'])

for route in routes:
    print(f"{route['methods']:8} {route['path']}")

print("="*70)
print(f"Total routes: {len(routes)}")
print("="*70 + "\n")

# Check for external routes specifically
external_routes = [r for r in routes if 'external' in r['path']]
if external_routes:
    print("\n🌐 EXTERNAL API ROUTES:")
    for route in external_routes:
        print(f"  ✓ {route['methods']:8} {route['path']}")
else:
    print("\n⚠️  NO EXTERNAL API ROUTES FOUND!")
