import json

index_path = '/Users/janainamdeoliveira/clawd/disqueamizade/public/blog-posts/index.json'

with open(index_path, 'r') as f:
    data = json.load(f)

print(f"Current articles: {len(data)}")
print(f"Last slug: {data[-1]['slug']}")

# Check for duplicates
new_slugs = [
    'chat-online-home-office-solidao-trabalho-remoto-brasil',
    'bate-papo-online-saude-mental-ciencia-conversar-desconhecidos',
    'chat-online-brasileiros-exterior-saudade-brasil-mais-perto'
]
existing_slugs = [a['slug'] for a in data]
for s in new_slugs:
    if s in existing_slugs:
        print(f"DUPLICATE: {s}")
    else:
        print(f"NEW: {s}")

# Add 3 new articles
new_articles = [
    {
        "slug": "chat-online-home-office-solidao-trabalho-remoto-brasil",
        "title": "Chat Online Para Quem Trabalha de Casa: Como o Bate-Papo Quebra a Solidão do Home Office",
        "excerpt": "Trabalho remoto isolou milhões de brasileiros. Descubra como o bate-papo online está substituindo a conversa de corredor e ajudando quem trabalha de casa a não enlouquecer.",
        "category": "lifestyle",
        "tags": [
            "bate papo online",
            "chat home office",
            "solidão trabalho remoto",
            "conversar online trabalhar casa",
            "chat online brasil"
        ],
        "author": "Disque Amizade",
        "date": "2026-07-26",
        "readTime": 9,
        "image": "/blog-images/chat-online-home-office-solidao-trabalho-remoto-brasil.png",
        "coverImage": "/blog-images/chat-online-home-office-solidao-trabalho-remoto-brasil.png",
        "wordCount": 1350,
        "lastModified": "2026-07-26",
        "relatedSlugs": [
            "bate-papo-online-home-office-solidao-trabalho-remoto",
            "chat-online-depois-do-trabalho-descompressao-rotina-brasileiros",
            "chat-online-brasil-gratis-guia-completo",
            "chat-de-voz-online-sem-camera"
        ]
    },
    {
        "slug": "bate-papo-online-saude-mental-ciencia-conversar-desconhecidos",
        "title": "Bate-Papo Online e Saúde Mental: O Que a Ciência Diz Sobre Conversar com Desconhecidos",
        "excerpt": "A ciência confirma: conversar com desconhecidos no bate-papo online melhora humor, reduz solidão e fortalece saúde mental. Descubra o que os estudos revelam e como usar o chat a seu favor.",
        "category": "ciencia",
        "tags": [
            "fazer amigos online",
            "saúde mental chat",
            "conversar desconhecidos",
            "bate papo online",
            "solidão digital",
            "chat bem-estar"
        ],
        "author": "Disque Amizade",
        "date": "2026-07-26",
        "readTime": 10,
        "image": "/blog-images/bate-papo-online-saude-mental-ciencia-conversar-desconhecidos.png",
        "coverImage": "/blog-images/bate-papo-online-saude-mental-ciencia-conversar-desconhecidos.png",
        "wordCount": 1400,
        "lastModified": "2026-07-26",
        "relatedSlugs": [
            "chat-online-neurociencia-ciencia-conversar-desconhecidos",
            "chat-online-memoria-exercita-cerebro-melhora-cognicao",
            "saude-mental-chat-online-combater-solidao",
            "como-superar-timidez-em-chats-online-passo-a-passo"
        ]
    },
    {
        "slug": "chat-online-brasileiros-exterior-saudade-brasil-mais-perto",
        "title": "Chat Online Para Brasileiros no Exterior: Como Manter a Saudade do Brasil Mais Perto",
        "excerpt": "Morando fora do Brasil? Descubra como o chat online por cidade ajuda expatriados a matar saudade, praticar português e encontrar outros brasileiros pelo mundo.",
        "category": "lifestyle",
        "tags": [
            "chat online brasil",
            "brasileiros no exterior",
            "chat expatriado",
            "saudade brasil",
            "fazer amigos online",
            "brasileiros fora"
        ],
        "author": "Disque Amizade",
        "date": "2026-07-26",
        "readTime": 9,
        "image": "/blog-images/chat-online-brasileiros-exterior-saudade-brasil-mais-perto.png",
        "coverImage": "/blog-images/chat-online-brasileiros-exterior-saudade-brasil-mais-perto.png",
        "wordCount": 1450,
        "lastModified": "2026-07-26",
        "relatedSlugs": [
            "salas-de-chat-por-cidade-brasil",
            "chat-online-brasil-gratis-guia-completo",
            "fazer-amigos-online-quem-mudou-cidade-recomecar-vida-social",
            "como-fazer-amigos-online-2026-guia-pratico"
        ]
    }
]

data.extend(new_articles)

with open(index_path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nUpdated articles: {len(data)}")
print("Done! 3 new articles added to index.json")