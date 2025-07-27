# Changelog - Assistente de Regulação Médica

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
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
