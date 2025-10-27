# 🎌 Top Anime Ranks - README em Português

## 📌 Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o projeto
npm run dev

# 3. Abrir http://localhost:5173
```

**Pronto!** O site vai carregar (demora 10-30s na primeira vez).

---

## 🎯 O Que É Este Projeto?

Site de **rankings de anime** que mostra:

- 📺 **Episódios da Semana** - Melhores episódios que acabaram de sair
- ⭐ **Animes Mais Aguardados** - O que está por vir nas próximas temporadas
- 🏆 **Rankings por Temporada** - Melhores animes de Fall 2025, Winter 2026, etc.

Dados vindos do **MyAnimeList** via API Jikan.

---

## ⚡ Status Atual

| Item | Status |
|------|--------|
| Setup Supabase | ✅ Completo |
| Site Funcionando | ✅ Sim |
| Carregamento | 🐌 Lento (10-30s) |
| Cache Supabase | ⏳ Vazio (pode popular) |

---

## 🚀 Como Funciona

### **Agora (Padrão):**

```
Você acessa → Jikan API (lento) → Dados exibidos ✅
             (10-30 segundos)
```

### **Com Cache (Opcional):**

```
Você acessa → Supabase (rápido) → Dados exibidos ⚡
             (< 1 segundo)
```

---

## 📖 Documentação

### **Para Começar:**
- 🎬 [`COMECE_AQUI_AGORA.md`](/🎬_COMECE_AQUI_AGORA.md) - Guia visual de 1 minuto
- 📖 [`LEIA-ME.md`](/LEIA-ME.md) - README completo em PT
- 🚨 [`IMPORTANTE.md`](/🚨_IMPORTANTE.md) - Resumo da situação

### **Para Entender:**
- 🎯 [`STATUS_ATUAL.md`](/🎯_STATUS_ATUAL.md) - O que está acontecendo
- 📋 [`SUMÁRIO_COMPLETO.md`](/📋_SUMÁRIO_COMPLETO.md) - Solução técnica implementada

### **Para Otimizar:**
- 📊 [`COMO_POPULAR_O_BANCO.md`](/📊_COMO_POPULAR_O_BANCO.md) - Habilitar cache rápido

---

## 🎨 Funcionalidades

✅ **Rankings Semanais**
- Episódios que acabaram de sair
- Ordenados por score do MAL
- Filtro de 20.000+ membros (qualidade)
- Sistema de episódios manuais

✅ **Animes Mais Aguardados**
- Por temporada (Fall 2025, Winter 2026, etc.)
- Ordenados por quantidade de membros
- Filtro de popularidade

✅ **Design Responsivo**
- Mobile, tablet, desktop
- Tema claro/escuro
- Animações suaves
- Cards com hover effects

✅ **Sistema de Cache**
- Supabase (backend)
- localStorage (frontend)
- Fallback automático para Jikan API

---

## 🛠️ Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **UI:** shadcn/ui components
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **API:** Jikan v4 (MyAnimeList oficial)
- **Deploy:** Vercel ready

---

## 📊 Estrutura

```
/
├── pages/              # Páginas do site
│   ├── HomePage.tsx
│   ├── TopEpisodesPage.tsx
│   └── MostAnticipatedPage.tsx
├── components/         # Componentes React
│   ├── AnimeCard.tsx
│   ├── Header.tsx
│   └── ui/            # shadcn/ui
├── services/          # Serviços de dados
│   ├── jikan.ts       # API Jikan
│   ├── supabase.ts    # Cache Supabase
│   └── cache.ts       # localStorage
├── supabase/          # Backend
│   ├── functions/     # Edge Functions
│   └── migrations/    # SQL migrations
└── 📚 Documentação
```

---

## 🔧 Comandos

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

---

## ❓ FAQ

### **P: Por que está lento?**
**R:** Está usando Jikan API (sem cache). Para deixar rápido, leia [`COMO_POPULAR_O_BANCO.md`](/📊_COMO_POPULAR_O_BANCO.md).

### **P: É necessário popular o cache?**
**R:** Não! O site funciona sem cache, só é mais lento.

### **P: Como habilitar o modo rápido?**
**R:** Leia [`COMO_POPULAR_O_BANCO.md`](/📊_COMO_POPULAR_O_BANCO.md).

### **P: Precisa pagar pelo Supabase?**
**R:** Não! O plano gratuito é suficiente.

### **P: Posso fazer deploy?**
**R:** Sim! Funciona no Vercel, Netlify, etc.

---

## 🎯 Roadmap Opcional

- [ ] Popular cache do Supabase
- [ ] Configurar cron job de sync
- [ ] Deploy em produção
- [ ] Personalizar design
- [ ] Adicionar mais temporadas

---

## 📜 Licença

Livre para usar como quiser! 🎉

---

## 🆘 Suporte

Dúvidas? Consulte a documentação:

1. [`COMECE_AQUI_AGORA.md`](/🎬_COMECE_AQUI_AGORA.md)
2. [`LEIA-ME.md`](/LEIA-ME.md)
3. [`STATUS_ATUAL.md`](/🎯_STATUS_ATUAL.md)

---

## ✨ Créditos

- **Dados:** [MyAnimeList](https://myanimelist.net) via [Jikan API](https://jikan.moe)
- **Backend:** [Supabase](https://supabase.com)
- **UI:** [shadcn/ui](https://ui.shadcn.com)
- **Icons:** [Lucide](https://lucide.dev)

---

**Desenvolvido com ❤️ para fãs de anime!**
