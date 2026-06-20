import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const helpSections = [
  {
    title: 'Como cadastrar cliente',
    steps: [
      'Clique em Clientes.',
      'Clique em Novo cliente.',
      'Preencha o nome do cliente.',
      'Se quiser, informe telefone, e-mail e observação.',
      'Clique em Salvar.',
    ],
  },
  {
    title: 'Como fazer uma venda',
    steps: [
      'Clique em Vendas.',
      'Escolha o cliente.',
      'Escolha o produto.',
      'Informe a quantidade.',
      'Clique em Adicionar item.',
      'Confira os itens e o valor total.',
      'Clique em Finalizar venda.',
    ],
  },
  {
    title: 'Como consultar estoque',
    steps: [
      'Clique em Estoque atual.',
      'Veja a quantidade disponível de cada produto.',
      'Produtos marcados como Estoque baixo precisam de reposição.',
    ],
  },
  {
    title: 'Como cadastrar produto',
    note: 'Essa função aparece apenas para administrador.',
    steps: [
      'Clique em Produtos.',
      'Clique em Novo produto.',
      'Preencha nome, preço e estoque mínimo.',
      'Clique em Salvar.',
    ],
  },
  {
    title: 'Como lançar entrada de estoque',
    note: 'Essa função aparece apenas para administrador.',
    steps: [
      'Clique em Entrada de estoque.',
      'Escolha o produto.',
      'Informe a quantidade que entrou.',
      'Clique em Salvar.',
    ],
  },
  {
    title: 'Como cadastrar usuários',
    note: 'Essa função aparece apenas para administrador.',
    steps: [
      'Clique em Usuários.',
      'Clique em Novo usuário.',
      'Informe nome, e-mail, senha e perfil.',
      'Clique em Salvar.',
    ],
  },
  {
    title: 'O que significa estoque baixo',
    steps: [
      'Um produto fica com estoque baixo quando a quantidade atual é menor ou igual ao estoque mínimo cadastrado.',
      'Isso ajuda a saber quais produtos precisam ser repostos.',
    ],
  },
]

const shortcutLinks = [
  { label: 'Ir para Clientes', path: '/clientes', roles: ['admin', 'seller'] },
  { label: 'Ir para Vendas', path: '/vendas', roles: ['admin', 'seller'] },
  { label: 'Ir para Estoque atual', path: '/estoque', roles: ['admin', 'seller'] },
  { label: 'Ir para Produtos', path: '/produtos', roles: ['admin'] },
  {
    label: 'Ir para Entrada de estoque',
    path: '/entrada-estoque',
    roles: ['admin'],
  },
  { label: 'Ir para Usuários', path: '/usuarios', roles: ['admin'] },
]

function HelpCard({ section, index }) {
  return (
    <article className="help-card">
      <div className="help-card__icon" aria-hidden="true">
        {index + 1}
      </div>
      <div className="help-card__content">
        <h2>{section.title}</h2>
        <ol>
          {section.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {section.note && <p className="help-card__note">{section.note}</p>}
      </div>
    </article>
  )
}

function Ajuda() {
  const { profile } = useAuth()
  const visibleShortcuts = shortcutLinks.filter((shortcut) =>
    shortcut.roles.includes(profile?.role),
  )

  return (
    <section className="page help-page">
      <div className="page-header">
        <div>
          <h1>Ajuda</h1>
          <p>Veja como usar as principais funções do sistema.</p>
        </div>
      </div>

      <section className="help-shortcuts" aria-label="Atalhos rápidos">
        {visibleShortcuts.map((shortcut) => (
          <Link key={shortcut.path} className="quick-link" to={shortcut.path}>
            <strong>{shortcut.label}</strong>
            <span>Abrir tela</span>
          </Link>
        ))}
      </section>

      <div className="help-grid">
        {helpSections.map((section, index) => (
          <HelpCard key={section.title} section={section} index={index} />
        ))}
      </div>
    </section>
  )
}

export default Ajuda
