# Assistente de Regulação Médica

Extensão para navegadores (Firefox, Chrome, Edge) que auxilia médicos reguladores na análise de solicitações, centralizando informações do paciente e automatizando tarefas repetitivas.

## Funcionalidades

- Barra lateral integrada ao sistema de regulação
- Busca automática e manual de pacientes
- Comparação de dados com CADSUS
- Filtros avançados e personalizáveis
- Gerenciador de automações (regras)
- Exportação/importação de configurações e regras
- Compatível com Firefox e Chromium (Chrome/Edge)

## Instalação

### Firefox

1. Baixe o arquivo `AssistenteDeRegulacao-firefox-vX.Y.Z.zip` na seção de [Releases](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/releases).
2. Acesse `about:addons` > clique em ⚙️ > "Instalar Add-on a partir de arquivo..." e selecione o ZIP!

### Chrome/Edge

1. Baixe o arquivo `AssistenteDeRegulacao-vX.Y.Z.zip` na seção de [Releases](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/releases).
2. Extraia o ZIP em uma pasta.
3. Acesse `chrome://extensions` ou `edge://extensions`.
4. Ative o "Modo do desenvolvedor".
5. Clique em "Carregar sem compactação" e selecione a pasta extraída.

## Build e Geração dos ZIPs

1. Instale as dependências (local ou global):
   ```sh
   npm install archiver fs-extra
   ```
   ou global:
   ```sh
   npm install -g archiver fs-extra
   ```
2. Gere os arquivos ZIP:
   ```sh
   node build-zips.js
   ```
   Os arquivos serão criados na pasta `dist-zips/`.

> **Dica:** Se usar dependências globais, defina a variável de ambiente `NODE_PATH` para o diretório global dos módulos antes de rodar o script.

## Publicando um Release no GitHub

O projeto inclui um script para automatizar todo o processo de build e release.

1.  Certifique-se de que o GitHub CLI está instalado e você está autenticado (`gh auth login`).
2.  Execute o script de release:

```sh
build-release.bat
```

3.  O script irá:
    - Mostrar a versão atual.
    - Pedir para você digitar a nova versão (ex: `3.2.7`).
    - Atualizar os arquivos `manifest.json` e `manifest-edge.json`.
    - Gerar os arquivos `.zip` na pasta `dist-zips/`.
    - Fazer o commit, criar a tag da nova versão e fazer o push para o GitHub.
    - Criar um novo Release no GitHub com os arquivos `.zip` anexados.

## Guia do Usuário

Consulte o arquivo [`help.html`](help.html) para um guia completo de uso e dicas.

## Licença

[MIT](LICENSE)
