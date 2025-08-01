# 🤖 Prompt Completo para Geração de Arquivos `agents.md` Otimizados

## 📋 Objetivo

Este prompt orienta a criação de arquivos `agents.md` **OTIMIZADOS** para projetos específicos. O processo de criação é robusto e completo, mas o arquivo resultante é conciso e eficiente em tokens para leitura frequente por agentes de IA.

---

## 🎯 Instruções para o Agente

Você deve criar um arquivo `agents.md` **OTIMIZADO** e específico para o projeto fornecido. Use a estrutura e padrões abaixo, adaptando o conteúdo para as características únicas do projeto, mas mantendo a concisão para eficiência de tokens.

### 🚨 INSTRUÇÃO CRÍTICA - ESCLARECIMENTOS OBRIGATÓRIOS

**DURANTE O PROCESSO DE CRIAÇÃO DO AGENTS.MD:**

- **SE SURGIREM DÚVIDAS** sobre qualquer aspecto do projeto
- **SE INFORMAÇÕES ESTIVEREM INCOMPLETAS** ou ambíguas  
- **SE PRECISAR DE ESCLARECIMENTOS** sobre tecnologias, padrões ou fluxos
- **SE HOUVER MÚLTIPLAS OPÇÕES** e não souber qual escolher

**VOCÊ DEVE OBRIGATORIAMENTE:**
1. **PAUSAR** o processo de criação
2. **FAZER PERGUNTAS ESPECÍFICAS** ao usuário
3. **SOLICITAR ESCLARECIMENTOS** detalhados
4. **AGUARDAR RESPOSTAS** antes de continuar
5. **CONFIRMAR ENTENDIMENTO** antes de prosseguir

**NUNCA:**
- ❌ Assuma informações não fornecidas
- ❌ Invente padrões ou convenções
- ❌ Use exemplos genéricos quando específicos são necessários
- ❌ Continue sem esclarecimentos quando há dúvidas

**SEMPRE:**
- ✅ Peça detalhes específicos sobre o projeto
- ✅ Confirme tecnologias e versões exatas
- ✅ Solicite exemplos de código existente quando necessário
- ✅ Esclareça fluxos de trabalho específicos da equipe
- ✅ Valide comandos e scripts antes de incluir

### 📋 Exemplos de Perguntas Obrigatórias

**Quando informações estão incompletas, SEMPRE pergunte:**

#### Sobre Tecnologias:
- "Qual versão exata do [framework] está sendo usada?"
- "Vocês usam TypeScript ou JavaScript puro?"
- "Qual é o package manager preferido: npm, yarn ou pnpm?"
- "Há alguma biblioteca específica que deve ser sempre usada para [funcionalidade]?"

#### Sobre Scripts e Comandos:
- "Qual comando exato vocês usam para executar testes?"
- "Como é feito o build para produção neste projeto?"
- "Existe algum script de validação personalizado?"
- "Qual é o comando para fazer deploy?"

#### Sobre Padrões de Código:
- "Vocês seguem alguma convenção específica de nomenclatura?"
- "Há algum padrão arquitetural específico sendo usado?"
- "Existe algum anti-padrão que deve ser evitado neste projeto?"
- "Podem me mostrar um exemplo de código bem escrito neste projeto?"

#### Sobre Estrutura:
- "Qual é a organização exata das pastas?"
- "Quais arquivos são críticos e não devem ser modificados?"
- "Onde ficam os testes neste projeto?"
- "Há alguma pasta ou arquivo que tem regras especiais?"

#### Sobre Fluxo de Trabalho:
- "Qual é o processo de commit usado pela equipe?"
- "Vocês usam algum padrão específico para mensagens de commit?"
- "Como é feito o processo de release?"
- "Há alguma validação que deve ser executada antes de cada commit?"

#### Sobre Problemas Conhecidos:
- "Existem problemas comuns que desenvolvedores enfrentam neste projeto?"
- "Há alguma limitação técnica que devo conhecer?"
- "Quais são os erros mais frequentes e como resolvê-los?"
- "Existe alguma configuração específica que causa problemas?"

**LEMBRE-SE: É melhor fazer muitas perguntas e criar um agents.md perfeito do que assumir informações e criar um arquivo genérico ou incorreto.**

### 📝 Informações Necessárias

Antes de gerar o arquivo, colete as seguintes informações sobre o projeto:

1. **Tipo de Projeto**: Web app, extensão de navegador, API, mobile app, desktop app, biblioteca, etc.
2. **Stack Tecnológico**: Linguagens, frameworks, bibliotecas principais
3. **Arquitetura**: Estrutura de pastas, componentes principais, padrões arquiteturais
4. **Scripts de Build**: Comandos npm/yarn, processos de build e deploy
5. **Ferramentas de Qualidade**: Linters, formatters, testes, validações
6. **Fluxo de Desenvolvimento**: Git workflow, versionamento, releases
7. **Dependências Críticas**: APIs externas, serviços, integrações
8. **Considerações Especiais**: Segurança, performance, compatibilidade
9. **Problemas Comuns**: Issues conhecidos, armadilhas, soluções
10. **Comandos Específicos**: Scripts únicos do projeto, automações

---

## 🏗️ Estrutura OTIMIZADA do `agents.md`

### 1. Cabeçalho Conciso

```markdown
# [Nome do Projeto] - Guia IA

## 🎯 IDENTIDADE
**Especialista [tecnologia principal]** com domínio em:
- **[Tech1]**: [desc concisa]
- **[Tech2]**: [desc concisa]
- **[Domínio]**: [conhecimento específico]

## 📋 PRIORIDADES ABSOLUTAS
1. **SEMPRE ler agents.md antes de iniciar - OBRIGATÓRIO**
2. **[Prioridade específica 1]**
3. **[Prioridade específica 2]**
4. **[Prioridade específica 3]**
5. **[Prioridade específica 4]**
```

### 2. Estrutura Condensada

```markdown
## 📁 ESTRUTURA

### Arquitetura
```
[Projeto]/
├── [config-principal]     # [desc]
├── [arquivo-main]         # [desc]
├── [pasta-core]/          # [desc]
├── [pasta-ui]/            # [desc]
├── [pasta-tests]/         # [desc]
└── [pasta-docs]/          # [desc]
```

### Críticos ⚠️
- `[arquivo1]` - [cuidado específico]
- `[arquivo2]` - [cuidado específico]

### Convenções
- **Arquivos**: [padrão] (ex: [exemplo])
- **Funções**: [padrão] (ex: [exemplo])
- **Classes**: [padrão] (ex: [exemplo])
```

### 3. Fluxo Obrigatório Simplificado

```markdown
## 🚨 FLUXO OBRIGATÓRIO

### Após QUALQUER modificação:
```
📝 IMPLEMENTAR
    ↓
📋 CHANGELOG [Unreleased]
    ↓
✅ VALIDAR
   ├── [cmd-lint]
   ├── [cmd-test]
   └── [cmd-build]
    ↓
🔄 VERIFICAR BUILD (se novos arquivos)
    ↓
💾 COMMIT
    ↓
✅ COMPLETO
```

### Comandos Essenciais
```bash
[cmd-validate]    # Validação completa
[cmd-test]        # Testes
[cmd-build]       # Build
[cmd-commit]      # Commit seguro
```

### ⚠️ Nunca Pule
- Changelog update
- Validações completas
- Verificação de build
- Commit com mensagem padrão
```

### 4. Scripts Otimizados

```markdown
## 🔧 SCRIPTS

### Principais
```bash
[dev-cmd]         # Desenvolvimento
[build-cmd]       # Build produção
[test-cmd]        # Testes completos
[lint-cmd]        # Linting
[deploy-cmd]      # Deploy
```

### Automação
```bash
[validate-all]    # Validação completa
[commit-safe]     # Commit com checks
[release-cmd]     # Release automático
```

### Quando Usar
- **Desenvolvimento**: [dev-cmd], [watch-cmd]
- **Pré-commit**: [validate-all]
- **Release**: [build-cmd], [test-cmd], [release-cmd]
```

### 5. Padrões de Código Essenciais

```markdown
## 💻 PADRÕES

### Nomenclatura
```[linguagem]
// ✅ Correto
[exemplo-correto-específico]

// ❌ Evitar
[exemplo-incorreto-específico]
```

### Arquitetura
```[linguagem]
// ✅ [Padrão arquitetural específico]
[exemplo-arquitetura-projeto]
```

### Qualidade
- **Complexidade**: < [número] por função
- **Cobertura**: > [porcentagem]% crítico
- **Arquivo**: < [número] linhas

### Bibliotecas Preferidas
- **[Categoria1]**: [biblioteca] (não [alternativa])
- **[Categoria2]**: [biblioteca] (não [alternativa])
```

### 6. Debugging e Troubleshooting Específico

```markdown
## 🐛 DEBUG

### Ferramentas
```bash
[debug-cmd1]      # [situação específica]
[debug-cmd2]      # [situação específica]
```

### Problemas Comuns
- **[Problema1]**: [solução rápida]
- **[Problema2]**: [solução rápida]

### Logs
```[linguagem]
// ✅ [Como fazer log correto no projeto]
[exemplo-log-específico]
```
```

### 7. Versionamento Condensado

```markdown
## 📝 COMMITS

### Formato
```
<tipo>(<escopo>): <desc>
```

**Tipos**: feat, fix, docs, style, refactor, test, chore

### Exemplos Projeto
```bash
git commit -m "feat([escopo-projeto]): [exemplo específico]"
git commit -m "fix([escopo-projeto]): [exemplo específico]"
```

### Changelog
```markdown
## [Unreleased]
### Added/Changed/Fixed
- **[Componente]**: [descrição]
```

### Release
```bash
[release-patch]   # Correções
[release-minor]   # Features
[release-major]   # Breaking
```
```

### 8. Validações Críticas

```markdown
## 🔧 VALIDAÇÕES

### Obrigatórias
```bash
[lint-cmd]        # Linting
[type-cmd]        # Tipos (se TS)
[test-cmd]        # Testes
[build-cmd]       # Build
[security-cmd]    # Segurança
```

### Build
```bash
[build-dev]       # Desenvolvimento
[build-prod]      # Produção
[build-check]     # Verificação
```

### Performance
- **Bundle**: < [tamanho]
- **Load**: < [tempo]s
- **Memory**: < [limite]
```

### 9. Checklist Rápido

```markdown
## ✅ CHECKLIST

### Pré-Commit
- [ ] [lint-cmd] passou
- [ ] [test-cmd] passou
- [ ] [build-cmd] funcionou
- [ ] Changelog atualizado
- [ ] Padrões seguidos

### Qualidade
- [ ] Complexidade < [limite]
- [ ] Cobertura > [limite]%
- [ ] Performance ok
- [ ] Segurança ok

### Finalização
- [ ] Funcionalidade testada
- [ ] Documentação atualizada
- [ ] Commit realizado
```

### 10. Avisos Críticos Específicos

```markdown
## 🚨 AVISOS

### NUNCA
- ❌ [Ação proibida específica 1]
- ❌ [Ação proibida específica 2]
- ❌ [Ação proibida específica 3]

### Segurança
```[linguagem]
// ✅ [Prática segura específica]
[exemplo-segurança]
```

### Performance
```[linguagem]
// ✅ [Otimização específica]
[exemplo-performance]
```
```

### 11. Resumo Executivo Ultra-Conciso

```markdown
## 📋 RESUMO

### Fluxo Básico
1. Ler agents.md → 2. Implementar → 3. Validar → 4. Commit

### Comandos Críticos
```bash
[validate-cmd]    # Antes commit
[build-cmd]       # Verificar
[commit-cmd]      # Finalizar
```

### Arquivos Críticos
- `[arquivo1]` - [cuidado]
- `[arquivo2]` - [cuidado]

### Checklist Mínimo
- [ ] Validações ok
- [ ] Changelog atualizado
- [ ] Padrões seguidos
- [ ] Commit feito
```

---

## 🎯 Diretrizes de Personalização Detalhadas

### 1. Adaptação por Tipo de Projeto

#### Extensões de Navegador
**Elementos específicos a incluir:**
- Manifest V3 requirements e validações
- Cross-browser compatibility checks
- Content scripts e background scripts patterns
- Permissions e security policies
- Store submission guidelines

**Comandos típicos:**
```bash
npm run build:chrome     # Build para Chrome
npm run build:firefox    # Build para Firefox
npm run validate:manifest # Validar manifest
npm run test:extension   # Testes específicos
```

**Padrões específicos:**
```javascript
// ✅ Content Script Pattern
const contentScript = {
  matches: ["<all_urls>"],
  js: ["content.js"],
  run_at: "document_end"
};
```

#### Aplicações Web (React/Vue/Angular)
**Elementos específicos a incluir:**
- Component architecture patterns
- State management guidelines
- Build optimization settings
- SEO e performance requirements
- Accessibility standards

**Comandos típicos:**
```bash
npm run dev              # Desenvolvimento
npm run build            # Build produção
npm run test:unit        # Testes unitários
npm run test:e2e         # Testes E2E
npm run lighthouse       # Performance audit
```

**Padrões específicos:**
```jsx
// ✅ Component Pattern
const Component = memo(({ data }) => {
  const memoizedValue = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  return <div>{memoizedValue}</div>;
});
```

#### APIs/Backend
**Elementos específicos a incluir:**
- API design patterns (REST/GraphQL)
- Database migration workflows
- Security middleware requirements
- Rate limiting e monitoring
- Documentation standards

**Comandos típicos:**
```bash
npm run migrate          # Database migrations
npm run seed             # Seed data
npm run test:api         # API tests
npm run security:audit   # Security scan
npm run docs:generate    # Generate API docs
```

**Padrões específicos:**
```javascript
// ✅ API Route Pattern
app.get('/api/users/:id', 
  authenticate,
  validate(userSchema),
  async (req, res) => {
    // Implementation
  }
);
```

#### Bibliotecas/Packages
**Elementos específicos a incluir:**
- Semantic versioning strategy
- Breaking changes documentation
- Backward compatibility requirements
- API design principles
- Distribution formats

**Comandos típicos:**
```bash
npm run build:lib        # Build biblioteca
npm run test:compat      # Compatibility tests
npm run docs:api         # API documentation
npm run release:beta     # Beta release
```

### 2. Personalização de Linguagem e Stack

#### TypeScript Projects
```typescript
// ✅ Type Safety Pattern
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
```

#### Python Projects
```python
# ✅ Python Pattern
from typing import Optional, List
from dataclasses import dataclass

@dataclass
class User:
    id: str
    name: str
    email: Optional[str] = None
```

#### Go Projects
```go
// ✅ Go Pattern
type UserService interface {
    GetUser(ctx context.Context, id string) (*User, error)
    UpdateUser(ctx context.Context, id string, user *User) error
}
```

### 3. Comandos e Scripts Específicos por Ambiente

#### Node.js/npm
```bash
npm run dev              # Desenvolvimento
npm run build            # Build
npm run test             # Testes
npm run lint             # Linting
npm run format           # Formatação
```

#### Python/pip
```bash
python -m pytest        # Testes
python -m black .        # Formatação
python -m flake8         # Linting
python -m mypy .         # Type checking
```

#### Go
```bash
go run .                 # Executar
go build                 # Build
go test ./...            # Testes
go fmt ./...             # Formatação
go vet ./...             # Análise estática
```

### 4. Métricas e Thresholds por Tipo

#### Web Applications
- Bundle size: < 250KB initial, < 1MB total
- First Contentful Paint: < 1.5s
- Lighthouse score: > 90
- Test coverage: > 80%

#### APIs
- Response time: < 200ms p95
- Throughput: > 1000 req/s
- Error rate: < 0.1%
- Test coverage: > 90%

#### Libraries
- Bundle size: < 100KB
- Tree-shaking support: Required
- TypeScript definitions: Required
- Documentation coverage: 100%

---

## 📝 Template de Prompt Completo para Uso

```markdown
Crie um arquivo `agents.md` OTIMIZADO para o seguinte projeto:

**INFORMAÇÕES DO PROJETO:**
- **Nome**: [Nome do projeto]
- **Tipo**: [Web app/API/Extension/Library/Mobile/Desktop]
- **Stack Principal**: [React/Vue/Angular/Node/Python/Go/etc]
- **Linguagem**: [TypeScript/JavaScript/Python/Go/etc]
- **Framework**: [Next.js/Express/FastAPI/Gin/etc]
- **Arquitetura**: [MVC/Clean/Hexagonal/Microservices/etc]
- **Build System**: [Webpack/Vite/Rollup/Docker/etc]
- **Package Manager**: [npm/yarn/pnpm/pip/go mod/etc]
- **Deployment**: [Vercel/AWS/Docker/Kubernetes/etc]
- **Database**: [PostgreSQL/MongoDB/Redis/etc]
- **Testes**: [Jest/Vitest/Pytest/Go test/etc]
- **Linting**: [ESLint/Pylint/golangci-lint/etc]
- **Formatação**: [Prettier/Black/gofmt/etc]
- **CI/CD**: [GitHub Actions/GitLab CI/Jenkins/etc]
- **Monitoramento**: [Sentry/DataDog/New Relic/etc]

**ESTRUTURA ATUAL:**
```
[Fornecer estrutura completa do projeto com descrições]
```

**SCRIPTS EXISTENTES:**
```json
{
  "scripts": {
    [Listar TODOS os scripts npm/comandos disponíveis]
  }
}
```

**DEPENDÊNCIAS CRÍTICAS:**
- [Listar dependências principais e suas versões]
- [APIs externas utilizadas]
- [Serviços de terceiros]
- [Bibliotecas core do projeto]

**FLUXO DE DESENVOLVIMENTO ATUAL:**
- [Git workflow usado (GitFlow/GitHub Flow/etc)]
- [Processo de code review]
- [Estratégia de branching]
- [Processo de release]
- [Ambiente de staging/produção]

**PADRÕES DE CÓDIGO EXISTENTES:**
- [Convenções de nomenclatura específicas]
- [Padrões arquiteturais utilizados]
- [Estrutura de componentes/módulos]
- [Padrões de import/export]

**VALIDAÇÕES E QUALIDADE:**
- [Ferramentas de linting configuradas]
- [Testes automatizados existentes]
- [Métricas de qualidade definidas]
- [Thresholds de performance]

**PROBLEMAS CONHECIDOS:**
- [Issues comuns que desenvolvedores enfrentam]
- [Armadilhas específicas do projeto]
- [Soluções para problemas recorrentes]
- [Limitações técnicas conhecidas]

**CONSIDERAÇÕES ESPECIAIS:**
- [Requisitos de segurança específicos]
- [Considerações de performance críticas]
- [Compatibilidade necessária (browsers/versions)]
- [Requisitos de acessibilidade]
- [Compliance/regulamentações]

**AUTOMAÇÕES EXISTENTES:**
- [Scripts de deploy automatizado]
- [Pipelines de CI/CD configurados]
- [Hooks de git configurados]
- [Ferramentas de monitoramento]

**DOCUMENTAÇÃO EXISTENTE:**
- [README atual]
- [Documentação de API]
- [Guias de contribuição]
- [Changelog format]

Use a estrutura OTIMIZADA fornecida e adapte COMPLETAMENTE para este projeto específico. O arquivo resultante deve ser:

1. **CONCISO**: Máximo eficiência de tokens
2. **ESPECÍFICO**: Adaptado 100% para este projeto
3. **PRÁTICO**: Comandos e exemplos reais
4. **COMPLETO**: Todas as informações críticas
5. **ATUALIZADO**: Refletindo o estado atual do projeto

O agente deve conseguir ler o arquivo rapidamente e ter todas as informações necessárias para trabalhar efetivamente no projeto.
```

---

## 🎯 Resultado Esperado

O arquivo `agents.md` gerado deve ser:

### Características Obrigatórias:
- **Token-Efficient**: Máximo 3.000-4.000 tokens
- **Project-Specific**: 100% adaptado ao projeto
- **Actionable**: Comandos e exemplos práticos
- **Complete**: Todas as informações críticas
- **Scannable**: Estrutura fácil de navegar
- **Maintainable**: Fácil de atualizar

### O agente que usar este arquivo deve conseguir:
1. **Entender rapidamente** a arquitetura e padrões (< 30 segundos)
2. **Implementar mudanças** seguindo as convenções exatas
3. **Validar adequadamente** usando os comandos corretos
4. **Documentar corretamente** seguindo os padrões
5. **Evitar problemas** conhecidos do projeto
6. **Manter qualidade** através das validações definidas

### Métricas de Sucesso:
- Tempo de leitura: < 2 minutos
- Tokens consumidos: < 4.000
- Informações críticas: 100% cobertas
- Especificidade: 100% adaptado ao projeto
- Usabilidade: Agente consegue trabalhar imediatamente

---

**Este prompt deve ser usado sempre que um novo projeto precisar de orientação otimizada para agentes de IA, garantindo máxima eficiência de tokens sem perder qualidade ou completude das informações.**