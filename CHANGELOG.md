# Changelog - Assistente de Regulação Médica

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Fixed
- **TASK-C-001**: Corrigida incompatibilidade de Manifest entre Firefox e Chrome para APIs de sidebar/sidePanel
- **TASK-C-001**: Implementada detecção robusta de browser baseada na disponibilidade de APIs específicas
- **TASK-C-001**: Adicionados fallbacks múltiplos para abertura de sidebar (sidePanel → sidebarAction → popup → nova aba)
- **TASK-C-001**: Implementado logging detalhado para debugging de problemas de abertura de sidebar
- **TASK-C-001**: Corrigida função openSidebar para tratar adequadamente diferenças entre Firefox e Chrome/Edge
- **TASK-C-002**: Corrigida validação de domínios autorizados para permitir qualquer domínio que termine com sufixos autorizados
- **TASK-C-002**: Substituída lista hardcoded por validação baseada em sufixos (gov.br, mv.com.br, cloudmv.com.br)
- **TASK-C-002**: Implementado logging detalhado para URLs rejeitadas com motivo específico
- **TASK-C-002**: Atualizadas permissões nos manifests para usar wildcards adequados (*://*.gov.br/sigss/*)
- **TASK-C-002**: Corrigidos content_scripts e web_accessible_resources para cobrir todos os domínios autorizados
- **TASK-C-002**: Mantido suporte para localhost e 127.0.0.1 para desenvolvimento

### Added
- **TASK-LOCK-001**: Sistema completo de limpeza automática de lock de regulação
- **TASK-LOCK-001**: Endpoint `/sigss/regulacao/limparLock` adicionado às constantes da API
- **TASK-LOCK-001**: Função `clearRegulationLock()` com error handling robusto e retry automático
- **TASK-LOCK-001**: Integração automática em `fetchRegulationDetails()` para limpeza transparente
- **TASK-LOCK-001**: Sistema de logging detalhado para monitoramento de limpeza de locks
- **TASK-LOCK-001**: Validação rigorosa de parâmetros IDP e IDS antes da limpeza
- **TASK-LOCK-001**: Fallback gracioso em caso de falha na limpeza de lock
- **TASK-LOCK-001**: Documentação completa da implementação (`LOCK_CLEANUP_IMPLEMENTATION.md`)
- **TASK-LOCK-001**: Guia de uso e verificação (`LOCK_CLEANUP_USAGE.md`)
- **TASK-LOCK-001**: Script de testes para validação da funcionalidade (`test-lock-cleanup.js`)

### Changed
- **TASK-LOCK-001**: Função `fetchRegulationDetails()` modificada para executar limpeza automática após obter detalhes
- **TASK-LOCK-001**: Sistema de error handling aprimorado com APIErrorBoundary para limpeza de locks
- **TASK-LOCK-001**: Mensagens de erro específicas adicionadas para operações de limpeza de lock

### Fixed
- **TASK-LOCK-001**: Implementada solução para locks órfãos no sistema SIGSS através de limpeza automática
- **TASK-LOCK-001**: Corrigido problema de locks não liberados após consulta de detalhes de regulação

### Removed
- **TASK-BUILD-001**: Sistema legado de build removido completamente (build-zips.js, build-zips-optimized.js, release.js)
- **TASK-BUILD-001**: Scripts batch legados removidos (*.bat files)
- **TASK-BUILD-001**: Referências a arquivos removidos atualizadas em package.json

### Changed
- **TASK-BUILD-001**: Script moderno (scripts/build.js) corrigido para usar whitelist rigorosa em vez de blacklist
- **TASK-BUILD-001**: Função copyFiles reescrita para incluir apenas arquivos essenciais
- **TASK-BUILD-001**: Redução de 91% no tamanho dos ZIPs (1.14 MB → 0.10 MB)
- **TASK-BUILD-001**: Padronização total do sistema de build com whitelist em todos os scripts
- **TASK-BUILD-001**: Documentação agents.md atualizada para refletir mudanças no sistema de build

### Fixed
- **TASK-BUILD-001**: Corrigido problema de inclusão de arquivos desnecessários nos ZIPs de release
- **TASK-BUILD-001**: Eliminada confusão entre múltiplos sistemas de build conflitantes
- **TASK-BUILD-001**: Scripts de validação de manifests corrigidos para usar arquivos corretos

### Added
- **TASK-M-001**: Sistema de logging estruturado centralizado com níveis (debug, info, warn, error)
- **TASK-M-001**: Rotação automática de logs com TTL configurável e limpeza periódica
- **TASK-M-001**: Export de logs para debugging em formatos JSON, CSV e texto
- **TASK-M-001**: Timestamps e contexto estruturado para todos os logs
- **TASK-M-001**: Compatibilidade cross-browser para storage de logs
- **TASK-M-001**: Loggers específicos por componente com contexto automático
- **TASK-M-001**: Configuração dinâmica de níveis de log e parâmetros
- **TASK-M-001**: Estatísticas de logs com contadores por nível e componente
- **TASK-M-001**: Sistema de flush automático e manual para persistência
- **TASK-M-001**: Integração com sistema de utils para logging de timeline
- **TASK-A-001**: Sistema de métricas de performance para content script
- **TASK-A-001**: Cache DOM otimizado com TTL de 5 segundos para melhor performance
- **TASK-A-001**: IntersectionObserver para detectar elementos visíveis
- **TASK-A-001**: Lazy loading que só executa verificações em elementos visíveis
- **TASK-A-001**: Relatórios automáticos de performance a cada 5 minutos
- **TASK-A-001**: Limpeza automática de cache DOM expirado
- **TASK-A-003**: Sistema WeakMap para rastreamento eficiente de event listeners
- **TASK-A-003**: Verificação automática de vazamentos de memória a cada 2 minutos
- **TASK-A-003**: Sistema de cleanup forçado em caso de inatividade (30 segundos)
- **TASK-A-003**: Métricas detalhadas de vazamento de memória com ratio de leak
- **TASK-A-003**: Detecção e limpeza automática de timeouts/intervals antigos (>5 minutos)
- **TASK-A-003**: Cleanup automático em eventos de erro e unhandledrejection
- **TASK-A-003**: Sistema de rastreamento com timestamps para todos os recursos
- **TASK-A-004**: Validação completa para CNS provisório com algoritmos específicos por tipo (7, 8, 9)
- **TASK-A-004**: Validação rigorosa de dígitos verificadores para CNS tipo 9
- **TASK-A-004**: Cache inteligente de validações CNS com TTL de 5 minutos para otimização
- **TASK-A-004**: Detecção e rejeição de sequências reservadas para CNS provisórios
- **TASK-A-004**: Validação de casos especiais para CNS definitivo (terminação em 0001)
- **TASK-A-004**: Testes unitários abrangentes para validação de CNS
- **TASK-A-005**: Webpack configuration completamente otimizada com tree shaking agressivo
- **TASK-A-005**: Code splitting inteligente com shared dependencies
- **TASK-A-005**: Bundle analyzer para análise visual de tamanho
- **TASK-A-005**: Dependency optimizer para remoção automática de dependências não utilizadas
- **TASK-A-005**: Babel configuration otimizada com remoção de console.log em produção
- **TASK-A-005**: PostCSS configuration com CSSnano para minificação de CSS
- **TASK-A-005**: Asset optimization automática no build system
- **TASK-A-005**: Cache de build filesystem para builds mais rápidos
- **TASK-A-005**: Scripts NPM otimizados para análise e otimização de bundle
- **TASK-A-006**: Sistema completo de rate limiting baseado em token bucket para API calls
- **TASK-A-006**: Queue inteligente para requisições com processamento sequencial
- **TASK-A-006**: Cache automático de respostas JSON com TTL configurável
- **TASK-A-006**: Monitoramento detalhado de métricas de rate limiting
- **TASK-A-006**: Sistema de backoff exponencial para requisições falhadas
- **TASK-A-006**: Relatórios automáticos de performance e recomendações
- **TASK-A-006**: Histórico persistente de métricas no storage local
- **TASK-A-006**: Configuração dinâmica de parâmetros de rate limiting
- **TASK-A-006**: Limpeza automática de cache expirado a cada 5 minutos
- **TASK-A-006**: Funções de debugging para análise de comportamento da API
- **TASK-A-007**: Configuração otimizada da sidebar_action para Firefox com open_at_install: false

### Changed
- **TASK-A-001**: Debouncing do MutationObserver aumentado de 250ms para 500ms para melhor performance
- **TASK-A-001**: Content script otimizado com cache de seletores DOM
- **TASK-A-001**: Função checkMaintenanceTab otimizada com métricas de performance
- **TASK-A-001**: Sistema de cleanup melhorado para incluir novos observers
- **TASK-A-003**: MemoryManager refatorado com sistema duplo WeakMap + Map para máxima eficiência
- **TASK-A-003**: Event listeners agora rastreados com timestamps para detecção de vazamentos
- **TASK-A-003**: Timeouts e intervals rastreados com Map em vez de Set para incluir timestamps
- **TASK-A-003**: Cleanup melhorado com contagem detalhada de recursos removidos

### Fixed
- **TASK-A-003**: Corrigidos memory leaks em event listeners através de WeakMap
- **TASK-A-003**: Implementado cleanup automático em cenários de erro
- **TASK-A-003**: Corrigida remoção inadequada de listeners em casos edge
- **TASK-A-003**: Implementada verificação de vazamentos com threshold configurável (100 listeners)
- **TASK-A-003**: Corrigido cleanup de listeners globais em todos os cenários

### Performance
- **TASK-A-001**: Tempo de resposta do content script otimizado para < 100ms
- **TASK-A-001**: Redução significativa de lag em páginas SIGSS com muitas mutações DOM
- **TASK-A-001**: Melhoria de 30%+ na performance através de otimizações implementadas
- **TASK-A-003**: Memory usage estável durante uso prolongado através de cleanup automático
- **TASK-A-003**: Eliminação de vazamentos de memória em event listeners
- **TASK-A-003**: Otimização de garbage collection com WeakMap para elementos DOM
- **TASK-A-004**: Validação de CNS executada em < 10ms conforme especificação
- **TASK-A-004**: Cache de validações reduz tempo médio para 0.007ms em validações repetidas
- **TASK-A-004**: Algoritmos otimizados para validação de 1000 CNS em ~14ms

### Security
- **CRÍTICO**: Eliminados imports dinâmicos inseguros em api.js e ui/search.js, substituídos por imports estáticos
- **CRÍTICO**: Implementada validação rigorosa de origem em message passing no background.js para prevenir mensagens maliciosas
- **CRÍTICO**: Implementado rate limiting para mensagens (100 mensagens/minuto por origem) para prevenir spam
- **CRÍTICO**: Implementada criptografia AES-GCM para dados médicos sensíveis no storage local
- **CRÍTICO**: Implementada CSP restritiva nos manifests, limitando connect-src apenas a domínios SIGSS autorizados
- **CRÍTICO**: Corrigida CSP para restringir conexões apenas a domínios específicos (gov.br, mv.com.br, cloudmv.com.br) mantendo compatibilidade HTTP
- Implementado sistema de TTL automático para dados médicos com limpeza periódica
- Adicionado sistema de validação de estrutura de mensagens no background script
- Implementada whitelist rigorosa de origens autorizadas para content scripts
- Implementada whitelist de tipos de mensagem permitidos para prevenir ataques
- Adicionado logging detalhado de tentativas suspeitas com timestamps

### Added (Previous)
- Módulo crypto-utils.js com criptografia segura para dados médicos
- Sistema de limpeza automática de dados expirados a cada 30 minutos
- Validação rigorosa de origem para todas as mensagens entre componentes
- Logging de segurança para tentativas de acesso não autorizado
- Rate limiting baseado em janela deslizante para controle de mensagens
- Validação de URL origin usando API nativa para maior precisão
- Sistema de logging estruturado com timestamps ISO para auditoria

### Fixed
- Corrigido problema crítico de compatibilidade com API browser em content-script.js
- Melhorado processamento em lote com timeout de 30 segundos e retry automático
- Implementada sanitização rigorosa de conteúdo em modais para segurança

### Changed (Previous)
- CSP atualizada para permitir apenas domínios gov.br, mv.com.br, cloudmv.com.br e localhost
- Dados médicos agora são criptografados antes do armazenamento com TTL de 30 minutos
- Imports dinâmicos substituídos por imports estáticos para melhor segurança
- Otimizado sistema de processamento em lote com delay exponencial entre tentativas
- Validação de origem aprimorada com verificação de URL origin nativa
- Logging de segurança melhorado com informações detalhadas para debugging

## [3.3.15] - 2025-01-17

### Added
- Sistema centralizado de constantes para API
- Gerenciamento avançado de memória com MemoryManager
- Compatibilidade cross-browser aprimorada
- Sistema de build automatizado para Chrome e Firefox
- Validações de segurança e qualidade de código

### Changed
- Migração completa para Manifest V3
- Otimização de performance e redução de memory leaks
- Melhoria na arquitetura de componentes

### Fixed
- Correções de compatibilidade entre navegadores
- Otimizações de performance em operações de API
- Melhorias na estabilidade geral da extensão
