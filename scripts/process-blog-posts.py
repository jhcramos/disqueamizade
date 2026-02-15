#!/usr/bin/env python3
"""Process blog posts: add internal links, relatedSlugs, wordCount, lastModified."""
import json, re, html, sys
from collections import defaultdict

with open('public/blog-posts/index.json', 'r') as f:
    posts = json.load(f)

# Build lookup
slug_map = {p['slug']: p for p in posts}
category_posts = defaultdict(list)
tag_posts = defaultdict(list)
for p in posts:
    category_posts[p['category']].append(p['slug'])
    for t in p['tags']:
        tag_posts[t.lower()].append(p['slug'])

def strip_html(h):
    return re.sub(r'<[^>]+>', '', h)

def compute_word_count(content):
    text = strip_html(content)
    return len(text.split())

def find_related_slugs(post, all_posts, n=5):
    """Find related posts by category + tag overlap."""
    scores = {}
    for other in all_posts:
        if other['slug'] == post['slug']:
            continue
        score = 0
        if other['category'] == post['category']:
            score += 3
        # Tag overlap
        common_tags = set(t.lower() for t in post['tags']) & set(t.lower() for t in other['tags'])
        score += len(common_tags) * 2
        # City posts: boost same region references
        if post['category'] == 'cidades' and other['category'] == 'cidades':
            score += 2
        if score > 0:
            scores[other['slug']] = score
    sorted_slugs = sorted(scores, key=lambda s: scores[s], reverse=True)
    return sorted_slugs[:n]

def add_internal_links(post, all_posts):
    """Add 2-5 internal links to post content by finding keyword matches."""
    content = post['content']
    other_posts = [p for p in all_posts if p['slug'] != post['slug']]
    
    # Build keyword -> slug mapping from titles and key tags
    keywords = []
    for op in other_posts:
        # Extract meaningful phrases from title (skip very short ones)
        title = op['title']
        # Use the main topic from the title
        # Try to find 2-4 word phrases
        title_clean = re.sub(r'[:\?\!\—\-–]', ' ', title).strip()
        words = title_clean.split()
        if len(words) >= 2:
            # Take key phrases (first meaningful chunk)
            phrases = []
            # Full title minus common suffixes
            for pattern in [
                r'^(Chat Online .+?)(?:\s*[-:–—]|$)',
                r'^(Bate[- ]Papo .+?)(?:\s*[-:–—]|$)',
                r'^(Vídeo Chat .+?)(?:\s*[-:–—]|$)',
                r'^(Salas? de Chat .+?)(?:\s*[-:–—]|$)',
            ]:
                m = re.match(pattern, title, re.I)
                if m:
                    phrases.append(m.group(1).strip())
            
            # Also try first 3-4 meaningful words
            meaningful = [w for w in words if len(w) > 2]
            if len(meaningful) >= 3:
                phrase = ' '.join(meaningful[:4])
                if len(phrase) > 10:
                    phrases.append(phrase)
            
            # Use important tags
            for tag in op['tags'][:2]:
                if len(tag) > 5:
                    keywords.append((tag, op['slug'], tag))
            
            for phrase in phrases[:2]:
                keywords.append((phrase, op['slug'], phrase))
    
    # Sort by length desc (match longer phrases first)
    keywords.sort(key=lambda x: len(x[0]), reverse=True)
    
    linked_slugs = set()
    link_count = 0
    max_links = 5
    
    for phrase, slug, anchor_text in keywords:
        if link_count >= max_links:
            break
        if slug in linked_slugs:
            continue
        
        # Find the phrase in content (not inside existing tags)
        # Simple approach: find in plain text portions
        pattern = re.compile(
            r'(?<!["\'>=/])(' + re.escape(phrase) + r')(?![^<]*>)(?!</a>)',
            re.IGNORECASE
        )
        
        # Only replace first occurrence
        match = pattern.search(content)
        if match:
            # Make sure we're not inside an existing <a> tag
            before = content[:match.start()]
            if '<a ' in before:
                # Check if the last <a is closed
                last_a = before.rfind('<a ')
                last_close = before.rfind('</a>')
                if last_a > last_close:
                    continue  # Inside an <a> tag
            
            replacement = f'<a href="/blog/{slug}">{match.group(1)}</a>'
            content = content[:match.start()] + replacement + content[match.end():]
            linked_slugs.add(slug)
            link_count += 1
    
    return content

# Process each post
for i, post in enumerate(posts):
    # Add wordCount
    post['wordCount'] = compute_word_count(post['content'])
    
    # Add lastModified
    post['lastModified'] = '2026-02-15'
    
    # Find related slugs
    post['relatedSlugs'] = find_related_slugs(post, posts)
    
    # Add internal links
    post['content'] = add_internal_links(post, posts)
    
    if (i + 1) % 20 == 0:
        print(f'Processed {i+1}/{len(posts)}...', file=sys.stderr)

print(f'Done! Processed {len(posts)} posts.', file=sys.stderr)

# Verify link counts
link_counts = []
for p in posts:
    count = len(re.findall(r'<a href="/blog/', p['content']))
    link_counts.append(count)
avg = sum(link_counts) / len(link_counts)
print(f'Average internal links per post: {avg:.1f}', file=sys.stderr)
print(f'Posts with 0 links: {link_counts.count(0)}', file=sys.stderr)
print(f'Posts with relatedSlugs: {sum(1 for p in posts if p.get("relatedSlugs"))}', file=sys.stderr)

with open('public/blog-posts/index.json', 'w') as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)
