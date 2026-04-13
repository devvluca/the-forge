# ⚒️ The Forge

**Dashboard pessoal de alta performance** — um app desktop construído com Tauri v2, React e Supabase para monitorar disciplinas diárias, finanças e produtividade.

> *"Forje-se no fogo da disciplina."*

---

## 🧭 Módulos

| Rota | Módulo | Descrição |
|---|---|---|
| `/a-bigorna` | **A Bigorna** | Tracker de hábitos/disciplinas com grid de conclusão, streaks, gráficos de performance semanal, tendência mensal e histórico recente. |
| `/o-cofre` | **O Cofre** | Gestão financeira com saldo, receitas, despesas, gráfico de despesas por categoria, projeção de juros compostos, extrato com filtro e registro de novas transações. Protegido por PIN. |
| `/logos` | **Logos** | Motor de IA (Groq) — assistente inteligente contextual integrado ao dashboard. |
| `/arsenal` | **Arsenal** | Ferramentas e recursos rápidos. |
| `/configuracoes` | **Configurações** | Personalização da cor accent do tema e preferências do app. |

## 🧩 Componentes

- **Sidebar** — Navegação lateral com ícones e labels
- **TitleBar** — Barra de título customizada (Tauri)
- **FloatingDock** — Dock flutuante com atalhos rápidos e acesso ao Jarvis
- **JarvisSidebar** — Assistente IA lateral (Groq SDK) com contexto da página atual
- **PinPad** — Teclado numérico para desbloquear O Cofre
- **WidgetTimer** — Timer Pomodoro flutuante

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Desktop Runtime | [Tauri v2](https://v2.tauri.app) |
| Frontend | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilo | TailwindCSS 3 |
| Animações | Framer Motion |
| Ícones | Phosphor Icons |
| Gráficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth) |
| IA | Groq SDK (LLM) |

## 🎨 Design

- Estética **dark mode industrial** com glassmorphism
- Cor accent customizável (salva em localStorage)
- Neon glow effects e micro-animações
- Tipografia monospace + sans-serif

---

**Built by [@devvluca](https://github.com/devvluca)** ⚒️
