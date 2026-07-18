import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';

const faviconPath = './src/assets/icons/favicon.svg';

if (!existsSync(faviconPath)) {
  console.error(`ფაილი ვერ მოიძებნა: ${faviconPath}`);
  process.exit(1);
}

const faviconSvg = readFileSync(faviconPath);
console.log('პირველი 100 სიმბოლო:', faviconSvg.toString('utf8').slice(0, 100));

try {
  await sharp(faviconSvg).resize(192, 192).png().toFile('./src/assets/icons/icon-192x192.png');
  await sharp(faviconSvg).resize(512, 512).png().toFile('./src/assets/icons/icon-512x512.png');
  console.log('icon-192x192.png და icon-512x512.png შექმნილია!');
} catch (err) {
  console.error('Sharp ჩავარდა favicon.svg-ზე:', err.message);
}