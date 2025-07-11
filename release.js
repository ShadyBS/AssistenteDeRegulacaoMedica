require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");

const git = simpleGit();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "SEU_USUARIO";
const repo = "SEU_REPOSITORIO";

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
      // Remove BOM se presente
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
  // Commit changes (se houver)
  await git.add(".");
  await git
    .commit(`release: v${newVersion}`)
    .catch(() => console.log("⚠️ Nenhum arquivo modificado para commit."));

  // Verificar existência da tag
  const tags = await git.tags();
  if (tags.all.includes(`v${newVersion}`)) {
    console.log(`⚠️ Tag v${newVersion} já existe, pulando criação de tag.`);
  } else {
    await git.addTag(`v${newVersion}`);
    await git.pushTags();
    console.log(`✅ Tag v${newVersion} criada e enviada.`);
  }

  // Push branch principal
  await git.push("origin", "main");
}

// Passo 7: Criar release no GitHub
async function createRelease(newVersion, changelog) {
  console.log("🚀 Criando release no GitHub...");
  await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: `v${newVersion}`,
    name: `v${newVersion}`,
    body: changelog,
    draft: false,
    prerelease: false,
  });
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

  const lastTag = await getLastTag();
  const changelog = await getChangelog(lastTag);

  updateManifestVersion(newVersion);
  buildTailwind();
  buildZips();
  await createGitTag(newVersion);
  await createRelease(newVersion, changelog);

  console.log(`✅ Release v${newVersion} criado com sucesso!`);
}

run();
