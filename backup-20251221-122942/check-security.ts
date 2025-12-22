#!/usr/bin/env node

/**
 * VERIFICADOR DE SEGURANÇA - LOJA CONECT
 *
 * Este script verifica se as variáveis de ambiente estão configuradas
 * corretamente e identifica vazamentos de segurança.
 *
 * Uso: npx tsx check-security.ts
 *      ou
 *      node --loader tsx check-security.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

// Configurações
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Tipos
interface EnvFileInfo {
  exists: boolean;
  content: string;
  lines: string[];
}

interface SecurityResults {
  critical: string[];
  warnings: string[];
  passed: string[];
  files: Record<string, EnvFileInfo>;
}

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
} as const;

// Variáveis que NUNCA devem ter VITE_ (frontend)
const CRITICAL_VARIABLES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_PASSWORD',
  'SMTP_USER',
  'ENCRYPTION_KEY',
  'HASH_SALT',
  'JWT_SECRET',
  'WHATSAPP_API_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ONESIGNAL_API_KEY',
  'DATABASE_PASSWORD',
  'SUPABASE_DB_PASSWORD'
] as const;

// Variáveis que DEVEM ter VITE_ (frontend)
const FRONTEND_VARIABLES = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_FUNCTIONS_URL',
  'VITE_APP_URL',
  'VITE_APP_NAME'
] as const;

class SecurityChecker {
  private results: SecurityResults;
  private envFiles: string[];

  constructor() {
    this.results = {
      critical: [],
      warnings: [],
      passed: [],
      files: {}
    };

    this.envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test'
    ];
  }

  async run(): Promise<void> {
    console.log(colors.cyan + '='.repeat(60) + colors.reset);
    console.log(colors.cyan + '🔒 VERIFICADOR DE SEGURANÇA - LOJA CONECT' + colors.reset);
    console.log(colors.cyan + '='.repeat(60) + colors.reset);
    console.log();

    // Verifica se .gitignore está configurado
    await this.checkGitignore();

    // Verifica arquivos .env
    await this.checkEnvFiles();

    // Verifica conteúdo dos arquivos
    await this.checkEnvContents();

    // Verifica package.json
    await this.checkPackageJson();

    // Verifica arquivos TypeScript/TSX
    await this.checkTypescriptFiles();

    // Mostra resultados
    this.showResults();

    // Sugestões de correção
    this.showRecommendations();

    // Ação urgente se necessário
    await this.checkUrgentAction();
  }

  private async checkGitignore(): Promise<void> {
    const gitignorePath = path.join(__dirname, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
      this.results.critical.push('.gitignore não encontrado! Arquivos sensíveis podem ser commitados.');
      return;
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const requiredPatterns = [
      '.env.local',
      '.env.production',
      '*.env.local',
      'node_modules',
      'dist',
      'build'
    ];

    const missingPatterns = requiredPatterns.filter(pattern => {
      if (pattern.includes('*')) {
        const basePattern = pattern.replace('*.', '');
        return !gitignoreContent.includes(basePattern);
      }
      return !gitignoreContent.includes(pattern);
    });

    if (missingPatterns.length > 0) {
      this.results.warnings.push(`.gitignore falta padrões: ${missingPatterns.join(', ')}`);
    } else {
      this.results.passed.push('.gitignore configurado corretamente');
    }
  }

  private async checkEnvFiles(): Promise<void> {
    console.log(colors.blue + '📁 Verificando arquivos .env...' + colors.reset);

    for (const envFile of this.envFiles) {
      const filePath = path.join(__dirname, envFile);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        this.results.files[envFile] = {
          exists: true,
          content: content,
          lines: content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
        };

        console.log(`  ${colors.green}✓${colors.reset} ${envFile} encontrado`);
      } else {
        this.results.files[envFile] = { exists: false, content: '', lines: [] };

        if (envFile === '.env.local') {
          this.results.warnings.push(`${envFile} não encontrado - necessário para variáveis privadas`);
        } else if (envFile === '.env') {
          this.results.critical.push(`${envFile} não encontrado - necessário para variáveis públicas`);
        }
      }
    }
    console.log();
  }

  private async checkEnvContents(): Promise<void> {
    console.log(colors.blue + '🔍 Analisando conteúdo dos arquivos...' + colors.reset);

    for (const [fileName, fileInfo] of Object.entries(this.results.files)) {
      if (!fileInfo.exists) continue;

      console.log(`\n  ${colors.magenta}Arquivo: ${fileName}${colors.reset}`);

      // Verifica variáveis críticas expostas no frontend
      if (fileName === '.env') {
        this.checkFrontendEnv(fileName, fileInfo);
      }

      // Verifica variáveis privadas
      if (fileName === '.env.local') {
        this.checkBackendEnv(fileName, fileInfo);
      }

      // Verifica duplicações
      this.checkDuplicates(fileName, fileInfo);
    }
  }

  private checkFrontendEnv(fileName: string, fileInfo: EnvFileInfo): void {
    let criticalExposed = false;

    for (const line of fileInfo.lines) {
      // Verifica se variáveis críticas estão no frontend (com VITE_)
      for (const criticalVar of CRITICAL_VARIABLES) {
        if (line.includes(`VITE_${criticalVar}`)) {
          this.results.critical.push(
            `🚨 CRÍTICO: ${criticalVar} está exposto no frontend (${fileName})`
          );
          criticalExposed = true;
          console.log(`    ${colors.red}✗${colors.reset} VITE_${criticalVar} - ${colors.red}EXPOSTO${colors.reset}`);
        }
      }

      // Verifica se variáveis frontend estão sem VITE_
      for (const frontendVar of FRONTEND_VARIABLES) {
        const varName = frontendVar.replace('VITE_', '');
        if (line.startsWith(varName + '=') && !line.startsWith('VITE_' + varName + '=')) {
          this.results.warnings.push(
            `${varName} está sem prefixo VITE_ em ${fileName}`
          );
        }
      }
    }

    if (!criticalExposed) {
      console.log(`    ${colors.green}✓${colors.reset} Nenhuma variável crítica exposta`);
    }
  }

  private checkBackendEnv(fileName: string, fileInfo: EnvFileInfo): void {
    const missingCritical: string[] = [];

    for (const criticalVar of CRITICAL_VARIABLES) {
      const hasVar = fileInfo.lines.some(line =>
        line.startsWith(`${criticalVar}=`) ||
        line.startsWith(`# ${criticalVar}=`)
      );

      if (!hasVar && criticalVar === 'SUPABASE_SERVICE_ROLE_KEY') {
        this.results.critical.push(
          `SUPABASE_SERVICE_ROLE_KEY não encontrada em ${fileName}`
        );
        missingCritical.push(criticalVar);
      } else if (!hasVar) {
        this.results.warnings.push(
          `${criticalVar} não encontrada em ${fileName}`
        );
      } else {
        console.log(`    ${colors.green}✓${colors.reset} ${criticalVar}`);
      }
    }

    if (missingCritical.length === 0) {
      console.log(`    ${colors.green}✓${colors.reset} Variáveis críticas configuradas`);
    }
  }

  private checkDuplicates(fileName: string, fileInfo: EnvFileInfo): void {
    const variables: Record<string, boolean> = {};

    for (const line of fileInfo.lines) {
      const match = line.match(/^([A-Z_]+)=/);
      if (match) {
        const varName = match[1];
        if (variables[varName]) {
          this.results.warnings.push(
            `Variável duplicada: ${varName} em ${fileName}`
          );
        }
        variables[varName] = true;
      }
    }
  }

  private async checkPackageJson(): Promise<void> {
    const packagePath = path.join(__dirname, 'package.json');

    if (!fs.existsSync(packagePath)) {
      this.results.warnings.push('package.json não encontrado');
      return;
    }

    try {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };

      // Verifica dependências de segurança
      const securityPackages = ['dotenv', 'bcryptjs', 'jsonwebtoken', '@supabase/supabase-js'];
      const dependencies = {
        ...packageContent.dependencies,
        ...packageContent.devDependencies
      };

      for (const pkg of securityPackages) {
        if (!dependencies[pkg]) {
          this.results.warnings.push(`Pacote de segurança não instalado: ${pkg}`);
        }
      }

      // Verifica scripts de segurança
      const scripts = packageContent.scripts || {};
      if (!scripts['security:check']) {
        this.results.warnings.push('Script security:check não encontrado no package.json');
      }

      this.results.passed.push('package.json verificado');
    } catch (error: any) {
      this.results.warnings.push(`Erro ao ler package.json: ${error.message}`);
    }
  }

  private async checkTypescriptFiles(): Promise<void> {
    console.log(colors.blue + '\n📄 Verificando arquivos TypeScript/TSX...' + colors.reset);

    try {
      const tsFiles = this.findFilesByExtension(['.ts', '.tsx', '.js', '.jsx']);

      let foundEnvIssues = false;

      for (const tsFile of tsFiles.slice(0, 10)) { // Limita a 10 arquivos para performance
        const content = fs.readFileSync(tsFile, 'utf8');

        // Verifica imports de @supabase/supabase-js
        if (content.includes('@supabase/supabase-js')) {
          console.log(`  ${colors.green}✓${colors.reset} Supabase importado em: ${path.basename(tsFile)}`);
        }

        // Verifica se está usando SERVICE_ROLE_KEY no frontend
        if (content.includes('SERVICE_ROLE_KEY') && !tsFile.includes('/api/') && !tsFile.includes('/server/')) {
          this.results.warnings.push(`Possível uso de SERVICE_ROLE_KEY em arquivo frontend: ${path.basename(tsFile)}`);
          foundEnvIssues = true;
        }

        // Verifica se está acessando process.env diretamente (comum em Node.js)
        if (content.includes('process.env.') && !tsFile.includes('/api/') && !tsFile.includes('/server/')) {
          // Verifica se está acessando variáveis privadas
          for (const criticalVar of CRITICAL_VARIABLES) {
            if (content.includes(`process.env.${criticalVar}`)) {
              this.results.critical.push(
                `🚨 Variável privada ${criticalVar} acessada no frontend: ${path.basename(tsFile)}`
              );
              foundEnvIssues = true;
            }
          }
        }

        // Verifica se está usando import.meta.env corretamente
        if (content.includes('import.meta.env')) {
          console.log(`  ${colors.green}✓${colors.reset} import.meta.env detectado em: ${path.basename(tsFile)}`);
        }
      }

      if (!foundEnvIssues) {
        console.log(`  ${colors.green}✓${colors.reset} Nenhum problema encontrado nos arquivos TypeScript`);
      }

    } catch (error: any) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Erro ao verificar arquivos TypeScript: ${error.message}`);
    }
  }

  private findFilesByExtension(extensions: string[]): string[] {
    const files: string[] = [];

    function walkDir(dir: string): void {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Ignora node_modules e outras pastas desnecessárias
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item.name)) {
            walkDir(fullPath);
          }
        } else if (extensions.some(ext => item.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    walkDir(__dirname);
    return files;
  }

  private showResults(): void {
    console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
    console.log(colors.cyan + '📊 RESULTADOS DA VERIFICAÇÃO' + colors.reset);
    console.log(colors.cyan + '='.repeat(60) + colors.reset);

    // Mostra críticos primeiro
    if (this.results.critical.length > 0) {
      console.log(`\n${colors.bgRed}🚨 PROBLEMAS CRÍTICOS (${this.results.critical.length})${colors.reset}`);
      this.results.critical.forEach((issue, index) => {
        console.log(`${colors.red}  ${index + 1}. ${issue}${colors.reset}`);
      });
    }

    // Mostra avisos
    if (this.results.warnings.length > 0) {
      console.log(`\n${colors.bgYellow}⚠️  AVISOS (${this.results.warnings.length})${colors.reset}`);
      this.results.warnings.forEach((warning, index) => {
        console.log(`${colors.yellow}  ${index + 1}. ${warning}${colors.reset}`);
      });
    }

    // Mostra sucessos
    if (this.results.passed.length > 0) {
      console.log(`\n${colors.bgGreen}✅ VERIFICAÇÕES APROVADAS (${this.results.passed.length})${colors.reset}`);
      this.results.passed.forEach((success, index) => {
        console.log(`${colors.green}  ${index + 1}. ${success}${colors.reset}`);
      });
    }

    // Estatísticas
    console.log('\n' + colors.cyan + '📈 ESTATÍSTICAS:' + colors.reset);
    console.log(`  Críticos: ${this.results.critical.length}`);
    console.log(`  Avisos: ${this.results.warnings.length}`);
    console.log(`  Aprovados: ${this.results.passed.length}`);

    const total = this.results.critical.length + this.results.warnings.length + this.results.passed.length;
    const score = Math.round((this.results.passed.length / total) * 100) || 0;

    console.log(`  Pontuação de segurança: ${score}/100`);

    if (score >= 80) {
      console.log(`  ${colors.green}✅ Status: Seguro${colors.reset}`);
    } else if (score >= 50) {
      console.log(`  ${colors.yellow}⚠️  Status: Precisa de atenção${colors.reset}`);
    } else {
      console.log(`  ${colors.red}🚨 Status: Inseguro${colors.reset}`);
    }
  }

  private showRecommendations(): void {
    console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
    console.log(colors.cyan + '💡 RECOMENDAÇÕES' + colors.reset);
    console.log(colors.cyan + '='.repeat(60) + colors.reset);

    const hasCriticalExposure = this.results.critical.some(issue =>
      issue.includes('SUPABASE_SERVICE_ROLE_KEY') && issue.includes('exposto')
    );

    if (hasCriticalExposure) {
      console.log(`\n${colors.red}⚠️  AÇÃO IMEDIATA NECESSÁRIA:${colors.reset}`);
      console.log('1. Acesse: https://supabase.com/dashboard/project/fhugpbgprcavflcudnsg/settings/api');
      console.log('2. Clique em "ROLL" na SERVICE_ROLE_KEY');
      console.log('3. Gere uma NOVA chave');
      console.log('4. Atualize o arquivo .env.local');
      console.log('5. Remova VITE_SUPABASE_SERVICE_ROLE_KEY do .env');
    }

    if (!this.results.files['.env.local']?.exists) {
      console.log(`\n${colors.yellow}📝 Crie o arquivo .env.local:${colors.reset}`);
      console.log('touch .env.local');
      console.log('echo "SUPABASE_SERVICE_ROLE_KEY=sua_nova_chave" >> .env.local');
    }

    // Recomendações para TypeScript
    console.log(`\n${colors.yellow}📁 Recomendações para TypeScript:${colors.reset}`);
    console.log('1. Crie tipos para variáveis de ambiente:');
    console.log('   // env.d.ts');
    console.log('   interface ImportMetaEnv {');
    console.log('     readonly VITE_SUPABASE_URL: string');
    console.log('     readonly VITE_SUPABASE_ANON_KEY: string');
    console.log('     // ... outras variáveis VITE_');
    console.log('   }');

    console.log('\n2. Use clientes separados para frontend/backend:');
    console.log('   // frontend-client.ts');
    console.log('   import { createClient } from \'@supabase/supabase-js\'');
    console.log('   export const supabase = createClient(');
    console.log('     import.meta.env.VITE_SUPABASE_URL,');
    console.log('     import.meta.env.VITE_SUPABASE_ANON_KEY');
    console.log('   )');

    console.log('\n   // backend-client.ts (apenas para APIs)');
    console.log('   import { createClient } from \'@supabase/supabase-js\'');
    console.log('   export const supabaseAdmin = createClient(');
    console.log('     process.env.SUPABASE_URL!,');
    console.log('     process.env.SUPABASE_SERVICE_ROLE_KEY!');
    console.log('   )');
  }

  private async checkUrgentAction(): Promise<void> {
    const hasCritical = this.results.critical.length > 0;

    if (hasCritical) {
      console.log(`\n${colors.bgRed}🚨🚨🚨 AÇÃO URGENTE REQUERIDA 🚨🚨🚨${colors.reset}`);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (query: string): Promise<string> =>
        new Promise((resolve) => rl.question(query, resolve));

      const response = await question(
        `\n${colors.yellow}Deseja gerar um relatório detalhado para correção? (s/n): ${colors.reset}`
      );

      if (response.toLowerCase() === 's') {
        await this.generateReport();
      }

      rl.close();

      console.log(`\n${colors.red}Execute as correções antes de commitar o código!${colors.reset}`);
    }
  }

  private async generateReport(): Promise<void> {
    const reportPath = path.join(__dirname, 'security-report.txt');
    const reportContent = [
      'RELATÓRIO DE SEGURANÇA - LOJA CONECT',
      '='.repeat(50),
      `Data: ${new Date().toISOString()}`,
      '',
      'PROBLEMAS CRÍTICOS:',
      ...this.results.critical.map((issue, i) => `${i + 1}. ${issue}`),
      '',
      'AVISOS:',
      ...this.results.warnings.map((warning, i) => `${i + 1}. ${warning}`),
      '',
      'AÇÕES RECOMENDADAS:',
      '1. ROLL da SERVICE_ROLE_KEY:',
      '   - Acesse: https://supabase.com/dashboard/project/fhugpbgprcavflcudnsg/settings/api',
      '   - Clique em "ROLL" na SERVICE_ROLE_KEY',
      '   - Copie a nova chave',
      '',
      '2. Corrija os arquivos .env:',
      '   - Variáveis PRIVADAS (backend) → .env.local',
      '   - Variáveis PÚBLICAS (frontend) → .env',
      '',
      '3. Para TypeScript:',
      '   - Crie arquivo env.d.ts com tipos',
      '   - Separe clientes frontend/backend',
      '   - Use import.meta.env no frontend',
      '   - Use process.env no backend',
      ''
    ].join('\n');

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n${colors.green}✅ Relatório gerado: ${reportPath}${colors.reset}`);
  }
}

// Executa o verificador
const checker = new SecurityChecker();

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error(colors.red + '\n❌ Erro durante a verificação:' + colors.reset);
  console.error(error.message);
  process.exit(1);
});

// Executa
checker.run().catch(console.error);
