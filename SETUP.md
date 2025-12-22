# 🚀 Configuração do Loja-Conect

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 1. Configuração do Supabase

### Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote a URL e a chave anônima

### Configurar Banco de Dados
1. Execute o script SQL em `supabase/migrations/001_initial_schema.sql`
2. Configure o Storage para imagens:
   - Crie bucket 'produtos'
   - Configure políticas RLS

## 2. Configuração do Ambiente

```bash
# Clone o repositório
git clone <seu-repositorio>
cd loja-conect

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
