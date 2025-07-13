require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");

const git = simpleGit();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "ShadyBS";
const repo = "AssistenteDeRegulacaoMedica";

// Passo 1: Obter a última tag
async function getLastTag() {
  const tags = await git.tags();
  return tags.latest;
}

// Passo 2: Gerar changelog desde a última tag
async function getChangelog(fromTag) {
  const log = await git.log({ from: fromTag, to: "HEAD" });
  return log.all.map((entry) => `- ${entry.message}`).join("\n");
}

// Passo 3: Atualizar manifests (remove BOM e atualiza versão)
function updateManifestVersion(newVersion) {
  const files = ["manifest.json", "manifest-edge.json"];
  files.forEach((file) => {
    const manifestPath = path.join(__dirname, file);
    if (!fs.existsSync(manifestPath)) {
      console.warn(`⚠️ Arquivo não encontrado: ${file}`);
      return;
    }
    try {
      let content = fs.readFileSync(manifestPath, "utf8");
      content = content.replace(/^\uFEFF/, "");
      const manifest = JSON.parse(content);
      manifest.version = newVersion;
      fs.writeFileSync(
        manifestPath,
        JSON.stringify(manifest, null, 2) + "\n",
        "utf8"
      );
      console.log(`✅ Atualizado ${file} para versão ${newVersion}`);
    } catch (err) {
      console.error(`❌ Erro ao processar ${file}:`, err.message);
    }
  });
}

// Passo 4: Rodar build com Tailwind
function buildTailwind() {
  console.log("🎨 Gerando CSS com Tailwind...");
  execSync("npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify", {
    stdio: "inherit",
  });
}

// Passo 5: Gerar zips
function buildZips() {
  console.log("📦 Gerando ZIPs...");
  execSync("node build-zips.js", { stdio: "inherit" });
}

// Passo 6: Commit, tag e push no Git
async function createGitTag(newVersion) {
  const tagName = `v${newVersion}`;
  await git.add(".");
  // O commit falhará se não houver nada para commitar, o que é bom.
  await git.commit(`release: ${tagName}`);
  // A criação da tag falhará se ela já existir, o que também é bom.
  await git.addTag(tagName);
  await git.push("origin", "main");
  // Faz o push da tag específica
  await git.push("origin", tagName);
  console.log(`✅ Commit e tag ${tagName} criados e enviados.`);
}

// Passo 7: Criar release no GitHub e fazer upload dos ZIPs
async function createRelease(newVersion, changelog) {
  console.log("🚀 Criando release no GitHub...");
  try {
    const releaseResponse = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: `v${newVersion}`,
      name: `v${newVersion}`,
      body: changelog,
      draft: false,
      prerelease: false,
    });
    console.log(`✅ Release v${newVersion} criado com sucesso!`);

    // Upload dos assets
    const release_id = releaseResponse.data.id;
    const DIST_ZIPS_DIR = path.join(__dirname, "dist-zips");
    const zipFiles = fs
      .readdirSync(DIST_ZIPS_DIR)
      .filter((f) => f.endsWith(".zip"));

    if (zipFiles.length === 0) {
      console.warn(
        "⚠️ Nenhum arquivo .zip encontrado em dist-zips para fazer upload."
      );
      return;
    }

    console.log("⬆️  Fazendo upload dos ZIPs para a release...");
    for (const file of zipFiles) {
      const filePath = path.join(DIST_ZIPS_DIR, file);
      console.log(`  -> Uploading ${file}...`);
      await octokit.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id,
        name: file,
        data: fs.readFileSync(filePath),
      });
    }
    console.log("✅ Todos os ZIPs foram enviados com sucesso.");
  } catch (err) {
    console.error(
      `❌ Falha ao criar release ou fazer upload de assets no GitHub: ${err.message}`
    );
    console.error(
      `→ Verifique se o GITHUB_TOKEN possui permissões de "contents: write" e se está configurado corretamente.`
    );
    process.exit(1);
  }
}

// Fluxo principal
async function run() {
  const newVersion = process.argv[2];
  if (!newVersion) {
    console.error(
      "⚠️ Você precisa passar a nova versão. Ex: node release.js 3.2.12"
    );
    process.exit(1);
  }

  // --- Verificações de segurança ---
  console.log("🔍 Executando verificações de segurança...");
  const status = await git.status();
  if (!status.isClean()) {
    console.error(
      "❌ Seu diretório de trabalho tem modificações não commitadas."
    );
    console.error(
      "   Faça o commit ou 'git stash' de suas alterações antes de criar uma release."
    );
    process.exit(1);
  }

  await git.fetch(["--tags"]);
  const allTags = await git.tags();
  if (allTags.all.includes(`v${newVersion}`)) {
    console.error(`❌ A tag v${newVersion} já existe. Abortando.`);
    process.exit(1);
  }
  console.log("✅ Verificações de segurança passaram.");

  const lastTag = await getLastTag();
  const changelog = await getChangelog(lastTag);
  updateManifestVersion(newVersion);
  buildTailwind();
  buildZips();
  await createGitTag(newVersion);
  await createRelease(newVersion, changelog);
}

run();
