#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando deploy do Loja-Conect...${NC}"

# Verificar se todas as variáveis de ambiente estão configuradas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Erro: Variáveis de ambiente não configuradas${NC}"
    echo "Por favor, configure:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro na instalação das dependências${NC}"
    exit 1
fi

# Validar build antes dos testes (pré-checagem rápida)
echo -e "${YELLOW}🔨 Validando build inicial...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build inicial${NC}"
    exit 1
fi

# Executar testes
echo -e "${YELLOW}🧪 Executando testes...${NC}"
npm run test -- --watchAll=false --passWithNoTests

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Testes falharam${NC}"
    exit 1
fi

# Build produção otimizado
echo -e "${YELLOW}🔨 Construindo versão de produção...${NC}"
npm run build:prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build de produção${NC}"
    exit 1
fi

# Check build size
echo -e "${YELLOW}📊 Analisando tamanho do bundle...${NC}"
npx bundle-analyzer build/static/js/*.js 2>/dev/null || echo "Bundle analyzer não disponível"

# Deploy (prioridade Vercel, fallback genérico)
if command -v vercel &> /dev/null; then
    echo -e "${YELLOW}🌐 Fazendo deploy na Vercel...${NC}"
    npm run deploy:now
else
    echo -e "${YELLOW}📦 Build completo!${NC}"
    echo -e "${GREEN}✅ Pronto para deploy!${NC}"
    echo ""
    echo "Para fazer deploy:"
    echo "1. Configure suas credenciais de deploy"
    echo "2. Execute: npm run deploy"
    echo ""
    echo "Ou faça upload da pasta 'build' para seu servidor"
fi

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo "📊 Acesse: https://seu-app.vercel.app"
