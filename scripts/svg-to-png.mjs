import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./src/assets/og-image.svg');
await sharp(svg).resize(1200, 630).png().toFile('./src/assets/og-image.png');
console.log('og-image.png შექმნილია!');
