// Render the existing translations, without a second copy of guest-facing text.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const root = path.join(__dirname, '..');
const origin = 'https://extay-release.vercel.app';
const locales = { ko: '/guide-extay', en: '/en', ja: '/ja', zh: '/zh-cn', 'zh-TW': '/zh-tw' };
const hreflangs = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-Hans', 'zh-TW': 'zh-Hant' };
const source = fs.readFileSync(path.join(root, 'guide-extay.html'), 'utf8').replace(/\r\n/g, '\n');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  if (a < 0 || b < a) throw Error(`Missing translation boundary: ${start}`);
  return source.slice(a, b);
}
function render(language, input = source) {
  const { document } = parseHTML(input.replace(/<!-- SEO START -->[\s\S]*?<!-- SEO END -->\n?/g, ''));
  // linkedom does not implement the TreeWalker filter argument.
  const walk = document.createTreeWalker.bind(document);
  document.createTreeWalker = (node, mask, filter) => {
    const walker = walk(node, mask);
    return { currentNode: null, nextNode() {
      let next;
      while ((next = walker.nextNode())) {
        if (!filter || filter.acceptNode(next) === 1) { this.currentNode = next; return next; }
      }
      return null;
    }};
  };
  const context = vm.createContext({ document, window: {}, navigator: { language, languages: [language] },
    localStorage: { getItem: () => language }, location: { pathname: locales[language] },
    NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 }, setTimeout: () => 0 });
  const code = [
    between('const screens=', 'const q=s=>'),
    "const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];",
    between('function text(el,value)', 'function applySpecialTypography'),
    between('const CHAT_LAUNCHER_COPY=', "const RESTAURANT_SOURCE="),
    between('const GALLERY_COPY=', 'function selectGalleryImage'),
    'initFullTextI18n();initAttributeI18n();applyStaticLanguage();',
  ].join('\n');
  vm.runInContext(code, context, { timeout: 5000 });
  // Existing tour renderer keeps the same default filter and two home cards.
  for (const file of ['assets/extay-tour-data.js', 'assets/extay-tour-app.js'])
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { timeout: 5000 });
  const tr = vm.runInContext('uiText[currentLang]', context);
  decorate(document, language, tr);
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n';
}
function decorate(document, language, tr) {
  const canonical = origin + locales[language];
  document.querySelectorAll('link[rel="alternate"][hreflang],#extay-structured-data').forEach(el => el.remove());
  document.querySelector('link[rel="canonical"]').setAttribute('href', canonical);
  const meta = (selector, content) => document.querySelector(selector)?.setAttribute('content', content);
  meta('meta[property="og:url"]', canonical);
  meta('meta[property="og:title"]', tr.docTitle);
  meta('meta[property="og:description"]', tr.docDesc);
  meta('meta[property="og:locale"]', { ko: 'ko_KR', en: 'en_US', ja: 'ja_JP', zh: 'zh_CN', 'zh-TW': 'zh_TW' }[language]);
  meta('meta[name="twitter:title"]', tr.docTitle);
  meta('meta[name="twitter:description"]', tr.docDesc);
  for (const [lang, url] of Object.entries(locales)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate'); link.setAttribute('hreflang', hreflangs[lang]); link.setAttribute('href', origin + url);
    document.head.append(link);
  }
  const fallback = document.createElement('link');
  fallback.setAttribute('rel', 'alternate'); fallback.setAttribute('hreflang', 'x-default'); fallback.setAttribute('href', origin + locales.ko);
  document.head.append(fallback);
  const script = document.createElement('script'); script.id = 'extay-structured-data'; script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'LodgingBusiness', '@id': origin + '/#lodging', name: 'Extay Mansion Haebangchon', alternateName: '익스테이 맨션 해방촌',
      url: origin + locales.ko, image: origin + '/assets/extay/social/extay-mansion-haebangchon-preview-v3.jpg',
      address: { '@type': 'PostalAddress', streetAddress: '2F, 59 Sinheung-ro', addressLocality: 'Yongsan-gu', addressRegion: 'Seoul', addressCountry: 'KR' },
      checkinTime: '16:00', checkoutTime: '11:00' },
    { '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical, name: tr.docTitle, description: tr.docDesc,
      inLanguage: hreflangs[language], about: { '@id': origin + '/#lodging' } },
  ] }).replace(/</g, '\\u003c');
  document.head.append(script);
}
function write(file, value) {
  const target = path.join(root, file);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== value) throw Error(`${file} is stale. Run npm run build:seo.`);
  } else fs.writeFileSync(target, value);
}
if (require.main === module) {
for (const language of Object.keys(locales).filter(lang => lang !== 'ko')) write(locales[language].slice(1) + '.html', render(language));
// Keep Korean source formatting and all visible source markup unchanged.
const { document: korean } = parseHTML(source);
decorate(korean, 'ko', { docTitle: korean.title, docDesc: korean.querySelector('meta[name="description"]').getAttribute('content') });
const metadata = [...korean.head.querySelectorAll('link[rel="alternate"][hreflang],#extay-structured-data')].map(el => el.outerHTML).join('\n');
const koreanSource = source.replace(/\n?<!-- SEO START -->[\s\S]*?<!-- SEO END -->\n?/g, '\n').replace('</head>', `<!-- SEO START -->\n${metadata}\n<!-- SEO END -->\n</head>`);
write('guide-extay.html', koreanSource);
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + Object.values(locales).map(url => `  <url><loc>${origin}${url}</loc></url>`).join('\n') + '\n</urlset>\n');
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log('Validated/generated 5 language URLs from existing EXTAY translations.');
}
module.exports = { render, locales, hreflangs };
