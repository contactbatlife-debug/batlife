// scripts/generate-og-images.js
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const fontBoldPath = path.join(__dirname, 'fonts', 'Poppins-Bold.ttf');
const fontRegularPath = path.join(__dirname, 'fonts', 'Poppins-Regular.ttf');
const logoPath = path.join(__dirname, '../public', 'logo.png');

try {
  registerFont(fontBoldPath, { family: 'Poppins', weight: 'bold' });
  registerFont(fontRegularPath, { family: 'Poppins', weight: 'normal' });
} catch (e) {
  console.warn("⚠️ Polices personnalisées ignorées.");
}

const width = 1200;
const height = 630;

const languages = {
  fr: { title: "BatLife", subtitle: "Prolongez la durée de vie de votre batterie." },
  en: { title: "BatLife", subtitle: "Extend your battery lifespan." },
  es: { title: "BatLife", subtitle: "Prolonga la vida útil de su batería." },
  de: { title: "BatLife", subtitle: "Verlängern Sie die Lebensdauer Ihrer Batterie." },
};

function drawRoundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function generate(lang) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond bleu nuit
  ctx.fillStyle = '#0a1428';   
  ctx.fillRect(0, 0, width, height);

  // Halo lumineux émeraude
  const glow = ctx.createRadialGradient(width / 2, 200, 10, width / 2, 200, 400);
  glow.addColorStop(0, 'rgba(52, 211, 153, 0.18)');
  glow.addColorStop(1, 'rgba(10, 20, 40, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Logo batterie (plus grand et plus haut)
  const logoSize = 220;
  const logoY = 60;
  try {
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, width / 2 - logoSize / 2, logoY, logoSize, logoSize);
  } catch (e) {
    console.warn("⚠️ logo.png introuvable dans public/.");
    ctx.font = '160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔋', width / 2, logoY + logoSize / 2);
  }

  // Titre avec dégradé vert -> bleu
  ctx.font = 'bold 96px "Poppins", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const textWidth = ctx.measureText(languages[lang].title).width;
  const textGradient = ctx.createLinearGradient(
    width / 2 - textWidth / 2, 0,
    width / 2 + textWidth / 2, 0
  );
  textGradient.addColorStop(0, '#4ade80');
  textGradient.addColorStop(0.5, '#34d399');
  textGradient.addColorStop(1, '#3b82f6');

  ctx.fillStyle = textGradient;
  ctx.fillText(languages[lang].title, width / 2, 310);

  // Sous-titre (plus fin)
  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px "Poppins", Arial';
  ctx.fillText(languages[lang].subtitle, width / 2, 440);

  // Badge URL (bleu clair)
  const badgeWidth = 240;
  const badgeHeight = 54;
  ctx.fillStyle = '#152642';
  drawRoundRect(ctx, width / 2 - badgeWidth / 2, 540, badgeWidth, badgeHeight, 27);
  ctx.fill();

  ctx.strokeStyle = '#1f3460';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 22px "Poppins", Arial';
  ctx.textBaseline = 'middle';
  ctx.fillText('batlife.app', width / 2, 540 + badgeHeight / 2);

  // Sauvegarde
  const outputPath = path.join(__dirname, '../public', `og-image-${lang}.jpg`);
  const buffer = canvas.toBuffer('image/jpeg', { quality: 1 });
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ og-image-${lang}.jpg généré avec succès !`);
}

async function run() {
  for (const lang of Object.keys(languages)) {
    await generate(lang);
  }
}

run();