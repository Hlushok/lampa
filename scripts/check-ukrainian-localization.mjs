import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const utf8 = 'utf8';

function readLang(path) {
  const source = readFileSync(path, utf8).replace(/export default/, 'module.exports =');
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { filename: path });
  return sandbox.module.exports;
}

function fail(messages) {
  for (const message of messages) console.error(`- ${message}`);
  process.exit(1);
}

const uk = readLang('lang/uk.js');
const ru = readLang('lang/ru.js');
const en = readLang('lang/en.js');
const app = readFileSync('app.min.js', utf8);
const errors = [];

for (const [baseName, base] of [['ru', ru], ['en', en]]) {
  const missing = Object.keys(base).filter((key) => !(key in uk));
  if (missing.length) {
    errors.push(`lang/uk.js misses ${missing.length} keys from ${baseName}: ${missing.slice(0, 20).join(', ')}`);
  }
}

for (const [key, value] of Object.entries(uk)) {
  if (typeof value !== 'string') continue;
  if (/[ыэёъ]/i.test(value)) {
    errors.push(`lang/uk.js contains Russian-only letters in ${key}: ${value}`);
  }
}

const forbiddenPhrases = [
  'переведення нових серій',
  'повідомлень про переведення',
  'виход нових',
  'з нашим програмою',
  'Наша програма просто у використанні',
  'перезавантажити його',
];

for (const phrase of forbiddenPhrases) {
  if (app.includes(phrase)) errors.push(`app.min.js still contains phrase: ${phrase}`);
  if (Object.values(uk).some((value) => typeof value === 'string' && value.includes(phrase))) {
    errors.push(`lang/uk.js still contains phrase: ${phrase}`);
  }
}

const forbiddenLoadingStatuses = [
  'Prepare ready',
  'Launching the application',
  'Send app ready',
  'Show app',
  'Loading plugins',
  'Loading language',
];

for (const status of forbiddenLoadingStatuses) {
  if (app.includes(`LoadingProgress.status('${status}')`)) {
    errors.push(`app.min.js still contains English loading status: ${status}`);
  }
}

const requiredAppSnippets = [
  "Storage.set('language', 'uk', true);",
  "Storage.set('tmdb_lang', 'uk', true);",
  "select('tmdb_lang', Lang.codes(), 'uk');",
  "window.localStorage.getItem('language') || 'uk'",
  'Наша копія',
  'Про Lampa UA',
  "DEFAULT_REGION_CODE = 'ua'",
  'Застосунок майже готовий',
];

for (const snippet of requiredAppSnippets) {
  if (!app.includes(snippet)) errors.push(`app.min.js misses required snippet: ${snippet}`);
}

if (/Storage\.get\('language', 'ru'\)/.test(app) || /Lampa\.Storage\.get\('language', 'ru'\)/.test(app)) {
  errors.push("app.min.js still uses 'ru' as an implicit language fallback");
}

if (errors.length) {
  console.error('Ukrainian localization check failed:');
  fail(errors);
}

console.log(`Ukrainian localization check passed: ${Object.keys(uk).length} Ukrainian strings covered.`);
