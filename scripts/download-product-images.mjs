/**
 * Busca imagem pelo nome do produto no Google Images
 * e salva localmente em assets/images/products/
 * Rode: node scripts/download-product-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/images/products');

const PRODUCTS = [
  { file: '01-concrete-jungle', name: 'Camiseta Oversized CONCRETE JUNGLE streetwear' },
  { file: '02-skull-drip', name: 'Hoodie SKULL DRIP moletom preto streetwear' },
  { file: '03-cargo-tactical', name: 'Calça Cargo Tactical Preta streetwear' },
  { file: '04-rawstreet', name: 'Tênis de Skate RAWSTREET camurça' },
  { file: '05-noize-cap', name: 'Boné 5-Panel NOIZE snapback preto' },
  { file: '06-tie-dye', name: 'Camiseta Tie-Dye CHAOS streetwear' },
  { file: '07-night-runner', name: 'Jaqueta Corta-Vento NIGHT RUNNER preta refletiva' },
  { file: '08-cargo-bermuda', name: 'Bermuda Cargo Camuflada streetwear' },
  { file: '09-meias', name: 'Meia Cano Alto Listrada pack 3' },
  { file: '10-shoulder-bag', name: 'Shoulder Bag GRIND bolsa lateral preta' },
  { file: '11-crewneck', name: 'Moletom Crewneck STREETS DONT SLEEP preto' },
  { file: '12-raglan', name: 'Camiseta Raglan SKATE OR DIE manga 3/4' },
  { file: '13-jeans-baggy', name: 'Calça Jeans Baggy Destroyed preta' },
  { file: '14-bucket-hat', name: 'Bucket Hat WAVEZ preto streetwear' },
  { file: '15-pochete', name: 'Pochete TRAP nylon preta streetwear' },
  { file: '16-kit-camiseta', name: 'Kit Camisetas Básicas Oversized pack 3' },
  { file: '17-hoodie-zip', name: 'Hoodie Zip UNDERGROUND moletom preto' },
  { file: '18-short-tactel', name: 'Short Tactel FLOW preto streetwear' },
  { file: '19-high-top', name: 'Tênis High Top REVOLT chunky preto' },
  { file: '20-corrente', name: 'Corrente Prata CHAINS aço inox streetwear' },
  { file: '21-manga-longa', name: 'Camiseta Manga Longa NIGHTSHIFT preta' },
  { file: '22-bomber', name: 'Jaqueta Bomber RIOT nylon preta streetwear' },
  { file: '23-jogger', name: 'Calça Moletom Jogger LAZY DAYS preta' },
  { file: '24-dad-hat', name: 'Boné Dad Hat MINIMALIST preto' },
  { file: '25-bandana', name: 'Bandana Paisley Preta algodão' },
  { file: '26-racionais', name: 'Hoodie RACIONAIS 4P hip hop preto' },
  { file: '27-viela', name: 'Camiseta VIELA estampada streetwear' },
  { file: '28-ollie', name: 'Tênis Vulcanizado OLLIE canvas skate' },
  { file: '29-mochila', name: 'Mochila BACKSTREET cordura preta' },
  { file: '30-oculos', name: 'Óculos de Sol URBAN retangular preto' },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function isBadUrl(url) {
  return /pinimg\.com|pinterest|logo|icon|avatar|banner|sprite|emoji|\.svg|gstatic.*logo|favicon/i.test(url);
}

function decodeGoogleUrl(raw) {
  return raw
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');
}

function extractGoogleImageUrls(html) {
  const urls = [];
  for (const m of html.matchAll(/"ou":"(https:\\\/\\\/[^"]+)"/g)) {
    urls.push(decodeGoogleUrl(m[1]));
  }
  for (const m of html.matchAll(/\["(https?:\\\/\\\/[^"]+\.(?:jpg|jpeg|png|webp))",\d+,\d+\]/gi)) {
    urls.push(decodeGoogleUrl(m[1]));
  }
  return urls;
}

async function searchGoogleImages(query) {
  const res = await fetch(
    `https://www.google.com/search?q=${encodeURIComponent(query + ' product photo')}&tbm=isch&hl=pt-BR&ijn=0`,
    { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,en;q=0.9' } }
  );
  if (!res.ok) return null;

  const html = await res.text();
  for (const url of extractGoogleImageUrls(html)) {
    if (!isBadUrl(url)) return url;
  }
  return null;
}

async function searchDuckDuckGoImages(query) {
  const searchPage = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    { headers: { 'User-Agent': UA } }
  );
  const html = await searchPage.text();
  const vqd = html.match(/vqd=["']?([\d-]+)/)?.[1];
  if (!vqd) return null;

  const imgRes = await fetch(
    `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`,
    { headers: { 'User-Agent': UA, Referer: 'https://duckduckgo.com/' } }
  );
  const data = await imgRes.json();

  for (const r of (data.results || []).slice(0, 10)) {
    const url = r.image;
    if (!url || isBadUrl(url)) continue;
    return url;
  }
  return null;
}

async function searchImageUrl(query) {
  return (await searchGoogleImages(query)) || (await searchDuckDuckGoImages(query));
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: 'https://www.google.com/' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error('imagem muito pequena');
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Buscando imagens pelo nome de cada peça (Google Images)...\n');

  for (const item of PRODUCTS) {
    const dest = path.join(OUT, `${item.file}.jpg`);
    const query = item.name;
    try {
      const url = await searchImageUrl(query);
      if (!url) throw new Error('nenhum resultado');
      await downloadImage(url, dest);
      console.log(`OK  ${item.file}`);
      console.log(`    busca: "${query}"`);
      console.log(`    url: ${url.slice(0, 90)}...\n`);
    } catch (e) {
      console.warn(`FAIL ${item.file}: ${e.message}\n`);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('Concluído.');
}

main();
