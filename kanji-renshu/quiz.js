// 漢字テストPDFを作る: node quiz.js <fontCssPath> <問題ファイル> <出力PDF>
// 問題ファイルの書き方: [漢字|よみ] = 読みの問題、{よみ|漢字} = 書きの問題（1行1問、# はコメント）
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [fontCss, src, out] = process.argv.slice(2);
const title = (fs.readFileSync(src, 'utf8').match(/^#\s*(.+)$/m) || [, '漢字テスト'])[1];
const qs = fs.readFileSync(src, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const parsed = qs.map((q, i) => {
  let type, ans;
  const html = esc(q)
    .replace(/\[([^|\]]+)\|([^\]]+)\]/, (_, kj, yomi) => {
      type = 'yomi'; ans = yomi;
      return `<span class="yomi">${kj}<span class="abox" style="height:${yomi.length * 6 + 4}mm"></span></span>`;
    })
    .replace(/\{([^|}]+)\|([^}]+)\}/, (_, yomi, kj) => {
      type = 'kaki'; ans = kj;
      return `<ruby class="kaki">${[...kj].map(() => '<span class="wbox"></span>').join('')}<rt>${yomi}</rt></ruby>`;
    });
  return { no: i + 1, type, ans, html, plain: q.replace(/\[([^|\]]+)\|[^\]]+\]/, '$1').replace(/\{([^|}]+)\|[^}]+\}/, '（$1）') };
});

const HEAD = {
  yomi: '――線の　かん字の　読みがなを　書きましょう。',
  kaki: '□に　あてはまる　かん字を　書きましょう。',
};
const sec = { yomi: '一', kaki: '二' };
const count = t => parsed.filter(p => p.type === t).length;

const pages = [];
for (let p = 0; p < parsed.length; p += 10) {
  const cols = [];
  parsed.slice(p, p + 10).forEach((q, j) => {
    const prev = p + j > 0 ? parsed[p + j - 1].type : null;
    if (q.type !== prev) cols.push(`<div class="head">${sec[q.type]}、${HEAD[q.type]}<span class="pts">（1もん1てん・${count(q.type)}てん）</span></div>`);
    cols.push(`<div class="q"><span class="num">${q.no}</span><span class="sent">${q.html}</span></div>`);
  });
  pages.push(`<section class="page">
    <header>
      <div class="title">${esc(title)}</div>
      <div class="meta"><span>&emsp;&emsp;月&emsp;&emsp;日</span><span class="name">なまえ</span><span class="score"><i></i>／${parsed.length}てん</span></div>
    </header>
    <div class="body">${cols.join('')}</div>
    <div class="pg">${p / 10 + 1} / ${Math.ceil(parsed.length / 10)}</div>
  </section>`);
}

const ansRows = t => parsed.filter(q => q.type === t).map(q => `<tr><td class="n">${q.no}</td><td>${esc(q.plain)}</td><td class="a">${esc(q.ans)}</td></tr>`).join('');
pages.push(`<section class="page answers">
  <header><div class="title">${esc(title)}　こたえ</div></header>
  <div class="cols">
    <div><h2>一、読み</h2><table>${ansRows('yomi')}</table></div>
    <div><h2>二、書き</h2><table>${ansRows('kaki')}</table></div>
  </div>
</section>`);

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
${fs.readFileSync(fontCss, 'utf8')}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Klee One', 'IPAGothic', sans-serif; color: #222; }
.page { width: 210mm; height: 297mm; padding: 11mm 15mm 0; page-break-after: always; position: relative; }
header { height: 16mm; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 2mm; border-bottom: 0.4mm solid #333; white-space: nowrap; }
.title { font-size: 15pt; font-weight: 600; }
.meta { display: flex; gap: 5mm; font-size: 11pt; align-items: flex-end; }
.name { border-bottom: 0.3mm solid #444; width: 45mm; }
.score i { display: inline-block; width: 13mm; height: 9mm; border: 0.4mm solid #444; border-radius: 2mm; vertical-align: bottom; margin-right: 1mm; }
.body { writing-mode: vertical-rl; height: 250mm; margin-top: 5mm; font-size: 16pt; line-height: 1; }
.head { width: 12mm; font-size: 11.5pt; font-weight: 600; padding-top: 2mm; padding-right: 1mm; border-right: 0.3mm solid #999; padding-left: 3mm; }
.pts { font-weight: 400; font-size: 9.5pt; color: #555; }
.q { width: 16.8mm; padding: 3mm 7.5mm 0 0; border-right: 0.2mm dashed #ccc; }
.num { display: inline-block; text-combine-upright: all; width: 6mm; height: 6mm; line-height: 6mm; text-align: center;
  font-size: 9.5pt; border: 0.3mm solid #555; border-radius: 50%; margin-bottom: 3mm; }
.sent { letter-spacing: 0.05em; }
.yomi { position: relative; }
.yomi::before { content: ''; position: absolute; right: 0.4mm; top: -0.6mm; bottom: -0.6mm; border-right: 0.5mm solid #222; }
.abox { position: absolute; right: -8.6mm; top: -1mm; width: 8mm; border: 0.3mm solid #555; border-radius: 4mm; }
ruby.kaki { ruby-position: over; }
.wbox { display: inline-block; width: 11mm; height: 11mm; border: 0.4mm solid #333; margin: 0.5mm 0; vertical-align: middle; }
ruby.kaki rt { font-size: 10pt; color: #333; letter-spacing: 0.1em; }
.pg { position: absolute; bottom: 8mm; width: 180mm; text-align: center; font-size: 9pt; color: #777; }
.answers .cols { display: flex; gap: 8mm; margin-top: 6mm; }
.answers .cols > div { flex: 1; }
.answers h2 { font-size: 12pt; margin-bottom: 2mm; }
.answers table { border-collapse: collapse; width: 100%; font-size: 10.5pt; }
.answers td { border-bottom: 0.2mm solid #ccc; padding: 2mm 1mm; }
.answers td.n { width: 7mm; color: #777; text-align: right; padding-right: 2mm; }
.answers td.a { font-weight: 600; color: #c0392b; font-size: 13pt; white-space: nowrap; }
</style></head><body>${pages.join('')}</body></html>`;

(async () => {
  const tmp = path.join(path.dirname(fontCss), '_quiz.html');
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const pg = await browser.newPage();
  await pg.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  if (!process.env.KEEP) fs.unlinkSync(tmp);
})();
