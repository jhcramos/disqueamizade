import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'

type LegalPageType = 'terms' | 'privacy' | 'lgpd' | 'guidelines'

interface LegalPageProps {
  type: LegalPageType
}

const content: Record<LegalPageType, { title: string; updated: string; sections: Array<[string, string[]]> }> = {
  terms: {
    title: 'Termos de Uso',
    updated: '20 de julho de 2026',
    sections: [
      ['Uso da plataforma', [
        'O Disque Amizade é uma plataforma de comunidade, conversa, salas temáticas, chamadas, marketplace de creators, assinaturas e fichas virtuais.',
        'Ao criar uma conta, acessar salas, comprar fichas, assinar um plano ou usar recursos pagos, você concorda com estes Termos, com a Política de Privacidade, com a LGPD e com as Diretrizes da Comunidade.',
      ]],
      ['Idade mínima e conteúdo adulto', [
        'Você deve ter 18 anos ou mais para criar conta, usar a plataforma, acessar recursos de vídeo, comprar fichas ou acessar qualquer área adulta.',
        'Conteúdo adulto, quando disponível, é restrito a usuários maiores de 18 anos, sujeito a moderação, regras da comunidade e remoção imediata em caso de violação.',
      ]],
      ['Fichas, assinaturas e pagamentos', [
        'Fichas são créditos virtuais usados dentro da plataforma. Elas não são moeda, investimento, produto financeiro ou saldo bancário.',
        'Pagamentos podem ser processados por terceiros, incluindo Stripe. O processamento de pagamento está sujeito às regras e políticas desses provedores.',
        'Assinaturas podem ser canceladas conforme as regras apresentadas no checkout ou na área da conta. Benefícios pagos permanecem sujeitos a disponibilidade técnica e cumprimento das regras da comunidade.',
      ]],
      ['Creators e interações entre usuários', [
        'Usuários e creators são responsáveis pelo conteúdo que publicam, exibem, vendem, prometem ou compartilham.',
        'O Disque Amizade pode moderar, limitar, suspender ou remover contas, salas, perfis, conteúdos ou transações que violem estes Termos, a lei aplicável ou a segurança da comunidade.',
      ]],
      ['Limites de responsabilidade', [
        'A plataforma é fornecida como está, sujeita a manutenção, falhas técnicas, indisponibilidade de terceiros e mudanças de produto.',
        'Não garantimos resultados, relacionamentos, audiência, ganhos para creators, disponibilidade contínua, compatibilidade com todos os dispositivos ou ausência total de erros.',
      ]],
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    updated: '20 de julho de 2026',
    sections: [
      ['Dados que coletamos', [
        'Podemos coletar nome de usuário, email, senha criptografada, idade ou confirmação de maioridade, cidade, perfil, fotos, preferências, salas acessadas, mensagens, denúncias, dados de creators, compras, assinaturas, fichas e informações técnicas de uso.',
        'Recursos de vídeo, áudio, chat, filtros, marketplace e moderação podem gerar metadados técnicos e registros operacionais necessários para segurança, suporte, prevenção de abuso e funcionamento da plataforma.',
      ]],
      ['Como usamos os dados', [
        'Usamos dados para criar e proteger contas, operar salas e chamadas, processar pagamentos, entregar fichas e assinaturas, prevenir fraude e abuso, moderar conteúdo, responder suporte e melhorar a plataforma.',
        'Comunicações de produto, segurança, suporte e marketing podem ser enviadas conforme suas preferências e a lei aplicável.',
      ]],
      ['Compartilhamento com terceiros', [
        'Podemos compartilhar dados necessários com provedores de infraestrutura, autenticação, banco de dados, pagamentos, analytics, email, suporte, moderação e segurança.',
        'Não vendemos seus dados pessoais. Podemos divulgar informações quando exigido por lei, ordem judicial, proteção de direitos, prevenção de fraude ou segurança de usuários.',
      ]],
      ['Segurança e retenção', [
        'Aplicamos medidas razoáveis de segurança, controle de acesso e retenção proporcional ao funcionamento da plataforma, obrigações legais, prevenção de abuso e suporte.',
        'Nenhum sistema online é 100% seguro. Por isso, também dependemos de senhas fortes, uso responsável e denúncia rápida de abuso.',
      ]],
    ],
  },
  lgpd: {
    title: 'LGPD',
    updated: '20 de julho de 2026',
    sections: [
      ['Seus direitos', [
        'Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, bloqueio, eliminação, informação sobre compartilhamento, revisão de decisões automatizadas quando aplicável e revogação de consentimento.',
        'Algumas solicitações podem depender de verificação de identidade e podem ser limitadas por obrigações legais, prevenção de fraude, segurança, moderação e defesa de direitos.',
      ]],
      ['Bases legais', [
        'Tratamos dados com base em execução de contrato, consentimento, cumprimento de obrigação legal, legítimo interesse, prevenção de fraude, segurança da comunidade e exercício regular de direitos.',
      ]],
      ['Dados sensíveis e conteúdo adulto', [
        'A plataforma pode envolver interações sociais, vídeo, áudio, preferências e conteúdos que exigem cuidado adicional. Usuários não devem compartilhar documentos, dados íntimos ou informações sensíveis desnecessárias.',
        'Conteúdos ilegais, abuso, exploração, assédio, coerção, menores de idade ou violação de consentimento são proibidos e podem ser reportados às autoridades competentes.',
      ]],
    ],
  },
  guidelines: {
    title: 'Diretrizes da Comunidade',
    updated: '20 de julho de 2026',
    sections: [
      ['Respeito e consentimento', [
        'Não toleramos assédio, ameaças, coerção, exposição sem consentimento, discurso de ódio, exploração, spam, fraude, impersonação ou tentativa de burlar moderação.',
        'Vídeo, áudio, mensagens, presentes, fichas e interações com creators devem respeitar consentimento, limites pessoais e regras da plataforma.',
      ]],
      ['Conteúdo proibido', [
        'É proibido qualquer conteúdo envolvendo menores, violência sexual, exploração, abuso, chantagem, dados pessoais de terceiros, material ilegal, golpes, automutilação incentivada ou atividades criminosas.',
        'Conteúdo adulto, quando permitido, deve ficar restrito às áreas indicadas, apenas entre adultos e dentro das regras da plataforma.',
      ]],
      ['Moderação e denúncias', [
        'Podemos remover conteúdo, restringir recursos, suspender contas, bloquear pagamentos, cancelar benefícios ou encerrar contas para proteger usuários e a plataforma.',
        'Denúncias de abuso, fraude, ameaça ou violação de consentimento serão priorizadas e podem levar à preservação de registros operacionais para investigação.',
      ]],
    ],
  },
}

export const LegalPage = ({ type }: LegalPageProps) => {
  const page = content[type]

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-sm text-primary-400 font-semibold mb-3">Legal</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-3">{page.title}</h1>
        <p className="text-dark-500 mb-10">Última atualização: {page.updated}</p>

        <div className="space-y-8">
          {page.sections.map(([title, paragraphs]) => (
            <section key={title} className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
              <div className="space-y-3 text-dark-300 leading-relaxed">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 card p-5 border-primary-500/20">
          <p className="text-sm text-dark-300 leading-relaxed">
            Dúvidas legais, privacidade, segurança ou denúncias: entre em contato pelo canal de suporte da plataforma.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
