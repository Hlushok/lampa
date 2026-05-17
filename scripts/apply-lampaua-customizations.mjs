import { readFileSync, writeFileSync } from 'node:fs';

const utf8 = 'utf8';

function writeIfChanged(path, next) {
  const current = readFileSync(path, utf8);
  if (current !== next) writeFileSync(path, next, utf8);
}

function applyAboutBranding() {
  const path = 'app.min.js';
  let source = readFileSync(path, utf8);

  const brandBlock = String.raw`    <div class=\"about__brand\">\n        <small>Наша копія</small><br>\n        <span>Lampa UA / Hlushok — власна збірка з нашими напрацюваннями</span>\n    </div>`;
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

  source = source.slice(0, afterAboutText) + String.raw`\n\n` + brandBlock + String.raw`\n\n` + source.slice(serviceIndex);

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
    '}',
    '.about__brand span {',
    '  display: block;',
    '  max-width: 100%;',
    '}',
  ].join(eol);

  source = source.replace(new RegExp(String.raw`(?:\r?\n)?\.about__brand \{[\s\S]*?\r?\n\}\r?\n\.about__brand span \{[\s\S]*?\r?\n\}`, 'g'), '');

  const anchor = ['.about small {', '  font-weight: 400;', '}'].join(eol);
  if (!source.includes(anchor)) {
    throw new Error('Could not find the about small CSS block in css/app.css');
  }

  source = source.replace(anchor, `${anchor}${eol}${styleBlock}`);

  writeIfChanged(path, source);
}

applyAboutBranding();
applyAboutBrandingStyles();
console.log('Applied Lampa UA custom branding.');
