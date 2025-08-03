# TASK-M-003: Browser Polyfill Standard – Análise e Guia de Implementação

## 1. Objetivo

Garantir **consistência e compatibilidade cross-browser** (Chrome, Firefox, Edge) para todas as APIs de extensão, utilizando um polyfill padronizado e seguro, sem adicionar complexidade desnecessária ao código.

---

## 2. Contexto Atual

- O projeto já utiliza o arquivo `browser-polyfill.js`.
- Imports e uso de APIs seguem o padrão:
  ```js
  const api = typeof browser !== 'undefined' ? browser : chrome;
  await api.storage.local.set({ ... });
  ```
- O polyfill cobre diferenças principais entre `chrome.*` e `browser.*` APIs.
- O código evita duplicidade e mantém legibilidade.
- Testes e builds já validam cross-browser (ver tasks e scripts de build).

**Conclusão:**

- O suporte cross-browser já está implementado de forma enxuta e correta.
- Não há sinais de complexidade desnecessária.
- O padrão é consistente em todos os arquivos críticos (`background.js`, `content-script.js`, `api.js`, `store.js`).

---

## 3. Critérios de Sucesso

- 100% das chamadas de API de extensão usam o wrapper polyfill (`api` ou `browser` via polyfill).
- Zero uso direto de `chrome.*` sem fallback.
- Nenhum código duplicado para browsers diferentes.
- Testes e builds passam em todos os navegadores suportados.
- Performance e legibilidade mantidas.

---

## 4. Checklist de Implementação

### 4.1. Padronização de Uso

- [ ] Todos os arquivos que usam APIs de extensão devem importar/utilizar o polyfill.
- [ ] Substituir qualquer uso direto de `chrome.*` por `api` (ou `browser` via polyfill).
- [ ] Garantir que não há duplicidade de lógica para browsers diferentes.

### 4.2. Validação

- [ ] Rodar `npm run build:all` e testar em Chrome, Firefox e Edge.
- [ ] Rodar `npm run ci:validate` e `npm run test:unit`.
- [ ] Validar flows médicos críticos (SIGSS, CADSUS) em todos os browsers.
- [ ] Verificar logs para garantir ausência de erros de namespace.

### 4.3. Documentação

- [ ] Atualizar comentários nos arquivos principais explicando o padrão de uso do polyfill.
- [ ] Garantir que README e docs mencionam o padrão cross-browser.

---

## 5. Pontos de Atenção

- **NÃO** adicionar wrappers ou abstrações extras além do polyfill já existente.
- **NÃO** criar branches de código por navegador.
- **NÃO** modificar o polyfill oficial sem necessidade comprovada.
- **NÃO** remover o fallback para `chrome` (Edge ainda depende).
- **NÃO** logar dados sensíveis durante testes cross-browser.

---

## 6. Fluxo de Trabalho Sugerido

1. **Revisar todos os arquivos JS** que usam APIs de extensão.
2. **Padronizar** para uso do polyfill (`api` ou `browser` via polyfill).
3. **Testar** todos os fluxos críticos em Chrome, Firefox e Edge.
4. **Rodar scripts de build e validação**.
5. **Atualizar documentação** se necessário.
6. **Commitar** seguindo padrão Conventional Commits.

---

## 7. Exemplo de Uso Correto

```js
// Importa polyfill se necessário (browser-polyfill.js já incluso no build)
const api = typeof browser !== 'undefined' ? browser : chrome;

// Uso consistente
api.storage.local.set({ foo: 'bar' });
api.runtime.onMessage.addListener((msg) => { ... });
```

---

## 8. Pós-Implementação

- Validar que builds e testes passam em todos os browsers.
- Garantir que não há regressões em flows médicos.
- Atualizar changelog e documentação.

---

## 9. Referências

- [webextension-polyfill (Mozilla)](https://github.com/mozilla/webextension-polyfill)
- [MDN: Browser Extensions](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions)
- [Manifest V3 Cross-browser Guide](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)

---

## 10. Resumo

O projeto já adota o padrão correto de polyfill para cross-browser. O foco deve ser **manter a simplicidade**, garantir padronização e validar flows críticos em todos os navegadores. **NÃO adicionar complexidade desnecessária.**
