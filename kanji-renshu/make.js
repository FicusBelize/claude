// 漢字練習帖PDFを作る: node make.js <fontCssPath>
// 第1回 = 1〜100字目（100字・使用済み）
// 第3回 = 1年生の80字から、かんたんな30字（数字・画数の少ない字）を除いた50字
// 第4回 = 2年生の画数の多い40字 ＋ 3年生10字（10字ごとに2年8字＋3年2字）
// 第5回 = 2年生の次に画数の多い40字（第4回と別）＋ 別の3年生10字、並びは第4回と同じ
// 第2回 = 101〜160字目（60字）＋ 第1回とかぶる61〜100字目のうち画数の多い10字 ＝ 70字
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const dir = __dirname;
const fontCss = process.argv[2];
const load = f => fs.readFileSync(path.join(dir, f), 'utf8').trim().split('\n')
  .map((l, i) => { const [k, on, kun, n, set] = l.split('\t'); return { k, on, kun, n, set, no: i + 1 }; });
const rows = load('grade2.tsv');
const EASY1 = new Set([...'一二三四五六七八九十人入力口山子女小上下大土千川夕日月火水木']);
const byStrokes = [...rows].sort((a, b) => b.n - a.n || a.no - b.no);
const g3all = load('grade3.tsv').map(r => ({ ...r, g3: true }));
function mixSet(g2, g3) {
  g2 = [...g2].sort((a, b) => a.no - b.no);
  const out = [];
  for (let p = 0; p < 5; p++) out.push(...g2.slice(p * 8, p * 8 + 8), ...g3.slice(p * 2, p * 2 + 2));
  return out.map((r, i) => ({ ...r, no: i + 1 }));
}
const set4 = mixSet(byStrokes.slice(0, 40), g3all.filter(r => r.set === '4'));
const set5 = mixSet(byStrokes.slice(40, 80), g3all.filter(r => r.set === '5'));
const set3 = load('grade1.tsv').filter(r => !EASY1.has(r.k)).map((r, i) => ({ ...r, no: i + 1 }));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const kunHtml = s => s ? s.split('・').map(r => esc(r).replace(/\((.+?)\)/, '<span class="okuri">$1</span>')).join('<br>') : '';

function page(set, p, total, items) {
  const cols = items.map((it, i) => `
    <div class="col">
      <div class="no${it.g3 ? ' g3' : ''}">${it.g3 ? '3年 ' : ''}${it.no}</div>
      <div class="model">
        <div class="big">${it.k}</div>
        <div class="read">
          <div class="on">${esc(it.on)}</div>
          <div class="kun">${kunHtml(it.kun)}</div>
        </div>
        <div class="strokes">${it.n}画</div>
      </div>
      ${Array.from({ length: 10 }, (_, j) => `<div class="cell">${j < 2 ? `<span class="trace">${it.k}</span>` : ''}</div>`).join('')}
    </div>`).join('');
  return `<section class="page">
    <header>
      <div class="title">かんじ れんしゅうちょう <b>第${set}回</b>${set === 3 ? '（1年生）' : ''}　${p} / ${total}ページ</div>
      <div class="meta"><span>&emsp;&emsp;月&emsp;&emsp;日</span><span class="name">なまえ</span><span class="done">できた<i></i></span></div>
    </header>
    <div class="grid">${cols}</div>
  </section>`;
}

function html(set, list) {
  const pages = [];
  const total = Math.ceil(list.length / 10);
  for (let p = 0; p < total; p++) pages.push(page(set, p + 1, total, list.slice(p * 10, p * 10 + 10)));
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<style>
${fontCss ? fs.readFileSync(fontCss, 'utf8') : ''}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Klee One', 'IPAGothic', sans-serif; color: #222; }
.page { width: 210mm; height: 297mm; padding: 11mm 15mm 0; page-break-after: always; }
header { height: 13mm; white-space: nowrap; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 2mm; }
.title { font-size: 12pt; font-weight: 600; } .title b { color: #c0392b; }
.meta { display: flex; gap: 5mm; font-size: 11pt; align-items: flex-end; }
.name { border-bottom: 0.3mm solid #444; width: 42mm; }
.done i { display: inline-block; width: 7mm; height: 7mm; border: 0.4mm solid #444; border-radius: 50%; vertical-align: middle; margin-left: 1mm; }
.grid { display: flex; flex-direction: row-reverse; border: 0.5mm solid #333; width: 180mm; }
.col { width: 18mm; border-left: 0.3mm solid #333; }
.col:last-child { border-left: none; }
.no { height: 5mm; font-size: 7.5pt; text-align: center; line-height: 5mm; background: #f1f1f1; border-bottom: 0.3mm solid #333; color: #555; }
.model { height: 63mm; border-bottom: 0.5mm solid #333; display: flex; flex-direction: column; align-items: center; padding-top: 1mm; }
.big { font-size: 40pt; line-height: 17mm; font-weight: 600; }
.read { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 1.5mm; writing-mode: vertical-rl; font-size: 10pt; line-height: 1.25; margin-top: 1mm; overflow: hidden; }
.no.g3 { background: #fbe3c4; color: #8a4b00; font-weight: 600; }
.on { color: #c0392b; } .kun { color: #1f5fa8; }
.okuri { color: #888; }
.strokes { font-size: 7.5pt; color: #555; height: 4.5mm; }
.cell { height: 18mm; position: relative; border-bottom: 0.3mm solid #333; display: flex; align-items: center; justify-content: center; }
.cell:last-child { border-bottom: none; }
.cell::before, .cell::after { content: ''; position: absolute; }
.cell::before { left: 50%; top: 0; bottom: 0; border-left: 0.25mm dashed #bbb; }
.cell::after { top: 50%; left: 0; right: 0; border-top: 0.25mm dashed #bbb; }
.trace { font-size: 40pt; color: #d6d6d6; font-weight: 600; line-height: 1; position: relative; z-index: 1; }
</style></head><body>${pages.join('')}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const overlap = rows.slice(60, 100);
  const keep = new Set([...overlap].sort((a, b) => b.n - a.n || a.no - b.no).slice(0, 10).map(r => r.no));
  const set2 = [...overlap.filter(r => keep.has(r.no)), ...rows.slice(100)];
  const sets = [[1, rows.slice(0, 100)], [2, set2], [3, set3], [4, set4], [5, set5]];
  for (const [set, list] of sets) {
    if (process.argv[3] && !process.argv[3].split(',').includes(String(set))) continue;
    const pg = await browser.newPage();
    const tmp = path.join(path.dirname(fontCss || dir), `_set${set}.html`);
    fs.writeFileSync(tmp, html(set, list));
    await pg.goto('file://' + tmp, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.pdf({ path: path.join(dir, `漢字練習帖_第${set}回.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await pg.screenshot({ path: path.join(path.dirname(fontCss || dir), `_set${set}.png`), clip: { x: 0, y: 0, width: 794, height: 1123 } });
    fs.unlinkSync(tmp);
  }
  await browser.close();
})();
