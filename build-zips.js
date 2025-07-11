// build-zips.js
// Script para gerar ZIPs da extensão para Firefox e Chromium (Edge/Chrome)
// Requer: npm install archiver fs-extra

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

const SRC_DIR = __dirname;
const OUT_DIR = path.join(__dirname, "dist-zips");
const FILES_TO_IGNORE = [
  "dist-zips",
  "src",
  "node_modules",
  "build-zips.js",
  "build-zips.bat",
  "release.js",
  ".env",
  "build-release.bat",
  ".gitignore",
  ".git",
  ".vscode",
  "package-lock.json",
  "package.json",
  "tailwind.config.js",
  "README.md",
];

async function zipExtension({ zipName, manifestSource }) {
  const zipPath = path.join(OUT_DIR, zipName);
  await fs.ensureDir(OUT_DIR);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    output.on("close", () => {
      console.log(`${zipName} gerado com ${archive.pointer()} bytes.`);
      resolve();
    });
    archive.on("error", reject);
    archive.pipe(output);

    // Adiciona todos os arquivos exceto os ignorados e os manifests específicos
    const files = await fs.readdir(SRC_DIR);
    for (const file of files) {
      if (FILES_TO_IGNORE.includes(file)) continue;
      // Ignora os arquivos de manifesto para serem adicionados especificamente depois, de forma case-insensitive
      const lowerCaseFile = file.toLowerCase();
      if (
        lowerCaseFile === "manifest.json" ||
        lowerCaseFile === "manifest-edge.json"
      )
        continue;
      const filePath = path.join(SRC_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        archive.directory(filePath, file);
      } else {
        archive.file(filePath, { name: file });
      }
    }
    // Adiciona o manifest correto como manifest.json
    archive.file(path.join(SRC_DIR, manifestSource), { name: "manifest.json" });
    archive.finalize();
  });
}

const getVersionFromManifest = async (manifestPath) => {
  const manifest = await fs.readJson(path.join(SRC_DIR, manifestPath));
  return manifest.version;
};

(async () => {
  try {
    // Limpa os arquivos ZIP antigos da pasta de saída
    await fs.ensureDir(OUT_DIR);
    const oldZips = (await fs.readdir(OUT_DIR)).filter((f) =>
      f.endsWith(".zip")
    );
    for (const zip of oldZips) {
      await fs.remove(path.join(OUT_DIR, zip));
    }

    const firefoxVersion = await getVersionFromManifest("manifest.json");
    const chromiumVersion = await getVersionFromManifest("manifest-edge.json");
    await zipExtension({
      zipName: `AssistenteDeRegulacao-firefox-v${firefoxVersion}.zip`,
      manifestSource: "manifest.json",
    });
    await zipExtension({
      zipName: `AssistenteDeRegulacao-chromium-v${chromiumVersion}.zip`,
      manifestSource: "manifest-edge.json",
    });
    console.log("ZIPs gerados em dist-zips/");
  } catch (e) {
    console.error("Erro ao gerar ZIPs:", e);
  }
})();
