#!/usr/bin/env python3
"""Regenerate sitemap.xml from index.json blog posts."""
import json
from datetime import datetime

BASE_URL = "https://disqueamizade.com.br"
today = datetime.now().strftime("%Y-%m-%d")

# Static pages
static_pages = [
    ("", 1.0, "weekly"),
    ("/blog", 0.8, "weekly"),
    ("/contato", 0.7, "weekly"),
    ("/filtros", 0.7, "weekly"),
    ("/pricing", 0.7, "weekly"),
]

with open("public/blog-posts/index.json", "r") as f:
    posts = json.load(f)

urls = []
# Static pages
for path, priority, freq in static_pages:
    urls.append(f"""  <url>
    <loc>{BASE_URL}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>""")

# Blog posts
for post in posts:
    slug = post["slug"]
    lastmod = post.get("lastModified", today)
    urls.append(f"""  <url>
    <loc>{BASE_URL}/blog/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sitemap += "\n".join(urls)
sitemap += "\n</urlset>"

with open("public/sitemap.xml", "w") as f:
    f.write(sitemap)

print(f"Sitemap generated with {len(urls)} URLs ({len(static_pages)} static + {len(posts)} blog posts)")