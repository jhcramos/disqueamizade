#!/usr/bin/env python3
"""Append 3 new blog articles to index.json."""
import json

with open('public/blog-posts/index.json', 'r') as f:
    data = json.load(f)

new_articles = [
    {
        "slug": "chat-online-morar-sozinho-companhia-conversa-ninguem-em-casa",
        "title": "Chat Online Para Quem Mora Sozinho: A Companhia Que Falta Quando N\u00e3o Tem Ningu\u00e9m em Casa",
        "excerpt": "Morar sozinho tem vantagens, mas a solid\u00e3o silenciosa ningu\u00e9m conta. Descubra como o chat online preenche o vazio das noites em casa e por que milhares de brasileiros usam o bate-papo como companhia di\u00e1ria.",
        "category": "bem-estar",
        "tags": ["chat online morar sozinho", "solid\u00e3o morar s\u00f3", "companhia online", "bate papo online", "conversar sozinho em casa"],
        "author": "Disque Amizade",
        "date": "2026-07-22",
        "readTime": 9,
        "image": "/blog-images/chat-online-morar-sozinho-companhia-conversa-ninguem-em-casa.png",
        "coverImage": "/blog-images/chat-online-morar-sozinho-companhia-conversa-ninguem-em-casa.png",
        "wordCount": 1250,
        "lastModified": "2026-07-22",
        "relatedSlugs": [
            "chat-online-antes-dormir-relaxar-conversar-noite",
            "saude-mental-chat-online-combater-solidao",
            "bate-papo-online-saude-mental-conversa-combate-solidao-digital",
            "chat-online-reinvencao-pessoal-comecar-de-novo-conversa"
        ]
    },
    {
        "slug": "fazer-amigos-online-universidade-faculdade-chat-estudantes",
        "title": "Fazer Amigos Online na Universidade: Como o Chat Ajuda Estudantes a Sobreviver e Prosperar na Vida Acad\u00eamica",
        "excerpt": "A faculdade deveria ser o lugar mais f\u00e1cil para fazer amigos \u2014 mas n\u00e3o \u00e9. Descubra como estudantes brasileiros est\u00e3o usando o chat online para superar o isolamento universit\u00e1rio e construir amizades que duram al\u00e9m do diploma.",
        "category": "dicas",
        "tags": ["fazer amigos online universidade", "chat estudantes faculdade", "amizade universitaria", "bate papo online", "solid\u00e3o na faculdade"],
        "author": "Disque Amizade",
        "date": "2026-07-22",
        "readTime": 9,
        "image": "/blog-images/fazer-amigos-online-universidade-faculdade-chat-estudantes.png",
        "coverImage": "/blog-images/fazer-amigos-online-universidade-faculdade-chat-estudantes.png",
        "wordCount": 1280,
        "lastModified": "2026-07-22",
        "relatedSlugs": [
            "fazer-amigos-online-2026-guia-pratico",
            "bate-papo-online-volta-as-aulas-escola-faculdade-amigos",
            "chat-online-introvertidos-socializar-sem-pressao",
            "como-fazer-amigos-online-2026-guia-pratico"
        ]
    },
    {
        "slug": "bate-papo-online-pet-lovers-amigos-animais-estimacao-chat",
        "title": "Bate Papo Online Para Pet Lovers: Como Amantes de Animais Est\u00e3o se Conectando e Fazendo Amizades no Chat",
        "excerpt": "Cachorro, gato, papagaio ou hamster \u2014 quem ama animais tem muito a conversar. Descubra como a comunidade pet lover brasileira est\u00e1 usando o chat online para trocar dicas, contar hist\u00f3rias e fazer amizades que latem, ronronam e voam.",
        "category": "lifestyle",
        "tags": ["bate papo online pet lovers", "amigos animais estimacao", "chat online brasil", "fazer amigos online", "comunidade pet brasil"],
        "author": "Disque Amizade",
        "date": "2026-07-22",
        "readTime": 8,
        "image": "/blog-images/bate-papo-online-pet-lovers-amigos-animais-estimacao-chat.png",
        "coverImage": "/blog-images/bate-papo-online-pet-lovers-amigos-animais-estimacao-chat.png",
        "wordCount": 1200,
        "lastModified": "2026-07-22",
        "relatedSlugs": [
            "salas-tematicas-encontre-pessoas-interesses",
            "fazer-amigos-online-2026-guia-pratico",
            "bate-papo-online-sabado-noite-alternativa-balada",
            "como-fazer-amigos-online-2026-guia-pratico"
        ]
    }
]

data.extend(new_articles)

with open('public/blog-posts/index.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Index updated. Total articles: {len(data)}")