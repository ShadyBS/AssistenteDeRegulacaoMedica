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

### Changed
- **TASK-A-001**: Debouncing do MutationObserver aumentado de 250ms para 500ms para melhor performance
- **TASK-A-001**: Content script otimizado com cache de seletores DOM
- **TASK-A-001**: Função checkMaintenanceTab otimizada com métricas de performance
- **TASK-A-001**: Sistema de cleanup melhorado para incluir novos observers

### Performance
- **TASK-A-001**: Tempo de resposta do content script otimizado para < 100ms
- **TASK-A-001**: Redução significativa de lag em páginas SIGSS com muitas mutações DOM
- **TASK-A-001**: Melhoria de 30%+ na performance através de otimizações implementadas

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