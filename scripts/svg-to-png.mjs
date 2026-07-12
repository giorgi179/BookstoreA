import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./src/assets/og-image.svg');
await sharp(svg).resize(1200, 630).png().toFile('./src/assets/og-image.png');
console.log('og-image.png შექმნილია!');

const faviconSvg = readFileSync('./src/assets/icons/favicon.svg');
await sharp(faviconSvg).resize(192, 192).png().toFile('./src/assets/icons/icon-192x192.png');
await sharp(faviconSvg).resize(512, 512).png().toFile('./src/assets/icons/icon-512x512.png');
console.log('icon-192x192.png და icon-512x512.png შექმნილია!');