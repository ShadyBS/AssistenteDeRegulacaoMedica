# Changelog - Assistente de Regulação Médica

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Security
- Corrigido uso de innerHTML sem sanitização em sidebar.js para prevenir vulnerabilidades XSS
- Implementado fallback seguro para API browser em content-script.js para compatibilidade cross-browser
- Adicionado timeout e retry logic em processamento em lote da API para prevenir falhas em sistemas com muitos dados

### Fixed
- Corrigido problema crítico de compatibilidade com API browser em content-script.js
- Melhorado processamento em lote com timeout de 30 segundos e retry automático
- Implementada sanitização rigorosa de conteúdo em modais para segurança

### Changed
- Otimizado sistema de processamento em lote com delay exponencial entre tentativas
- Melhorada robustez do sistema de API com tratamento de timeout

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