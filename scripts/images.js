// npm run images: images-src/* -> src/assets/images/<name>-<width>.{avif,webp,jpg}
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'images-src';
const OUT = 'src/assets/images';

// Ширини залежать від типу зображення (префікс імені файлу).
// Вихідники невеликі (358px / 150px), тому ширші за оригінал версії не робимо:
// апскейл не додає якості, а лише збільшує розмір файлу.
const WIDTHS = {
  work: [240, 358],
  journal: [96, 150],
};

const QUALITY = { avif: 50, webp: 75, jpg: 78 };

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
let totalIn = 0;
let totalOut = 0;

for (const file of files) {
  const name = path.parse(file).name;
  const kind = name.split('-')[0];
  const widths = WIDTHS[kind] ?? [400, 800];
  const input = path.join(SRC, file);
  totalIn += (await stat(input)).size;

  for (const width of widths) {
    const base = sharp(input).resize({ width, withoutEnlargement: true });
    const jobs = {
      avif: base.clone().avif({ quality: QUALITY.avif }),
      webp: base.clone().webp({ quality: QUALITY.webp }),
      jpg: base.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true }),
    };
    for (const [ext, pipeline] of Object.entries(jobs)) {
      const target = path.join(OUT, `${name}-${width}.${ext}`);
      await pipeline.toFile(target);
      totalOut += (await stat(target)).size;
    }
  }
  console.log(`✓ ${file} -> ${widths.join('/')}px × avif, webp, jpg`);
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(
  `\nВихідники: ${kb(totalIn)} | Згенеровано (усі формати й ширини): ${kb(totalOut)}`,
);
