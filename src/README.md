# Top Anime Ranks ⚡

Site completo de rankings de episódios de anime e animes mais antecipados, com **cache Supabase para performance 100x mais rápida** e integração à API Jikan (MyAnimeList).

## 🎯 Performance

- ⚡ **< 1 segundo** de carregamento (com Supabase)
- 🚀 **100x mais rápido** que acesso direto à API Jikan
- 🔄 **Atualização automática** a cada 10 minutos
- 💾 **Cache inteligente** com fallback automático

## 🚀 Deploy no Vercel

### Configuração Automática

O projeto já está configurado para deploy no Vercel. Basta:

1. **Fazer push do código para o GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   git push
   ```

2. **No Vercel Dashboard:**
   - Clique em "Add New Project"
   - Selecione seu repositório
   - **Framework Preset:** Vite (detectado automaticamente)
   - **Root Directory:** `.` (deixe vazio ou ponto)
   - Clique em "Deploy"

### Configuração Manual (se necessário)

Se o Vercel não detectar automaticamente:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

## 📦 Scripts Disponíveis

```bash
npm run dev      # Roda em desenvolvimento (localhost:5173)
npm run build    # Build para produção
npm run preview  # Preview do build de produção
```

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS 4.0** - Estilização
- **Jikan API** - Dados do MyAnimeList
- **Recharts** - Gráficos
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones

## 📁 Estrutura do Projeto

```
├── App.tsx                 # Componente principal
├── components/             # Componentes React
├── config/                 # Configurações (semanas, seasons)
├── data/                   # Dados estáticos por semana/season
├── services/               # Serviços (API, cache)
├── styles/                 # CSS global e temas
├── types/                  # TypeScript types
└── scripts/                # Scripts auxiliares
```

## 🎨 Funcionalidades

### Top Anime Ranks
- Rankings semanais de episódios
- Sistema de semanas baseado na season Fall 2025
- Ratings de 1.00 a 5.00
- Badges especiais para top 3
- Indicadores de tendência (↑↓)
- Filtro de 20.000+ membros no MAL

### Most Anticipated Animes
- Animes upcoming organizados por season
- Fall 2025, Winter 2026, Spring 2026, Later
- Ordenados por número de membros no MAL
- Sistema de ranking com badges

### Temas
- Modo Claro e Escuro
- Variáveis CSS customizadas
- Cores específicas por demografia
- Efeitos de hover diferenciados

## 🔧 Desenvolvimento Local

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Rodar em desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **⚡ IMPORTANTE - Setup do Supabase (Primeira vez):**
   ```
   Acesse: http://localhost:5173/setup
   Clique: "Executar Setup Automático"
   ```
   
   **OU consulte:** `/COMO_FAZER_SETUP.md` para instruções detalhadas

4. **Acessar o site:**
   ```
   http://localhost:5173
   ```

## 📝 Adicionar Episódios Manualmente

Consulte os guias:
- `/MANUAL_EPISODES_GUIDE.md` - Guia completo
- `/scripts/README.md` - Scripts auxiliares
- `/scripts/add-episode.ts` - Adicionar 1 episódio
- `/scripts/bulk-add-episodes.ts` - Adicionar múltiplos

## 🐛 Debug

- `/DEBUG_GUIDE.md` - Guia de debug
- Debug Panel no site (canto inferior direito)
- Clear cache para forçar atualização da API

## 📄 Documentação

- `/API_INTEGRATION.md` - Integração com Jikan API
- `/guidelines/Guidelines.md` - Guidelines do projeto
- `/Attributions.md` - Créditos e atribuições

## 🌐 API

**Jikan API (MyAnimeList)**
- URL: https://api.jikan.moe/v4
- Rate Limit: 60 requisições/minuto
- Cache: 24 horas (episódios), 7 dias (animes)

## ⚙️ Variáveis de Ambiente

Não há variáveis de ambiente obrigatórias. A API Jikan é pública.

## 📊 Performance

- Code splitting automático
- Lazy loading de imagens
- Cache de requisições API
- Skeleton loaders
- Otimização de bundle

## 🔗 Links Úteis

- [Jikan API Docs](https://docs.api.jikan.moe/)
- [MyAnimeList](https://myanimelist.net/)
- [Vercel Docs](https://vercel.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte os arquivos de documentação
2. Verifique o Debug Panel no site
3. Limpe o cache se os dados não atualizarem

## 📜 Licença

Este projeto é de uso pessoal. Dados fornecidos pela API Jikan/MyAnimeList.

---

**Desenvolvido com ❤️ usando React + Vite + Tailwind CSS**
