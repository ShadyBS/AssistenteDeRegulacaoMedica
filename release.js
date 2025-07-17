require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");
const semver = require("semver");

const git = simpleGit();

// Configurações do repositório
const REPO_CONFIG = {
  owner: "ShadyBS",
  repo: "AssistenteDeRegulacaoMedica",
  mainBranch: "main"
};

// Validação de ambiente
function validateEnvironment() {
  const requiredEnvVars = ['GITHUB_TOKEN'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}\n` +
      'Configure o GITHUB_TOKEN no arquivo .env ou como variável de ambiente.');
  }
  
  // Valida se o token tem formato válido
  if (!process.env.GITHUB_TOKEN.startsWith('ghp_') && !process.env.GITHUB_TOKEN.startsWith('github_pat_')) {
    console.warn('⚠️  Formato do GITHUB_TOKEN pode estar incorreto. Tokens devem começar com "ghp_" ou "github_pat_"');
  }
}

// Inicializa cliente GitHub com validação
function initializeGitHub() {
  try {
    return new Octokit({ 
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'AssistenteDeRegulacao-Release-Script/1.0.0'
    });
  } catch (error) {
    throw new Error(`Falha ao inicializar cliente GitHub: ${error.message}`);
  }
}

/**
 * Valida formato de versão usando semver
 */
function validateVersion(version) {
  if (!semver.valid(version)) {
    throw new Error(`Formato de versão inválido: ${version}. Use formato semver (ex: 1.2.3)`);
  }
  
  return semver.clean(version);
}

/**
 * Obtém a última tag do repositório
 */
async function getLastTag() {
  try {
    const tags = await git.tags();
    return tags.latest || null;
  } catch (error) {
    console.warn('⚠️  Não foi possível obter tags do repositório');
    return null;
  }
}

/**
 * Gera changelog desde a última tag com melhor formatação
 */
async function getChangelog(fromTag) {
  try {
    const logOptions = fromTag ? { from: fromTag, to: "HEAD" } : { maxCount: 50 };
    const log = await git.log(logOptions);
    
    if (log.all.length === 0) {
      return "Primeira release";
    }
    
    // Categoriza commits por tipo
    const categories = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      test: [],
      chore: [],
      other: []
    };
    
    log.all.forEach(entry => {
      const message = entry.message.trim();
      const match = message.match(/^(\w+)(\(.+\))?\s*:\s*(.+)/);
      
      if (match) {
        const [, type, scope, description] = match;
        const category = categories[type] || categories.other;
        category.push(`- ${description}${scope ? ` ${scope}` : ''}`);
      } else {
        categories.other.push(`- ${message}`);
      }
    });
    
    // Monta changelog formatado
    let changelog = '';
    
    if (categories.feat.length > 0) {
      changelog += '## ✨ Novas Funcionalidades\n' + categories.feat.join('\n') + '\n\n';
    }
    
    if (categories.fix.length > 0) {
      changelog += '## 🐛 Correções\n' + categories.fix.join('\n') + '\n\n';
    }
    
    if (categories.refactor.length > 0) {
      changelog += '## ♻️ Refatorações\n' + categories.refactor.join('\n') + '\n\n';
    }
    
    if (categories.docs.length > 0) {
      changelog += '## 📚 Documentação\n' + categories.docs.join('\n') + '\n\n';
    }
    
    if (categories.other.length > 0) {
      changelog += '## 🔧 Outras Alterações\n' + categories.other.join('\n') + '\n\n';
    }
    
    return changelog.trim() || 'Atualizações diversas';
    
  } catch (error) {
    console.warn('⚠️  Erro ao gerar changelog:', error.message);
    return 'Changelog não disponível';
  }
}

/**
 * Atualiza versão nos manifests com validação robusta
 */
async function updateManifestVersion(newVersion) {
  const manifestFiles = ["manifest.json", "manifest-edge.json"];
  const updatedFiles = [];
  
  console.log(`📝 Atualizando manifests para versão ${newVersion}...`);
  
  for (const file of manifestFiles) {
    const manifestPath = path.join(__dirname, file);
    
    try {
      if (!await fs.pathExists(manifestPath)) {
        console.warn(`⚠️  Arquivo não encontrado: ${file}`);
        continue;
      }
      
      // Lê e limpa BOM se presente
      let content = await fs.readFile(manifestPath, "utf8");
      content = content.replace(/^\uFEFF/, "");
      
      // Valida JSON
      let manifest;
      try {
        manifest = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`JSON inválido em ${file}: ${parseError.message}`);
      }
      
      // Backup da versão anterior
      const oldVersion = manifest.version;
      
      // Atualiza versão
      manifest.version = newVersion;
      
      // Escreve arquivo com formatação consistente
      const newContent = JSON.stringify(manifest, null, 2) + "\n";
      await fs.writeFile(manifestPath, newContent, "utf8");
      
      console.log(`   ✓ ${file}: ${oldVersion} → ${newVersion}`);
      updatedFiles.push({ file, oldVersion, newVersion });
      
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${file}: ${error.message}`);
      throw error;
    }
  }
  
  if (updatedFiles.length === 0) {
    throw new Error('Nenhum manifest foi atualizado');
  }
  
  return updatedFiles;
}

/**
 * Executa build do CSS com Tailwind
 */
async function buildTailwind() {
  console.log("🎨 Gerando CSS com Tailwind...");
  
  try {
    // Verifica se o arquivo de entrada existe
    const inputPath = path.join(__dirname, "src", "input.css");
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
    }
    
    // Garante que o diretório de saída existe
    const outputDir = path.join(__dirname, "dist");
    await fs.ensureDir(outputDir);
    
    execSync("npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify", {
      stdio: "inherit",
      timeout: 30000 // 30 segundos timeout
    });
    
    // Verifica se o arquivo foi criado
    const outputPath = path.join(__dirname, "dist", "output.css");
    if (!await fs.pathExists(outputPath)) {
      throw new Error("Arquivo CSS não foi gerado");
    }
    
    const stats = await fs.stat(outputPath);
    console.log(`   ✓ CSS gerado: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    throw new Error(`Falha no build do CSS: ${error.message}`);
  }
}

/**
 * Executa build dos ZIPs usando o script melhorado
 */
async function buildZips() {
  console.log("��� Gerando ZIPs...");
  
  try {
    execSync("node build-zips.js", { 
      stdio: "inherit",
      timeout: 60000 // 60 segundos timeout
    });
    
    // Verifica se os ZIPs foram criados
    const distZipsDir = path.join(__dirname, "dist-zips");
    if (!await fs.pathExists(distZipsDir)) {
      throw new Error("Diretório dist-zips não foi criado");
    }
    
    const zipFiles = (await fs.readdir(distZipsDir)).filter(f => f.endsWith('.zip'));
    if (zipFiles.length === 0) {
      throw new Error("Nenhum arquivo ZIP foi gerado");
    }
    
    console.log(`   ✓ ${zipFiles.length} ZIP(s) gerado(s)`);
    
  } catch (error) {
    throw new Error(`Falha no build dos ZIPs: ${error.message}`);
  }
}

/**
 * Executa verificações de segurança antes do release
 */
async function performSecurityChecks(newVersion) {
  console.log("🔍 Executando verificações de segurança...");
  
  // Verifica se o diretório de trabalho está limpo
  const status = await git.status();
  if (!status.isClean()) {
    throw new Error(
      "Diretório de trabalho tem modificações não commitadas.\n" +
      "Faça o commit ou 'git stash' de suas alterações antes de criar uma release."
    );
  }
  
  // Verifica se estamos na branch principal
  const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
  if (currentBranch !== REPO_CONFIG.mainBranch) {
    throw new Error(`Você deve estar na branch '${REPO_CONFIG.mainBranch}' para criar uma release. Branch atual: ${currentBranch}`);
  }
  
  // Atualiza tags do remoto
  await git.fetch(['--tags']);
  
  // Verifica se a tag já existe
  const allTags = await git.tags();
  if (allTags.all.includes(`v${newVersion}`)) {
    throw new Error(`A tag v${newVersion} já existe. Abortando.`);
  }
  
  // Verifica se há commits para release
  const lastTag = await getLastTag();
  if (lastTag) {
    const log = await git.log({ from: lastTag, to: "HEAD" });
    if (log.all.length === 0) {
      throw new Error(`Não há commits novos desde a última tag ${lastTag}`);
    }
  }
  
  console.log("   ✓ Verificações de segurança passaram");
}

/**
 * Cria commit, tag e faz push para o repositório
 */
async function createGitTag(newVersion) {
  const tagName = `v${newVersion}`;
  
  console.log(`🏷️  Criando tag ${tagName}...`);
  
  try {
    // Adiciona todos os arquivos modificados
    await git.add(".");
    
    // Verifica se há algo para commitar
    const status = await git.status();
    if (status.staged.length > 0) {
      await git.commit(`release: ${tagName}`);
      console.log(`   ✓ Commit criado: release: ${tagName}`);
    } else {
      console.log(`   ��️  Nenhuma alteração para commitar`);
    }
    
    // Cria a tag
    await git.addTag(tagName);
    console.log(`   ✓ Tag ${tagName} criada`);
    
    // Push do commit
    await git.push("origin", REPO_CONFIG.mainBranch);
    console.log(`   ✓ Commit enviado para ${REPO_CONFIG.mainBranch}`);
    
    // Push da tag
    await git.push("origin", tagName);
    console.log(`   ✓ Tag ${tagName} enviada`);
    
  } catch (error) {
    throw new Error(`Falha ao criar tag Git: ${error.message}`);
  }
}

/**
 * Cria release no GitHub e faz upload dos assets
 */
async function createRelease(octokit, newVersion, changelog) {
  console.log("🚀 Criando release no GitHub...");
  
  try {
    // Cria a release
    const releaseResponse = await octokit.repos.createRelease({
      owner: REPO_CONFIG.owner,
      repo: REPO_CONFIG.repo,
      tag_name: `v${newVersion}`,
      name: `v${newVersion}`,
      body: changelog,
      draft: false,
      prerelease: semver.prerelease(newVersion) !== null,
    });
    
    console.log(`   ✓ Release v${newVersion} criado: ${releaseResponse.data.html_url}`);

    // Upload dos assets
    const release_id = releaseResponse.data.id;
    const DIST_ZIPS_DIR = path.join(__dirname, "dist-zips");
    
    if (!await fs.pathExists(DIST_ZIPS_DIR)) {
      console.warn("   ⚠️  Diretório dist-zips não encontrado");
      return releaseResponse.data;
    }
    
    const zipFiles = (await fs.readdir(DIST_ZIPS_DIR)).filter(f => f.endsWith(".zip"));

    if (zipFiles.length === 0) {
      console.warn("   ⚠️  Nenhum arquivo .zip encontrado para upload");
      return releaseResponse.data;
    }

    console.log(`   📤 Fazendo upload de ${zipFiles.length} arquivo(s)...`);
    
    for (const file of zipFiles) {
      const filePath = path.join(DIST_ZIPS_DIR, file);
      const fileStats = await fs.stat(filePath);
      
      console.log(`      • ${file} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      await octokit.repos.uploadReleaseAsset({
        owner: REPO_CONFIG.owner,
        repo: REPO_CONFIG.repo,
        release_id,
        name: file,
        data: await fs.readFile(filePath),
      });
    }
    
    console.log("   ✅ Todos os arquivos foram enviados com sucesso");
    return releaseResponse.data;
    
  } catch (error) {
    if (error.status === 401) {
      throw new Error("Token GitHub inválido ou sem permissões. Verifique o GITHUB_TOKEN.");
    } else if (error.status === 403) {
      throw new Error("Sem permissão para criar releases. Verifique se o token tem escopo 'repo'.");
    } else {
      throw new Error(`Falha ao criar release: ${error.message}`);
    }
  }
}

/**
 * Função principal do processo de release
 */
async function main() {
  const startTime = Date.now();
  
  console.log("🚀 Iniciando processo de release...\n");
  
  try {
    // Validação de argumentos
    const newVersion = process.argv[2];
    if (!newVersion) {
      console.error("❌ Versão não especificada");
      console.error("   Uso: node release.js <versão>");
      console.error("   Exemplo: node release.js 1.2.3");
      process.exit(1);
    }
    
    // Validação de ambiente e versão
    console.log("🔧 Validando ambiente...");
    validateEnvironment();
    const cleanVersion = validateVersion(newVersion);
    console.log(`   ✓ Versão válida: ${cleanVersion}`);
    
    // Inicializa cliente GitHub
    const octokit = initializeGitHub();
    console.log("   ✓ Cliente GitHub inicializado");
    
    // Verificações de segurança
    await performSecurityChecks(cleanVersion);
    
    // Obtém informações para o changelog
    console.log("\n📋 Preparando changelog...");
    const lastTag = await getLastTag();
    if (lastTag) {
      console.log(`   ✓ Última tag encontrada: ${lastTag}`);
    } else {
      console.log("   ℹ️  Primeira release do projeto");
    }
    
    const changelog = await getChangelog(lastTag);
    console.log(`   ✓ Changelog gerado (${changelog.length} caracteres)`);
    
    // Atualiza versões nos manifests
    console.log("\n📝 Atualizando manifests...");
    await updateManifestVersion(cleanVersion);
    
    // Build do CSS
    console.log("\n🎨 Executando build do CSS...");
    await buildTailwind();
    
    // Build dos ZIPs
    console.log("\n📦 Executando build dos ZIPs...");
    await buildZips();
    
    // Cria tag no Git
    console.log("\n🏷️  Criando tag no Git...");
    await createGitTag(cleanVersion);
    
    // Cria release no GitHub
    console.log("\n🚀 Criando release no GitHub...");
    const releaseData = await createRelease(octokit, cleanVersion, changelog);
    
    // Sucesso!
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Release v${cleanVersion} criado com sucesso!`);
    console.log(`   ⏱️  Tempo total: ${duration}s`);
    console.log(`   🔗 URL: ${releaseData.html_url}`);
    console.log(`   📊 Assets: ${releaseData.assets?.length || 0} arquivo(s)`);
    
    // Próximos passos
    console.log(`\n📋 Próximos passos:`);
    console.log(`   • Verifique a release em: ${releaseData.html_url}`);
    console.log(`   • Teste os ZIPs baixados`);
    console.log(`   • Publique nas lojas de extensões se necessário`);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error(`\n❌ Falha no processo de release após ${duration}s:`);
    console.error(`   ${error.message}`);
    
    if (error.stack && process.env.DEBUG) {
      console.error(`\n🔍 Stack trace (DEBUG=true):`);
      console.error(error.stack);
    }
    
    console.error(`\n🔧 Possíveis soluções:`);
    console.error(`   • Verifique se o GITHUB_TOKEN está configurado corretamente`);
    console.error(`   • Confirme que não há modificações não commitadas`);
    console.error(`   • Verifique se a versão não já existe`);
    console.error(`   • Execute 'git fetch --tags' para atualizar tags`);
    
    process.exit(1);
  }
}

/**
 * Função de rollback em caso de falha parcial
 */
async function rollback(version) {
  console.log(`\n🔄 Executando rollback para v${version}...`);
  
  try {
    // Remove tag local se existir
    try {
      await git.tag(['-d', `v${version}`]);
      console.log(`   ✓ Tag local v${version} removida`);
    } catch (e) {
      console.log(`   ℹ️  Tag local v${version} não encontrada`);
    }
    
    // Remove tag remota se existir
    try {
      await git.push(['origin', '--delete', `v${version}`]);
      console.log(`   ✓ Tag remota v${version} removida`);
    } catch (e) {
      console.log(`   ℹ️  Tag remota v${version} não encontrada`);
    }
    
    console.log(`   ✅ Rollback concluído`);
    
  } catch (error) {
    console.error(`   ❌ Falha no rollback: ${error.message}`);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

// Exporta funções para uso em outros scripts
module.exports = {
  validateEnvironment,
  validateVersion,
  getLastTag,
  getChangelog,
  updateManifestVersion,
  buildTailwind,
  buildZips,
  performSecurityChecks,
  createGitTag,
  createRelease,
  rollback,
  main
};
