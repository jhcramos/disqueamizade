import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Shield, Sparkles, Heart, Video, MessageCircle } from 'lucide-react'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'

export const AboutPage = () => {
  useEffect(() => {
    document.title = 'Sobre o Disque Amizade — A Balada que Nunca Fecha 🎪'

    // Inject AboutPage schema
    const existing = document.getElementById('about-page-schema')
    if (existing) existing.remove()
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Sobre o Disque Amizade',
      url: 'https://disqueamizade.com.br/sobre',
      mainEntity: {
        '@type': 'Organization',
        name: 'Disque Amizade',
        url: 'https://disqueamizade.com.br',
        description: 'Plataforma brasileira de chat com vídeo e máscaras virtuais para conexão social anônima.',
        foundingDate: '2025',
        areaServed: 'BR',
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'Disque Amizade',
        url: 'https://disqueamizade.com.br',
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'about-page-schema'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <section className="text-center mb-16">
            <span className="text-sm font-bold tracking-wider uppercase text-purple-400">
              Sobre o Disque Amizade
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-3 mb-6">
              A balada que nunca fecha 🎪
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              O Disque Amizade é a evolução do chat online brasileiro. Uma plataforma de
              vídeo chat com máscaras virtuais, salas temáticas e roleta 1:1 — onde você
              pode conversar, fazer amigos e se divertir com anonimato e segurança.
            </p>
          </section>

          {/* Story */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Nossa história</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              O Disque Amizade nasceu em 2025 da ideia simples de que conversar online
              deveria ser divertido, seguro e sem pressão. Inspirado nos clássicos chats
              brasileiros que marcaram gerações, recriamos a experiência para a era do
              vídeo — com máscaras virtuais, filtros de câmera e salas temáticas que fazem
              cada conversa única.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              Aqui você não precisa mostrar o rosto se não quiser. As máscaras virtuais
              — óculos, máscaras de carnaval, filtros criativos — deixam você ser quem
              quiser, na hora que quiser. É anonimato com diversão, não anonimato com medo.
            </p>
            <p className="text-white/70 leading-relaxed">
              Hoje, somos uma comunidade de pessoas que querem conversar, conhecer gente
              nova, participar de salas temáticas e, acima de tudo, se sentir acolhidas.
            </p>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Nossos valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <Shield className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-bold text-lg mb-2">Segurança primeiro</h3>
                <p className="text-sm text-white/60">
                  Moderação ativa, verificação de idade e diretrizes claras. Uma
                  comunidade segura depende de regras claras e respeito mútuo.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <Video className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-bold text-lg mb-2">Anonimato com diversão</h3>
                <p className="text-sm text-white/60">
                  Máscaras virtuais e filtros de câmera deixam você ser quem quiser.
                  Sem pressão, sem julgamento, só conversa boa.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-bold text-lg mb-2">Comunidade real</h3>
                <p className="text-sm text-white/60">
                  Salas temáticas com até 30 pessoas, roleta 1:1 para conversas
                  privadas, e espaços para cada interesse. A balada é o que você faz.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <Heart className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-bold text-lg mb-2">Acolhimento</h3>
                <p className="text-sm text-white/60">
                  Todos são bem-vindos. Independente de cidade, hobby ou background,
                  o Disque Amizade é um espaço para sentir menos solidão e mais conexão.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-4">O que você encontra aqui</h2>
            <ul className="space-y-3 text-white/70">
              <li className="flex items-center gap-3">
                <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Chat com vídeo e máscaras virtuais (óculos, máscaras de carnaval, filtros)
              </li>
              <li className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Salas temáticas com até 30 pessoas — música, hobbies, cidades, muito mais
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Roleta 1:1 para conversas privadas e surpresas
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Marketplace de creators e fichas virtuais
              </li>
              <li className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Moderação, verificação de idade e diretrizes da comunidade
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center p-8 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/10 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              Bora entrar na balada? 🎉
            </h2>
            <p className="text-white/70 mb-6 max-w-xl mx-auto">
              Crie sua conta gratuita e comece a conversar agora. Salas temáticas,
              roleta 1:1 e uma comunidade inteira esperando você.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold hover:opacity-90 transition-opacity"
              >
                Criar conta grátis
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 font-semibold hover:bg-white/5 transition-colors"
              >
                Explorar salas
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}