import json
from datetime import datetime

indexPath = 'public/blog-posts/index.json'

with open(indexPath, 'r') as f:
    posts = json.load(f)

new_posts = [
    {
        "slug": "bate-papo-online-volta-as-aulas-escola-faculdade-amigos",
        "title": "Bate-Papo Online na Volta às Aulas: Como Fazer Amigos na Escola e na Faculdade",
        "excerpt": "A volta às aulas chegou e você não conhece ninguém? Descubra como o bate-papo online ajuda estudantes a fazer amigos antes mesmo do primeiro dia de aula na escola e na faculdade.",
        "category": "estudantes",
        "tags": ["bate papo online", "volta às aulas", "fazer amigos escola", "fazer amigos faculdade", "chat estudantes", "fazer amigos online", "chat por cidade brasil"],
        "author": "Disque Amizade",
        "date": "2026-07-17",
        "readTime": 9,
        "image": "/blog-images/bate-papo-online-volta-as-aulas-escola-faculdade-amigos.png",
        "coverImage": "/blog-images/bate-papo-online-volta-as-aulas-escola-faculdade-amigos.png",
        "wordCount": 1350,
        "lastModified": "2026-07-17",
        "relatedSlugs": [
            "fazer-amigos-online-2026-guia-pratico",
            "salas-de-chat-por-cidade-brasil",
            "como-conversar-melhor-chat-online-tecnicas-habilidade-social",
            "chat-online-morar-republica-estudantes-moradia-compartilhada",
            "bate-papo-online-estudantes-enem-vestibular-concursos-grupo"
        ]
    },
    {
        "slug": "fazer-amigos-online-autoconhecimento-conversar-descobrir-quem-voce-e",
        "title": "Fazer Amigos Online e se Autoconhecer: Como Conversar Com Estranhos Revela Quem Você É",
        "excerpt": "Conversar com desconhecidos online não é só fazer amigos — é descobrir quem você é. Descubra como o chat online revela traços ocultos, expande perspectivas e acelera o autoconhecimento.",
        "category": "desenvolvimento-pessoal",
        "tags": ["fazer amigos online", "autoconhecimento", "conversar com estranhos", "chat online brasil", "desenvolvimento pessoal", "bate papo online"],
        "author": "Disque Amizade",
        "date": "2026-07-17",
        "readTime": 10,
        "image": "/blog-images/fazer-amigos-online-autoconhecimento-conversar-descobrir-quem-voce-e.png",
        "coverImage": "/blog-images/fazer-amigos-online-autoconhecimento-conversar-descobrir-quem-voce-e.png",
        "wordCount": 1450,
        "lastModified": "2026-07-17",
        "relatedSlugs": [
            "como-conversar-melhor-chat-online-tecnicas-habilidade-social",
            "conversar-online-pessoas-diferentes-perspectiva-nova-mundo",
            "chat-online-neurociencia-ciencia-conversar-desconhecidos",
            "amizades-verdadeiras-internet-diferenca-seguidores-amigos",
            "chat-online-resiliencia-autoconfianca-conversar-desconhecidos"
        ]
    },
    {
        "slug": "alternativa-bate-papo-uol-2026-chat-sem-cadastro-sem-app-sem-fila",
        "title": "Alternativa ao Bate-Papo UOL 2026: Chat Sem Cadastro, Sem App e Sem Fila",
        "excerpt": "Cansado de fila, cadastro obrigatório e apps pesados? Descubra a alternativa ao bate-papo UOL que funciona sem cadastro, sem baixar app e sem esperar na fila. Entre e converse agora.",
        "category": "comparativo",
        "tags": ["alternativa bate papo uol", "chat sem cadastro", "chat sem app", "bate papo online", "chat online brasil", "chat sem fila", "conversar agora"],
        "author": "Disque Amizade",
        "date": "2026-07-17",
        "readTime": 8,
        "image": "/blog-images/alternativa-bate-papo-uol-2026-chat-sem-cadastro-sem-app-sem-fila.png",
        "coverImage": "/blog-images/alternativa-bate-papo-uol-2026-chat-sem-cadastro-sem-app-sem-fila.png",
        "wordCount": 1280,
        "lastModified": "2026-07-17",
        "relatedSlugs": [
            "alternativa-bate-papo-uol-por-que-brasileiros-migraram",
            "bate-papo-online-por-que-voltamos-para-o-chat-em-2026",
            "bater-papo-online-celular-sem-baixar-app-guia-completo",
            "chat-online-gratis-sem-baixar-aplicativo-navegador",
            "chat-sem-cadastro-brasil-conversar-agora"
        ]
    }
]

posts.extend(new_posts)

with open(indexPath, 'w') as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"Updated index.json with {len(new_posts)} new posts. Total: {len(posts)}")