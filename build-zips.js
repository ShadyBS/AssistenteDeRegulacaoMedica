// build-zips.js
// Script para gerar ZIPs da extensão para Firefox e Chromium (Edge/Chrome)
// Requer: npm install archiver fs-extra

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const crypto = require("crypto");

const SRC_DIR = __dirname;
const OUT_DIR = path.join(__dirname, "dist-zips");

// Lista de arquivos e diretórios a serem ignorados no build
const FILES_TO_IGNORE = [
  // Diretórios de build e dependências
  "dist-zips",
  "src",
  "node_modules",
  ".git",
  ".vscode",
  
  // Scripts de build e release
  "build-zips.js",
  "build-zips.bat",
  "release.js",
  "build-release.bat",
  "rollback-release.bat",
  
  // Arquivos de configuração e desenvolvimento
  ".env",
  ".env.local",
  ".env.example",
  ".gitignore",
  "package-lock.json",
  "package.json",
  "tailwind.config.js",
  
  // Documentação
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  
  // Arquivos temporários e logs
  "*.log",
  "*.tmp",
  ".DS_Store",
  "Thumbs.db",
];

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
 * Verifica se um arquivo deve ser ignorado baseado nos padrões definidos
 */
function shouldIgnoreFile(fileName) {
  return FILES_TO_IGNORE.some(pattern => {
    if (pattern.includes('*')) {
      // Suporte básico para wildcards
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fileName);
    }
    return fileName === pattern;
  });
}

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
 * Cria um ZIP da extensão com validações e logs detalhados
 */
async function zipExtension({ zipName, manifestSource, target }) {
  console.log(`\n📦 Criando ZIP para ${target}...`);
  
  const zipPath = path.join(OUT_DIR, zipName);
  await fs.ensureDir(OUT_DIR);
  
  // Valida o manifest antes de começar
  const manifest = await validateManifest(manifestSource);
  console.log(`   ✓ Manifest validado: ${manifest.name} v${manifest.version}`);
  
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { 
    zlib: { level: 9 },
    comment: `${manifest.name} v${manifest.version} - ${target} build`
  });

  let fileCount = 0;
  
  return new Promise(async (resolve, reject) => {
    output.on("close", async () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`   ✓ ${zipName} criado: ${fileCount} arquivos, ${sizeInMB} MB`);
      
      // Gera hash do ZIP para verificação de integridade
      const zipHash = await generateFileHash(zipPath);
      console.log(`   ✓ SHA256: ${zipHash}`);
      
      resolve({ zipPath, hash: zipHash, size: archive.pointer() });
    });
    
    archive.on("error", (err) => {
      console.error(`   ❌ Erro ao criar ZIP: ${err.message}`);
      reject(err);
    });
    
    archive.on("warning", (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`   ⚠️  Arquivo não encontrado: ${err.path}`);
      } else {
        console.warn(`   ⚠️  Aviso: ${err.message}`);
      }
    });
    
    archive.pipe(output);

    try {
      // Adiciona todos os arquivos exceto os ignorados e os manifests específicos
      const files = await fs.readdir(SRC_DIR);
      
      for (const file of files) {
        if (shouldIgnoreFile(file)) {
          console.log(`   - Ignorando: ${file}`);
          continue;
        }
        
        // Ignora os arquivos de manifesto para serem adicionados especificamente depois
        const lowerCaseFile = file.toLowerCase();
        if (lowerCaseFile === "manifest.json" || lowerCaseFile === "manifest-edge.json") {
          continue;
        }
        
        const filePath = path.join(SRC_DIR, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            archive.directory(filePath, file);
            console.log(`   + Diretório: ${file}/`);
          } else {
            archive.file(filePath, { name: file });
            console.log(`   + Arquivo: ${file}`);
            fileCount++;
          }
        } catch (statError) {
          console.warn(`   ⚠️  Erro ao processar ${file}: ${statError.message}`);
        }
      }
      
      // Adiciona o manifest correto como manifest.json
      const manifestPath = path.join(SRC_DIR, manifestSource);
      archive.file(manifestPath, { name: "manifest.json" });
      console.log(`   + Manifest: ${manifestSource} → manifest.json`);
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
 * Gera relatório de build com informações detalhadas
 */
async function generateBuildReport(builds) {
  const reportPath = path.join(OUT_DIR, 'build-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    builds: builds,
    summary: {
      totalBuilds: builds.length,
      totalSize: builds.reduce((sum, build) => sum + build.size, 0)
    }
  };
  
  await fs.writeJson(reportPath, report, { spaces: 2 });
  console.log(`\n📋 Relatório de build salvo em: ${reportPath}`);
  
  return report;
}

/**
 * Função principal de build
 */
async function main() {
  console.log("🚀 Iniciando processo de build dos ZIPs...\n");
  
  const startTime = Date.now();
  const builds = [];
  
  try {
    // Prepara diretório de saída
    await fs.ensureDir(OUT_DIR);
    console.log(`📁 Diretório de saída: ${OUT_DIR}`);
    
    // Limpa arquivos ZIP antigos
    const oldFiles = await fs.readdir(OUT_DIR);
    const oldZips = oldFiles.filter(f => f.endsWith(".zip"));
    const oldReports = oldFiles.filter(f => f.endsWith(".json"));
    
    if (oldZips.length > 0) {
      console.log(`🧹 Removendo ${oldZips.length} ZIP(s) antigo(s)...`);
      for (const zip of oldZips) {
        await fs.remove(path.join(OUT_DIR, zip));
      }
    }
    
    if (oldReports.length > 0) {
      console.log(`🧹 Removendo ${oldReports.length} relatório(s) antigo(s)...`);
      for (const report of oldReports) {
        await fs.remove(path.join(OUT_DIR, report));
      }
    }

    // Valida que os CSS necessários existem
    const cssPath = path.join(SRC_DIR, "dist", "output.css");
    if (!await fs.pathExists(cssPath)) {
      console.warn("⚠️  Arquivo CSS não encontrado. Execute 'npm run build:css' primeiro.");
    }

    // Gera builds para cada target
    for (const [target, config] of Object.entries(BUILD_CONFIGS)) {
      try {
        const version = await getVersionFromManifest(config.manifestSource);
        const zipName = `${config.zipPrefix}-v${version}.zip`;
        
        const buildResult = await zipExtension({
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
    
    // Gera relatório de build
    await generateBuildReport(builds);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSizeMB = (builds.reduce((sum, build) => sum + build.size, 0) / 1024 / 1024).toFixed(2);
    
    console.log(`\n✅ Build concluído com sucesso!`);
    console.log(`   📊 ${builds.length} ZIP(s) criado(s) em ${duration}s`);
    console.log(`   📦 Tamanho total: ${totalSizeMB} MB`);
    console.log(`   📁 Localização: ${OUT_DIR}`);
    
    // Lista os arquivos criados
    console.log(`\n📋 Arquivos criados:`);
    for (const build of builds) {
      console.log(`   • ${build.zipName} (${build.target})`);
    }
    
  } catch (error) {
    console.error(`\n❌ Erro durante o build: ${error.message}`);
    
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
  zipExtension,
  validateManifest,
  getVersionFromManifest,
  generateBuildReport,
  BUILD_CONFIGS,
  main
};
