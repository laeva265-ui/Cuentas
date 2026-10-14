const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function makePng(w, h, rgbaFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const raw = Buffer.alloc(h * (1 + w * 4));
  let pos = 0;
  for (let y = 0; y < h; y++) {
    raw[pos++] = 0; // Filter None
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = rgbaFn(x, y, w, h);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(raw));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Icon design: Navy blue gradient with gold bank landmark
function drawBankIcon(x, y, w, h) {
  const nx = x / w; // 0 to 1
  const ny = y / h; // 0 to 1

  // Background: Rounded rect with navy gradient (#0B1A2E to #1A3A5C)
  const cornerRadius = 0.22;
  const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerRadius));
  const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerRadius));
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside rounded corner
  }

  // Base navy background gradient
  let r = Math.round(11 + 15 * nx + 10 * ny);  // ~11 to 26
  let g = Math.round(26 + 32 * nx + 25 * ny);  // ~26 to 58
  let b = Math.round(46 + 46 * nx + 40 * ny);  // ~46 to 92
  let a = 255;

  // Gold accent colors: #D4A853 (212, 168, 83) & #E8C374 (232, 195, 116)
  const goldR = 212, goldG = 168, goldB = 83;
  const lightGoldR = 238, lightGoldG = 205, lightGoldB = 126;

  // Outer gold rim border (around rounded rect)
  if (dist > cornerRadius - 0.025) {
    const rimFactor = (dist - (cornerRadius - 0.025)) / 0.025;
    return [
      Math.round(goldR * rimFactor + r * (1 - rimFactor)),
      Math.round(goldG * rimFactor + g * (1 - rimFactor)),
      Math.round(goldB * rimFactor + b * (1 - rimFactor)),
      255
    ];
  }

  // Center Bank Emblem:
  // Coordinates relative to center (0.5, 0.5)
  const cx = nx - 0.5;
  const cy = ny - 0.5;

  // 1. Triangular Roof (Pediment):
  // Peak at (0, -0.26), base from (-0.30, -0.12) to (0.30, -0.12)
  if (cy >= -0.27 && cy <= -0.12) {
    const halfWidthAtY = 0.30 * ((cy - (-0.27)) / 0.15);
    if (Math.abs(cx) <= halfWidthAtY) {
      return [goldR, goldG, goldB, 255];
    }
  }

  // Roof cornice / architrave line:
  if (cy >= -0.12 && cy <= -0.08 && Math.abs(cx) <= 0.31) {
    return [lightGoldR, lightGoldG, lightGoldB, 255];
  }

  // 2. Pillars (4 vertical columns):
  // cy between -0.06 and +0.16
  // Pillars centered at cx = -0.21, -0.07, +0.07, +0.21, width = 0.055
  if (cy >= -0.06 && cy <= 0.16) {
    const p1 = Math.abs(cx - (-0.21)) <= 0.032;
    const p2 = Math.abs(cx - (-0.07)) <= 0.032;
    const p3 = Math.abs(cx - (+0.07)) <= 0.032;
    const p4 = Math.abs(cx - (+0.21)) <= 0.032;
    if (p1 || p2 || p3 || p4) {
      return [goldR, goldG, goldB, 255];
    }
  }

  // 3. Base steps (Stylobate):
  // Step 1: cy between 0.17 and 0.21, width 0.33
  if (cy >= 0.17 && cy <= 0.21 && Math.abs(cx) <= 0.33) {
    return [lightGoldR, lightGoldG, lightGoldB, 255];
  }
  // Step 2: cy between 0.22 and 0.26, width 0.36
  if (cy >= 0.22 && cy <= 0.26 && Math.abs(cx) <= 0.36) {
    return [goldR, goldG, goldB, 255];
  }

  // Small gold star/circle in pediment center:
  const pedDist = Math.hypot(cx, cy - (-0.17));
  if (pedDist <= 0.028) {
    return [lightGoldR, lightGoldG, lightGoldB, 255];
  }

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192 PNG
const png192 = makePng(192, 192, drawBankIcon);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
console.log('Generated icon-192.png (' + png192.length + ' bytes)');

// Generate 512x512 PNG
const png512 = makePng(512, 512, drawBankIcon);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
console.log('Generated icon-512.png (' + png512.length + ' bytes)');

// Generate Apple Touch Icon 180x180 PNG
const png180 = makePng(180, 180, drawBankIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
console.log('Generated apple-touch-icon.png (' + png180.length + ' bytes)');

// Generate vector SVG icon & favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1A2E"/>
      <stop offset="50%" stop-color="#122B4A"/>
      <stop offset="100%" stop-color="#1A3A5C"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E4B5"/>
      <stop offset="50%" stop-color="#D4A853"/>
      <stop offset="100%" stop-color="#B88A32"/>
    </linearGradient>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.1"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  
  <!-- App Icon Base -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="url(#gold)" stroke-width="6" opacity="0.85"/>
  
  <!-- Bank Landmark Emblem -->
  <g filter="url(#shadow)" transform="translate(256, 256)">
    <!-- Roof / Pediment -->
    <path d="M 0,-140 L 160,-55 L -160,-55 Z" fill="url(#gold)"/>
    <!-- Architrave / Cornice -->
    <rect x="-165" y="-55" width="330" height="22" rx="4" fill="url(#gold)"/>
    <rect x="-165" y="-55" width="330" height="11" fill="url(#goldLight)"/>
    
    <!-- 4 Columns -->
    <rect x="-135" y="-20" width="38" height="115" rx="5" fill="url(#gold)"/>
    <rect x="-53" y="-20" width="38" height="115" rx="5" fill="url(#gold)"/>
    <rect x="15" y="-20" width="38" height="115" rx="5" fill="url(#gold)"/>
    <rect x="97" y="-20" width="38" height="115" rx="5" fill="url(#gold)"/>
    
    <!-- Base Steps -->
    <rect x="-175" y="102" width="350" height="24" rx="4" fill="url(#gold)"/>
    <rect x="-175" y="102" width="350" height="12" fill="url(#goldLight)"/>
    <rect x="-190" y="130" width="380" height="28" rx="6" fill="url(#gold)"/>
    
    <!-- Gold Medallion in Pediment -->
    <circle cx="0" cy="-85" r="16" fill="#0B1A2E"/>
    <circle cx="0" cy="-85" r="12" fill="url(#gold)"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
console.log('Generated icon.svg & favicon.svg successfully');
