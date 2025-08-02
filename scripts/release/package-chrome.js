import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function packageChrome() {
  console.log('📦 Starting Chrome packaging...');

  const srcDir = path.resolve(__dirname, '../../');
  const outputDir = path.resolve(__dirname, '../../dist-zips');

  // Files to ignore (same as legacy script)
  const FILES_TO_IGNORE = [
    'dist-zips',
    'src',
    'node_modules',
    'build-zips.js',
    'build-zips.bat',
    'release.js',
    '.env',
    'build-release.bat',
    'rollback-release.bat',
    '.gitignore',
    '.git',
    '.vscode',
    'package-lock.json',
    'package.json',
    'tailwind.config.js',
    'README.md',
    'config',
    'coverage',
    'dist',
    'scripts',
    'test',
    'security',
    '.docs',
    '.copilot-instructions',
    '.github',
    '.htmlhintignore',
    '.htmlhintrc',
    '.husky',
    '.misc',
    '.prettierignore',
    '.prettierrc',
    '.qodo',
    '.stylelintrc.json',
    'AssistenteDeRegulacao.code-workspace',
    'build-release.bat',
    'eslint.config.js',
    'postcss.config.cjs',
    'PIPELINE_SUMMARY.md',
    'CHANGELOG.md',
    'agents.md',
    'ErrorHandler-Demo.js',
    '.babelrc.cjs',
  ];

  const manifest = await fs.readJson(path.join(srcDir, 'manifest-edge.json'));
  const version = manifest.version;

  console.log(`📋 Version: ${version}`);

  await fs.ensureDir(outputDir);

  const zipPath = path.join(outputDir, `AssistenteDeRegulacao-chrome-v${version}.zip`); // Remove existing file if exists
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Chrome package created: ${zipPath}`);
      console.log(`   Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    (async () => {
      try {
        console.log('📁 Adding files to archive...');
        const files = await fs.readdir(srcDir);

        for (const file of files) {
          if (FILES_TO_IGNORE.includes(file)) continue;

          // Skip manifest files - will be added specifically
          const lowerCaseFile = file.toLowerCase();
          if (
            lowerCaseFile === 'manifest.json' ||
            lowerCaseFile === 'manifest-edge.json' ||
            lowerCaseFile === 'manifest-firefox.json'
          )
            continue;

          const filePath = path.join(srcDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isDirectory()) {
            archive.directory(filePath, file);
          } else {
            archive.file(filePath, { name: file });
          }
        }

        // Add correct manifest as manifest.json (Chrome uses manifest-edge.json for V3)
        archive.file(path.join(srcDir, 'manifest-edge.json'), { name: 'manifest.json' });

        // Add compiled CSS if exists
        const cssPath = path.join(srcDir, 'dist', 'output.css');
        if (await fs.pathExists(cssPath)) {
          archive.file(cssPath, { name: 'dist/output.css' });
          console.log('📎 Added compiled CSS');
        }

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

console.log('🚀 Chrome packaging script starting...');
packageChrome().catch((error) => {
  console.error('❌ Chrome packaging failed:', error);
  process.exit(1);
});
