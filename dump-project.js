// Vuelca el codigo fuente relevante del proyecto en un unico archivo de texto plano.
// Ejecutar con: node dump-project.js   (desde la raiz del proyecto lego-inventory)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_FILE = path.join(ROOT, 'project-dump.txt');

const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'out', 'dist', '.vercel']);
const EXCLUDE_FILES = new Set(['project-dump.txt', 'dump-project.js', 'apply-foto-pieza.js', 'package-lock.json']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.pdf']);

const rootFilesToInclude = [
  'package.json', 'tsconfig.json', 'next.config.js', 'next.config.ts', 'next.config.mjs',
  'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js', 'postcss.config.mjs',
  '.eslintrc.json', '.eslintrc.js', 'vercel.json', 'middleware.ts', 'middleware.js',
];

let output = [];
let fileCount = 0;

function addFile(fullPath, relPath) {
  const ext = path.extname(fullPath).toLowerCase();
  const stat = fs.statSync(fullPath);
  if (BINARY_EXT.has(ext)) {
    output.push(`\n===== ${relPath} (binario, ${stat.size} bytes, no incluido) =====\n`);
    return;
  }
  if (stat.size > 200000) {
    output.push(`\n===== ${relPath} (${stat.size} bytes, DEMASIADO GRANDE, omitido) =====\n`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  output.push(`\n===== ${relPath} =====\n${content}\n`);
  fileCount++;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    if (EXCLUDE_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).split(path.sep).join('/');
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      addFile(fullPath, relPath);
    }
  }
}

// Archivos de configuracion en la raiz
for (const f of rootFilesToInclude) {
  const fullPath = path.join(ROOT, f);
  if (fs.existsSync(fullPath)) addFile(fullPath, f);
}

// Todo src/
const srcDir = path.join(ROOT, 'src');
if (fs.existsSync(srcDir)) walk(srcDir);

// Listado de public/ (solo nombres, sin contenido)
const publicDir = path.join(ROOT, 'public');
if (fs.existsSync(publicDir)) {
  output.push('\n===== public/ (solo listado de archivos) =====\n');
  function listPublic(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        listPublic(fullPath, prefix + entry.name + '/');
      } else {
        output.push(prefix + entry.name + '\n');
      }
    }
  }
  listPublic(publicDir, '');
}

fs.writeFileSync(OUT_FILE, output.join(''), 'utf-8');
console.log(`Listo. ${fileCount} archivos de texto volcados en project-dump.txt`);
console.log('Sube ese archivo (project-dump.txt) al chat.');
