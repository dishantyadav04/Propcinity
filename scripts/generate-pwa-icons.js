const sharp = require('sharp');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

function pcIconSVG(size, { bg = '#FFFFFF', fg = 'PC', textColor = '#FFFFFF', border = true, borderRadius, fontSize, letterSpacing, borderSize } = {}) {
  const br = borderRadius ?? Math.round(size * 0.1875);
  const fs = fontSize ?? Math.round(size * 0.48);
  const ls = letterSpacing ?? -Math.round(size * 0.02);
  const bs = borderSize ?? Math.round(size * 0.03125);

  if (border) {
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${br}" fill="${bg}" stroke="#E5E5E5" stroke-width="${bs}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fs}" letter-spacing="${ls}">
    <tspan fill="#FF4500">P</tspan><tspan fill="#0D0D0D">C</tspan>
  </text>
</svg>`;
  }

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fs}" letter-spacing="${ls}"
        fill="${textColor}">
    ${fg}
  </text>
</svg>`;
}

async function main() {
  const tasks = [
    {
      file: 'icon-192.png',
      svg: pcIconSVG(192),
    },
    {
      file: 'icon-512.png',
      svg: pcIconSVG(512),
    },
    {
      file: 'icon-512-maskable.png',
      svg: pcIconSVG(512, {
        bg: '#FF4500',
        fg: 'PC',
        textColor: '#FFFFFF',
        border: false,
        borderRadius: 0,
        fontSize: Math.round(512 * 0.3125),
        letterSpacing: -Math.round(512 * 0.012),
      }),
    },
  ];

  for (const { file, svg } of tasks) {
    const out = path.join(PUBLIC, file);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`✓ ${file}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
