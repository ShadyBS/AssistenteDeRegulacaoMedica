// build-zips-clean.js
// Script LIMPO para gerar ZIPs da extensão APENAS com arquivos essenciais
// Usa abordagem de WHITELIST para máxima segurança

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const crypto = require("crypto");

const SRC_DIR = __dirname;
const OUT_DIR = path.join(__dirname, "dist-zips");

// WHITELIST: Arquivos PERMITIDOS na extensão (apenas o essencial)
const EXTENSION_FILES = [
  // Core da extensão (obrigatórios)
  "background.js",
  "content-script.js",
  "sidebar.js",
  "sidebar.html",
  "options.js",
  "options.html",

  // APIs e utilitários essenciais
  "api.js",
  "api-constants.js",
  "utils.js",
  "validation.js",
  "store.js",
  "config.js",
  "renderers.js",
  "logger.js",
  "test-logger.js",

  // Managers necessários para funcionamento
  "MemoryManager.js",
  "KeepAliveManager.js",
  "SectionManager.js",
  "TimelineManager.js",

  // Parsers e configurações específicas
  "consultation-parser.js",
  "field-config.js",
  "filter-config.js",

  // Utilitários de segurança
  "crypto-utils.js",
  "BrowserAPI.js",

  // Polyfills para compatibilidade
  "browser-polyfill.js",

  // Páginas de ajuda
  "help.html",
  "help.js"
];

// Diretórios permitidos com filtros específicos
const ALLOWED_DIRECTORIES = {
  "icons": (file) => /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(file),
  "dist": (file) => file === "output.css" || /\.(css|js)$/i.test(file),
  "ui": (file) => /\.(js|html|css)$/i.test(file)
};

// Configurações para diferentes targets
const BUILD_CONFIGS = {
  firefox: {
    manifestSource: "manifest.json",
    zipPrefix: "AssistenteDeRegulacao-firefox",
    description: "Firefox/Mozilla"
  },
  chromium: {
    manifestSource: "manifest-edge.json",
    zipPrefix: "AssistenteDeRegulacao-chromium",
    description: "Chrome/Edge/Chromium"
  }
};

/**
 * Valida se o manifest existe e tem estrutura válida
 */
async function validateManifest(manifestPath) {
  const fullPath = path.join(SRC_DIR, manifestPath);

  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Manifest não encontrado: ${manifestPath}`);
  }

  try {
    const manifest = await fs.readJson(fullPath);

    if (!manifest.version) {
      throw new Error(`Versão não encontrada no manifest: ${manifestPath}`);
    }

    if (!manifest.name) {
      throw new Error(`Nome não encontrado no manifest: ${manifestPath}`);
    }

    // Validação básica de formato de versão (semver)
    const versionRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?$/;
    if (!versionRegex.test(manifest.version)) {
      throw new Error(`Formato de versão inválido no ${manifestPath}: ${manifest.version}`);
    }

    return manifest;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON inválido no manifest ${manifestPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Gera hash SHA256 de um arquivo para verificação de integridade
 */
async function generateFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Adiciona arquivos de um diretório com filtro
 */
async function addDirectoryWithFilter(archive, dirPath, dirName, filter) {
  let fileCount = 0;
  let skippedCount = 0;

  if (!await fs.pathExists(dirPath)) {
    console.log(`   ⚠️  Diretório não encontrado: ${dirName}`);
    return { fileCount, skippedCount };
  }

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      const isAllowed = filter(file);

      if (isAllowed) {
        archive.file(filePath, { name: `${dirName}/${file}` });
        console.log(`   + ${dirName}/${file}`);
        fileCount++;
      } else {
        console.log(`   - Filtrado: ${dirName}/${file}`);
        skippedCount++;
      }
    } else if (stats.isDirectory()) {
      // Processa subdiretórios recursivamente
      const subFiles = await fs.readdir(filePath);

      for (const subFile of subFiles) {
        const subFilePath = path.join(filePath, subFile);
        const subStats = await fs.stat(subFilePath);

        if (subStats.isFile()) {
          const isAllowed = filter(subFile);

          if (isAllowed) {
            archive.file(subFilePath, { name: `${dirName}/${file}/${subFile}` });
            console.log(`   + ${dirName}/${file}/${subFile}`);
            fileCount++;
          } else {
            console.log(`   - Filtrado: ${dirName}/${file}/${subFile}`);
            skippedCount++;
          }
        }
      }
    }
  }

  return { fileCount, skippedCount };
}

/**
 * Cria um ZIP LIMPO da extensão com APENAS arquivos essenciais
 */
async function zipExtensionClean({ zipName, manifestSource, target }) {
  console.log(`\n��� Criando ZIP LIMPO para ${target}...`);

  const zipPath = path.join(OUT_DIR, zipName);
  await fs.ensureDir(OUT_DIR);

  // Valida o manifest antes de começar
  const manifest = await validateManifest(manifestSource);
  console.log(`   ✓ Manifest validado: ${manifest.name} v${manifest.version}`);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", {
    zlib: { level: 9 },
    comment: `${manifest.name} v${manifest.version} - ${target} build (CLEAN)`
  });

  let fileCount = 0;
  let skippedCount = 0;

  return new Promise(async (resolve, reject) => {
    output.on("close", async () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`   ✓ ${zipName} criado: ${fileCount} arquivos, ${sizeInMB} MB`);
      console.log(`   📊 ${skippedCount} arquivos não essenciais excluídos`);

      // Gera hash do ZIP para verificação de integridade
      const zipHash = await generateFileHash(zipPath);
      console.log(`   ✓ SHA256: ${zipHash}`);

      resolve({ zipPath, hash: zipHash, size: archive.pointer(), fileCount, skippedCount });
    });

    archive.on("error", (err) => {
      console.error(`   ❌ Erro ao criar ZIP: ${err.message}`);
      reject(err);
    });

    archive.pipe(output);

    try {
      console.log(`   🔍 Aplicando whitelist de arquivos essenciais...`);

      // Adiciona APENAS arquivos individuais permitidos
      for (const fileName of EXTENSION_FILES) {
        const filePath = path.join(SRC_DIR, fileName);

        if (await fs.pathExists(filePath)) {
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            archive.file(filePath, { name: fileName });
            console.log(`   + ${fileName}`);
            fileCount++;
          }
        } else {
          console.log(`   ⚠️  Arquivo não encontrado: ${fileName}`);
          skippedCount++;
        }
      }

      // Adiciona diretórios permitidos com filtros
      for (const [dirName, filter] of Object.entries(ALLOWED_DIRECTORIES)) {
        const dirPath = path.join(SRC_DIR, dirName);
        const result = await addDirectoryWithFilter(archive, dirPath, dirName, filter);
        fileCount += result.fileCount;
        skippedCount += result.skippedCount;
      }

      // Adiciona o manifest correto como manifest.json
      const manifestPath = path.join(SRC_DIR, manifestSource);
      archive.file(manifestPath, { name: "manifest.json" });
      console.log(`   + manifest.json (${manifestSource})`);
      fileCount++;

      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtém versão do manifest com validação
 */
async function getVersionFromManifest(manifestPath) {
  const manifest = await validateManifest(manifestPath);
  return manifest.version;
}

/**
 * Gera relatório de build limpo com informações detalhadas
 */
async function generateCleanBuildReport(builds) {
  const reportPath = path.join(OUT_DIR, 'build-report-clean.json');
  const report = {
    timestamp: new Date().toISOString(),
    buildType: "clean",
    whitelist: {
      files: EXTENSION_FILES,
      directories: Object.keys(ALLOWED_DIRECTORIES)
    },
    builds: builds,
    summary: {
      totalBuilds: builds.length,
      totalSize: builds.reduce((sum, build) => sum + build.size, 0),
      totalFiles: builds.reduce((sum, build) => sum + build.fileCount, 0),
      totalSkipped: builds.reduce((sum, build) => sum + build.skippedCount, 0),
      averageSize: builds.length > 0 ? builds.reduce((sum, build) => sum + build.size, 0) / builds.length : 0,
      sizeSavings: "Apenas arquivos essenciais incluídos"
    }
  };

  await fs.writeJson(reportPath, report, { spaces: 2 });
  console.log(`\n📋 Relatório de build limpo salvo em: ${reportPath}`);

  return report;
}

/**
 * Função principal de build limpo
 */
async function main() {
  console.log("🚀 Iniciando processo de build LIMPO dos ZIPs...");
  console.log("📋 Usando abordagem de WHITELIST - apenas arquivos essenciais\n");

  const startTime = Date.now();
  const builds = [];

  try {
    // Prepara diretório de saída
    await fs.ensureDir(OUT_DIR);
    console.log(`📁 Diretório de saída: ${OUT_DIR}`);

    // Remove ZIPs antigos
    const oldFiles = await fs.readdir(OUT_DIR);
    const oldZips = oldFiles.filter(f => f.endsWith(".zip"));

    if (oldZips.length > 0) {
      console.log(`🧹 Removendo ${oldZips.length} ZIP(s) antigo(s)...`);
      for (const zip of oldZips) {
        await fs.remove(path.join(OUT_DIR, zip));
      }
    }

    // Valida que os CSS necessários existem
    const cssPath = path.join(SRC_DIR, "dist", "output.css");
    if (!await fs.pathExists(cssPath)) {
      console.warn("⚠️  Arquivo CSS não encontrado. Execute 'npm run build:css' primeiro.");
    }

    // Mostra whitelist aplicada
    console.log(`\n📋 Whitelist de arquivos essenciais:`);
    console.log(`   📄 Arquivos: ${EXTENSION_FILES.length} permitidos`);
    console.log(`   📁 Diretórios: ${Object.keys(ALLOWED_DIRECTORIES).length} com filtros`);

    // Gera builds limpos para cada target
    for (const [target, config] of Object.entries(BUILD_CONFIGS)) {
      try {
        const version = await getVersionFromManifest(config.manifestSource);
        const zipName = `${config.zipPrefix}-v${version}.zip`;

        const buildResult = await zipExtensionClean({
          zipName,
          manifestSource: config.manifestSource,
          target: config.description
        });

        builds.push({
          target,
          version,
          zipName,
          manifestSource: config.manifestSource,
          ...buildResult
        });

      } catch (error) {
        console.error(`❌ Falha no build para ${target}: ${error.message}`);
        throw error;
      }
    }

    // Gera relatório de build limpo
    await generateCleanBuildReport(builds);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSizeMB = (builds.reduce((sum, build) => sum + build.size, 0) / 1024 / 1024).toFixed(2);
    const totalSkipped = builds.reduce((sum, build) => sum + build.skippedCount, 0);

    console.log(`\n✅ Build LIMPO concluído com sucesso!`);
    console.log(`   📊 ${builds.length} ZIP(s) criado(s) em ${duration}s`);
    console.log(`   📦 Tamanho total: ${totalSizeMB} MB`);
    console.log(`   🗑️  ${totalSkipped} arquivos não essenciais excluídos`);
    console.log(`   📁 Localização: ${OUT_DIR}`);

    // Lista os arquivos criados
    console.log(`\n📋 Arquivos criados (LIMPOS):`);
    for (const build of builds) {
      console.log(`   • ${build.zipName} (${build.target}) - ${build.fileCount} arquivos`);
    }

    console.log(`\n💾 Otimizações aplicadas:`);
    console.log(`   ✓ Apenas arquivos essenciais incluídos`);
    console.log(`   ✓ Arquivos de desenvolvimento excluídos`);
    console.log(`   ✓ Documentação e testes removidos`);
    console.log(`   ✓ Configurações de build filtradas`);
    console.log(`   ✓ Relatórios e logs excluídos`);
    console.log(`   ✓ Scripts de build removidos`);
    console.log(`   ✓ Arquivos de configuração de desenvolvimento filtrados`);

  } catch (error) {
    console.error(`\n❌ Erro durante o build limpo: ${error.message}`);

    if (error.stack) {
      console.error(`\n🔍 Stack trace:`);
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

// Exporta funções para uso em outros scripts
module.exports = {
  zipExtensionClean,
  validateManifest,
  getVersionFromManifest,
  generateCleanBuildReport,
  BUILD_CONFIGS,
  EXTENSION_FILES,
  ALLOWED_DIRECTORIES,
  main
};
