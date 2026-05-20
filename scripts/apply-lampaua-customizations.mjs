import { readFileSync, writeFileSync } from 'node:fs';

const utf8 = 'utf8';

function writeIfChanged(path, next) {
  const current = readFileSync(path, utf8);
  if (current !== next) writeFileSync(path, next, utf8);
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return source;
    throw new Error(`Could not find ${label}`);
  }

  return source.replace(search, replacement);
}

function replaceAll(source, search, replacement) {
  return source.split(search).join(replacement);
}

function polishUkrainianText(source) {
  const replacements = [
    ['повідомлення про переведення нових серій', 'повідомлення про переклади нових серій'],
    ['повідомлень про переведення серіалу', 'повідомлень про переклад серіалу'],
    ['підпишіться на переклад та отримуйте повідомлення про вихід нових серій', 'підпишіться на переклад і отримуйте повідомлення про вихід нових серій'],
    ['про виход нових серіалів і фільмів', 'про вихід нових серій і фільмів'],
    ['з нашим програмою для перегляду IPTV каналів', 'з нашою програмою для перегляду IPTV-каналів'],
    ['Наша програма просто у використанні', 'Наша програма проста у використанні'],
    ['IPTV додатку', 'IPTV-додатку'],
    ['перезавантажити його', 'перезавантажити її'],
  ];

  for (const [search, replacement] of replacements) {
    source = replaceAll(source, search, replacement);
  }

  return source;
}

function applyAboutBranding() {
  const path = 'app.min.js';
  let source = readFileSync(path, utf8);

  const customBlock = String.raw`    <div class=\"about__brand\">\n        <small>Наша копія</small><br>\n        <span>Lampa UA / Hlushok - власна збірка з нашими напрацюваннями</span>\n    </div>\n\n    <div class=\"about__ua-panel\">\n        <h3>Про Lampa UA</h3>\n        <p>Українська збірка з власними правками поверх Siaivo/siaivo.github.io.</p>\n        <ul>\n            <li>Мова інтерфейсу і TMDB за замовчуванням: українська.</li>\n            <li>Оновлення з upstream перевіряються автоматично щодня.</li>\n            <li>Наші зміни повторно накладаються після кожного оновлення.</li>\n        </ul>\n    </div>`;
  const aboutStart = String.raw`var html$1 = "<div class=\"about\">\n    <div>#{about_text}</div>`;
  const serviceBlockStart = String.raw`    <div class=\"overhide\">`;

  const aboutIndex = source.lastIndexOf(aboutStart);
  if (aboutIndex === -1) {
    throw new Error('Could not find the custom about template in app.min.js');
  }

  const afterAboutText = aboutIndex + aboutStart.length;
  const serviceIndex = source.indexOf(serviceBlockStart, afterAboutText);
  if (serviceIndex === -1) {
    throw new Error('Could not find the about service block in app.min.js');
  }

  source = source.slice(0, afterAboutText) + String.raw`\n\n` + customBlock + String.raw`\n\n` + source.slice(serviceIndex);

  writeIfChanged(path, source);
}

function applyAboutBrandingStyles() {
  const path = 'css/app.css';
  let source = readFileSync(path, utf8);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';

  const styleBlock = [
    '.about__brand {',
    '  padding: 0.8em 1em;',
    '  border-left: 0.18em solid #e94b5f;',
    '  background: rgba(255, 255, 255, 0.06);',
    '  margin-bottom: 1em;',
    '}',
    '.about__brand span {',
    '  display: block;',
    '  max-width: 100%;',
    '}',
    '.about__ua-panel {',
    '  padding: 1em;',
    '  border: 1px solid rgba(255, 255, 255, 0.08);',
    '  background: rgba(255, 255, 255, 0.04);',
    '  margin-bottom: 1.3em;',
    '}',
    '.about__ua-panel h3 {',
    '  margin: 0 0 0.55em;',
    '  font-size: 1.15em;',
    '  font-weight: 600;',
    '}',
    '.about__ua-panel p {',
    '  margin: 0 0 0.75em;',
    '}',
    '.about__ua-panel ul {',
    '  margin: 0;',
    '  padding-left: 1.2em;',
    '}',
    '.about__ua-panel li {',
    '  margin: 0.3em 0;',
    '}',
  ].join(eol);

  source = source.replace(
    new RegExp(String.raw`(?:\r?\n)?\.about__brand \{[\s\S]*?\r?\n\}\r?\n\.about__brand span \{[\s\S]*?\r?\n\}(?:\r?\n\.about__ua-panel \{[\s\S]*?\r?\n\}\r?\n\.about__ua-panel h3 \{[\s\S]*?\r?\n\}\r?\n\.about__ua-panel p \{[\s\S]*?\r?\n\}\r?\n\.about__ua-panel ul \{[\s\S]*?\r?\n\}\r?\n\.about__ua-panel li \{[\s\S]*?\r?\n\})?`, 'g'),
    ''
  );

  const anchor = ['.about small {', '  font-weight: 400;', '}'].join(eol);
  if (!source.includes(anchor)) {
    throw new Error('Could not find the about small CSS block in css/app.css');
  }

  source = source.replace(anchor, `${anchor}${eol}${styleBlock}`);

  writeIfChanged(path, source);
}

function applyUkrainianDefaults() {
  const path = 'app.min.js';
  let source = readFileSync(path, utf8);

  source = replaceRequired(
    source,
    "var code = custom_code || Storage.get('language', 'ru');",
    "var code = custom_code || Storage.get('language', 'uk');",
    'language fallback in Lang.translate'
  );
  source = replaceRequired(
    source,
    "var code = Lampa.Storage.get('language', 'ru');",
    "var code = Lampa.Storage.get('language', 'uk');",
    'language fallback in notice translations'
  );
  source = replaceRequired(
    source,
    "return check_codes.indexOf(Storage.get('language', 'ru')) >= 0 ? true : false;",
    "return check_codes.indexOf(Storage.get('language', 'uk')) >= 0 ? true : false;",
    'language fallback in Lang.selected'
  );
  source = replaceRequired(
    source,
    "Storage.get('keyboard_default_lang', Storage.get('language', 'ru'))",
    "Storage.get('keyboard_default_lang', Storage.get('language', 'uk'))",
    'keyboard language fallback'
  );
  source = replaceRequired(
    source,
    "_lang_codes[Storage.get('language', 'ru')] || 'en-US'",
    "_lang_codes[Storage.get('language', 'uk')] || 'uk-UA'",
    'speech recognition language fallback'
  );
  source = replaceRequired(
    source,
    "var langcode = Storage.get('language', 'ru');",
    "var langcode = Storage.get('language', 'uk');",
    'language fallback in settings'
  );
  source = replaceRequired(
    source,
    "select('tmdb_lang', Lang.codes(), 'ru');",
    "select('tmdb_lang', Lang.codes(), 'uk');",
    'TMDB language fallback'
  );
  source = replaceRequired(
    source,
    "var code = window.localStorage.getItem('language') || 'ru';",
    "var code = window.localStorage.getItem('language') || 'uk';",
    'startup language fallback'
  );
  source = replaceRequired(
    source,
    "html.find('[data-code=\"' + Storage.get('language', 'ru') + '\"]')",
    "html.find('[data-code=\"' + Storage.get('language', 'uk') + '\"]')",
    'language chooser focus fallback'
  );
  source = replaceRequired(
    source,
    "language=' + Storage.get('language', 'ru') + '&api_key='",
    "language=' + Storage.get('language', 'uk') + '&api_key='",
    'TMDB API language fallback'
  );
  source = replaceRequired(
    source,
    "'&language=' + Storage.get('language', 'ru') + '&api_key='",
    "'&language=' + Storage.get('language', 'uk') + '&api_key='",
    'TMDB images API language fallback'
  );
  source = replaceRequired(
    source,
    "Lang.codes()[Storage.get('language', 'ru')]",
    "Lang.codes()[Storage.get('language', 'uk')]",
    'settings language label fallback'
  );

  const loadAppAnchor = "    prepareApp(); // ";
  const defaultsBlock = String.raw`
    if (!window.localStorage.getItem('language') && window.lampa_settings.lang_use) {
      Storage.set('language', 'uk', true);
      Storage.set('tmdb_lang', 'uk', true);
    }

`;

  if (!source.includes("Storage.set('language', 'uk', true);")) {
    const anchorIndex = source.indexOf(loadAppAnchor);
    if (anchorIndex === -1) {
      throw new Error('Could not find loadApp prepareApp anchor');
    }

    const lineEnd = source.indexOf('\n', anchorIndex);
    source = source.slice(0, lineEnd + 1) + defaultsBlock + source.slice(lineEnd + 1);
  }

  source = polishUkrainianText(source);

  writeIfChanged(path, source);
}

function applyUkrainianLangPolish() {
  const path = 'lang/uk.js';
  let source = readFileSync(path, utf8);
  source = polishUkrainianText(source);
  writeIfChanged(path, source);
}

function applyLoadingProgressTranslations() {
  const path = 'app.min.js';
  let source = readFileSync(path, utf8);
  const replacements = [
    ['Bookmarks start sync', 'Синхронізація закладок'],
    ['Bookmarks loading full dump', 'Завантаження закладок'],
    ['Bookmarks parsing dump', 'Обробка закладок'],
    ['Bookmarks no dump load, trying cache', 'Пробуємо кеш закладок'],
    ['Bookmarks load from cache', 'Завантаження закладок з кешу'],
    ['Bookmarks loading changelog', 'Завантаження змін закладок'],
    ['Bookmarks applying changelog', 'Застосування змін закладок'],
    ['Platform init', 'Підготовка платформи'],
    ['DeviceInput init', 'Підготовка керування'],
    ['Params init', 'Підготовка параметрів'],
    ['Controller observe init', 'Підготовка контролера'],
    ['Console init', 'Підготовка консолі'],
    ['Keypad init', 'Підготовка клавіатури'],
    ['Layer init', 'Підготовка інтерфейсу'],
    ['Subscribe on keydown', 'Підготовка натискань'],
    ['Loaded styles', 'Стилі завантажено'],
    ['Prepare ready', 'Підготовка завершена'],
    ['Launching the application', 'Запуск застосунку'],
    ['Timer init', 'Підготовка таймера'],
    ['Storage init', 'Підготовка сховища'],
    ['Timeline init', 'Підготовка історії'],
    ['HTTPS init', 'Підготовка HTTPS'],
    ['Mirrors init', 'Підготовка дзеркал'],
    ['Personal init', 'Підготовка профілю'],
    ['Head init', 'Підготовка сторінки'],
    ['Settings init', 'Підготовка налаштувань'],
    ['Select init', 'Підготовка вибору'],
    ['Favorite init', 'Підготовка обраного'],
    ['Background init', 'Підготовка фону'],
    ['Markers init', 'Підготовка міток'],
    ['Notice init', 'Підготовка сповіщень'],
    ['Bell init', 'Підготовка дзвінка'],
    ['Menu init', 'Підготовка меню'],
    ['Activity init', 'Підготовка активності'],
    ['Screensaver init', 'Підготовка заставки'],
    ['Socket init', 'Підготовка з’єднання'],
    ['Account init', 'Підготовка акаунта'],
    ['Extensions init', 'Підготовка розширень'],
    ['Plugins init', 'Підготовка плагінів'],
    ['Recomends init', 'Підготовка рекомендацій'],
    ['Timetable init', 'Підготовка розкладу'],
    ['Helper init', 'Підготовка помічника'],
    ['Tizen init', 'Підготовка Tizen'],
    ['Player init', 'Підготовка плеєра'],
    ['Iframe init', 'Підготовка iframe'],
    ['Parser init', 'Підготовка парсера'],
    ['WebOSLauncher init', 'Підготовка WebOS'],
    ['Theme init', 'Підготовка теми'],
    ['AdManager init', 'Підготовка реклами'],
    ['NavigationBar init', 'Підготовка навігації'],
    ['Demo init', 'Підготовка демо'],
    ['Speedtest init', 'Підготовка тесту швидкості'],
    ['Processing init', 'Підготовка обробки'],
    ['ParentalControl init', 'Підготовка батьківського контролю'],
    ['Android init', 'Підготовка Android'],
    ['Sound init', 'Підготовка звуку'],
    ['Iptv init', 'Підготовка IPTV'],
    ['Logs init', 'Підготовка журналів'],
    ['Broadcast init', 'Підготовка трансляції'],
    ['Search init', 'Підготовка пошуку'],
    ['DataBase init', 'Підготовка бази даних'],
    ['ContentRows init', 'Підготовка рядків контенту'],
    ['Initialization successful', 'Ініціалізація успішна'],
    ['Render app', 'Відображення застосунку'],
    ['ServiceDeveloper init', 'Підготовка сервісу розробника'],
    ['ServiceTorserver init', 'Підготовка TorrServer'],
    ['ServiceWatched init', 'Підготовка переглядів'],
    ['ServiceSettings init', 'Підготовка сервісу налаштувань'],
    ['ServiceMetric init', 'Підготовка метрик'],
    ['ServiceRemoteFavorites init', 'Підготовка віддаленого обраного'],
    ['ServiceDMCA init', 'Підготовка DMCA'],
    ['ServiceFPS init', 'Підготовка FPS'],
    ['ServiceEvents init', 'Підготовка подій'],
    ['ServiceLibs init', 'Підготовка бібліотек'],
    ['ServiceLGBT init', 'Підготовка сервісу LGBT'],
    ['ServiceChildren init', 'Підготовка дитячого режиму'],
    ['ServiceRemoteConfiguration init', 'Підготовка віддаленої конфігурації'],
    ['Layer update', 'Оновлення інтерфейсу'],
    ['Send app ready', 'Застосунок майже готовий'],
    ['Show app', 'Показ застосунку'],
    ['Open cache database', 'Відкриття кешу'],
    ['Storage load reserve', 'Завантаження резерву сховища'],
    ['Mirrors initialization', 'Ініціалізація дзеркал'],
    ['Plugins initialization', 'Ініціалізація плагінів'],
    ['Proxy initialization', 'Ініціалізація проксі'],
    ['Account initialization', 'Ініціалізація акаунта'],
    ['Loading plugins', 'Завантаження плагінів'],
    ['Loading language', 'Завантаження мови'],
  ];

  for (const [search, replacement] of replacements) {
    source = replaceAll(source, `LoadingProgress.status('${search}')`, `LoadingProgress.status('${replacement}')`);
  }

  writeIfChanged(path, source);
}

function applyWelcomeBackgroundRotation() {
  const path = 'index.html';
  let source = readFileSync(path, utf8);

  const scriptBlock = String.raw`    <script>
        ;(function () {
            var welcome = document.querySelector('.welcome')
            var backgrounds = [
                'img/welcome/welcome-1.jpg',
                'img/welcome/welcome-2.jpg',
                'img/welcome/welcome-3.jpg',
                'img/welcome/welcome-4.jpg',
                'img/welcome/welcome-5.jpg',
                'img/welcome/welcome-6-ukraine.jpg',
                'img/welcome/welcome-7.png',
                'img/welcome/welcome-8.png',
                'img/welcome/welcome-9.png',
                'img/welcome/welcome-10.png',
                'img/welcome/welcome-11.png'
            ]

            if (!welcome || !backgrounds.length) return

            var logo = welcome.querySelector('.welcome__logo')
            if (!logo) {
                logo = document.createElement('img')
                logo.className = 'welcome__logo'
                logo.src = 'img/logo-icon.svg'
                logo.alt = ''
                logo.setAttribute('aria-hidden', 'true')
                logo.style.cssText =
                    'position:absolute;left:50%;top:50%;width:10em;max-width:24vw;height:auto;transform:translate(-50%,-50%);pointer-events:none;display:none;'
                welcome.appendChild(logo)
            }

            var selected = backgrounds[Math.floor(Math.random() * backgrounds.length)]
            var image = new Image()

            image.onload = function () {
                welcome.style.backgroundImage = 'url("' + selected + '")'
                logo.style.display = 'block'
            }

            image.src = selected
        })()
    </script>`;

  source = source.replace(
    new RegExp(String.raw`\s*<script>\s*;\(function \(\) \{\s*var welcome = document\.querySelector\('\.welcome'\)[\s\S]*?image\.src = selected\s*\}\)\(\)\s*</script>`, 'g'),
    ''
  );

  const anchor = '    <div class="welcome"></div>';
  if (!source.includes(anchor)) {
    throw new Error('Could not find the welcome element in index.html');
  }

  source = source.replace(anchor, `${anchor}\n${scriptBlock}`);

  writeIfChanged(path, source);
}

applyAboutBranding();
applyAboutBrandingStyles();
applyUkrainianDefaults();
applyUkrainianLangPolish();
applyLoadingProgressTranslations();
applyWelcomeBackgroundRotation();
console.log('Applied Lampa UA Ukrainian customizations.');
