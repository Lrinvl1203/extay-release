const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { parseHTML } = require('linkedom');
const { render, locales, hreflangs } = require('../scripts/build-search-pages');
const root = path.join(__dirname, '..');
const baseline = require('./search-copy-baseline.json').hashes;
const hash = html => crypto.createHash('sha256').update(bodyText(html)).digest('hex');
function bodyText(html) {
  const { document } = parseHTML(html);
  document.querySelectorAll('script,style').forEach(el => el.remove());
  return document.body.textContent.replace(/\s+/g, ' ').trim();
}
test('Korean visible source copy is unchanged', () => {
  assert.equal(hash(fs.readFileSync(path.join(root, 'guide-extay.html'), 'utf8')), baseline.ko);
});
for (const [lang, url] of Object.entries(locales)) test(`search metadata and existing translations: ${lang}`, () => {
  const html = fs.readFileSync(path.join(root, url.slice(1) + '.html'), 'utf8');
  const { document } = parseHTML(html);
  assert.equal(document.documentElement.lang, lang);
  assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://extay-release.vercel.app' + url);
  assert.equal(document.querySelectorAll('link[hreflang]').length, 6);
  assert.equal(document.querySelectorAll('.home-language-option[href]').length, 5);
  assert.equal(document.querySelectorAll('[data-screen]').length, 12);
  const data = JSON.parse(document.querySelector('#extay-structured-data').textContent);
  assert.equal(data['@graph'][1].inLanguage, hreflangs[lang]);
  assert.equal(data['@graph'][0].address.streetAddress, '2F, 59 Sinheung-ro');
  for (const script of document.querySelectorAll('script:not([src])')) {
    if (script.type === 'application/ld+json') JSON.parse(script.textContent);
    else new vm.Script(script.textContent);
  }
  if (lang !== 'ko') {
    assert.equal(hash(html), baseline[lang], 'Do not invent or replace translated guest copy');
    assert.equal(bodyText(html), bodyText(render(lang, html)), 'Client translation must not duplicate or drop pre-rendered text');
  }
});
