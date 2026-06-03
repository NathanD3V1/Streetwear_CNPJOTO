// Imagens streetwear — buscadas pelo nome (Google) e servidas localmente
const IMG = (file) => `assets/images/products/${file}.jpg`;

export const PRODUCT_IMAGES = {
  'a1000001-0000-4000-8000-000000000001': IMG('01-concrete-jungle'),
  'a1000001-0000-4000-8000-000000000002': IMG('02-skull-drip'),
  'a1000001-0000-4000-8000-000000000003': IMG('03-cargo-tactical'),
  'a1000001-0000-4000-8000-000000000004': IMG('04-rawstreet'),
  'a1000001-0000-4000-8000-000000000005': IMG('05-noize-cap'),
  'a1000001-0000-4000-8000-000000000006': IMG('06-tie-dye'),
  'a1000001-0000-4000-8000-000000000007': IMG('07-night-runner'),
  'a1000001-0000-4000-8000-000000000008': IMG('08-cargo-bermuda'),
  'a1000001-0000-4000-8000-000000000009': IMG('09-meias'),
  'a1000001-0000-4000-8000-000000000010': IMG('10-shoulder-bag'),
  'a1000001-0000-4000-8000-000000000011': IMG('11-crewneck'),
  'a1000001-0000-4000-8000-000000000012': IMG('12-raglan'),
  'a1000001-0000-4000-8000-000000000013': IMG('13-jeans-baggy'),
  'a1000001-0000-4000-8000-000000000014': IMG('14-bucket-hat'),
  'a1000001-0000-4000-8000-000000000015': IMG('15-pochete'),
  'a1000001-0000-4000-8000-000000000016': IMG('16-kit-camiseta'),
  'a1000001-0000-4000-8000-000000000017': IMG('17-hoodie-zip'),
  'a1000001-0000-4000-8000-000000000018': IMG('18-short-tactel'),
  'a1000001-0000-4000-8000-000000000019': IMG('19-high-top'),
  'a1000001-0000-4000-8000-000000000020': IMG('20-corrente'),
  'a1000001-0000-4000-8000-000000000021': IMG('21-manga-longa'),
  'a1000001-0000-4000-8000-000000000022': IMG('22-bomber'),
  'a1000001-0000-4000-8000-000000000023': IMG('23-jogger'),
  'a1000001-0000-4000-8000-000000000024': IMG('24-dad-hat'),
  'a1000001-0000-4000-8000-000000000025': IMG('25-bandana'),
  'a1000001-0000-4000-8000-000000000026': IMG('26-racionais'),
  'a1000001-0000-4000-8000-000000000027': IMG('27-viela'),
  'a1000001-0000-4000-8000-000000000028': IMG('28-ollie'),
  'a1000001-0000-4000-8000-000000000029': IMG('29-mochila'),
  'a1000001-0000-4000-8000-000000000030': IMG('30-oculos'),
};

export const IMAGE_BY_NORMALIZED_NAME = {
  'camiseta oversized concrete jungle': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000001'],
  'hoodie skull drip': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000002'],
  'calca cargo tactical preta': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000003'],
  'tenis de skate rawstreet': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000004'],
  'bone 5-panel noize': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000005'],
  'camiseta tie-dye chaos': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000006'],
  'jaqueta corta-vento night runner': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000007'],
  'bermuda cargo camuflada': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000008'],
  'meia cano alto listrada pack 3': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000009'],
  'shoulder bag grind': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000010'],
  'moletom crewneck streets dont sleep': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000011'],
  'camiseta raglan skate or die': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000012'],
  'calca jeans baggy destroyed': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000013'],
  'bucket hat wavez': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000014'],
  'pochete trap': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000015'],
  'kit camisetas basicas oversized x3': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000016'],
  'hoodie zip underground': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000017'],
  'short tactel flow': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000018'],
  'tenis high top revolt': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000019'],
  'corrente prata chains': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000020'],
  'camiseta manga longa nightshift': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000021'],
  'jaqueta bomber riot': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000022'],
  'calca moletom lazy days': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000023'],
  'bone dad hat minimalist': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000024'],
  'bandana paisley preta': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000025'],
  'hoodie racionais 4p': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000026'],
  'camiseta viela estampada': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000027'],
  'tenis vulcanizado ollie': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000028'],
  'mochila backstreet': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000029'],
  'oculos de sol urban': PRODUCT_IMAGES['a1000001-0000-4000-8000-000000000030'],
};

export const CATEGORY_IMAGES = {
  camisetas: IMG('01-concrete-jungle'),
  moletons: IMG('02-skull-drip'),
  calcas: IMG('03-cargo-tactical'),
  tenis: IMG('04-rawstreet'),
  bones: IMG('14-bucket-hat'),
  jaquetas: IMG('22-bomber'),
  bermudas: IMG('08-cargo-bermuda'),
  acessorios: IMG('10-shoulder-bag'),
};

export const HOME_GALLERY = [
  IMG('03-cargo-tactical'),
  IMG('04-rawstreet'),
  IMG('02-skull-drip'),
  IMG('06-tie-dye'),
  IMG('14-bucket-hat'),
  IMG('18-short-tactel'),
  IMG('22-bomber'),
  IMG('28-ollie'),
];

export function normalizeProductName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["""'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveProductImage(product) {
  if (product?.image_url?.startsWith('assets/')) return product.image_url;

  const byId = PRODUCT_IMAGES[product?.id];
  if (byId) return byId;

  const byName = IMAGE_BY_NORMALIZED_NAME[normalizeProductName(product?.name || '')];
  if (byName) return byName;

  return CATEGORY_IMAGES[product?.category] || IMG('03-cargo-tactical');
}
