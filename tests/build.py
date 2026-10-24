"""4年国語（慣用句2・ことわざ2・反対語2）の確認テストを4回分作る。

全82問がどこかの回に必ず1回出るように、番号を4で割ったあまりで振り分ける。
出力: out/test_round{1-4}.html（問題＋解答）
"""
import html
import os
import random
import re

from data import HANTAIGO, KANYOUKU, KOTOWAZA

ROUNDS = 4
KANA = "アイウエオカキクケコサシ"
OUT = os.path.join(os.path.dirname(__file__), "out")


def esc(s):
    return html.escape(s)


def pick(n, r):
    return [i for i in range(n) if i % ROUNDS == r]


def others(n, used, k, rng):
    pool = [i for i in range(n) if i not in used]
    return rng.sample(pool, k)


def choices_block(labels_items):
    cells = "".join(f'<li><b>{k}</b>　{esc(t)}</li>' for k, t in labels_items)
    return f'<ul class="choices">{cells}</ul>'


def build_round(r):
    rng = random.Random(100 + r)
    q, a = [], []  # 問題HTML, 解答HTML

    kan = pick(len(KANYOUKU), r)
    kot = pick(len(KOTOWAZA), r)
    han = pick(len(HANTAIGO), r)
    kan_fill, kan_mean = kan[0::2], kan[1::2]
    kot_mean, kot_ex = kot[0::2], kot[1::2]
    han_choice, han_fill = han[0::2], han[1::2]

    # 一 慣用句：体の一部を書く
    items, ans = [], []
    for n, i in enumerate(kan_fill, 1):
        _, _, part, _, ex = KANYOUKU[i]
        blank = ex.replace(part, '<span class="box"></span>', 1)
        items.append(f"<li>{blank}</li>")
        ans.append(f"<li><b>{part}</b>（{KANYOUKU[i][0]}）</li>")
    q.append(section("一", "次の文の□に、体の一部を表すことばを書きなさい。", f'<ol class="q">{"".join(items)}</ol>'))
    a.append(section("一", "", f'<ol class="q">{"".join(ans)}</ol>'))

    # 二 慣用句：意味を選ぶ
    extra = others(len(KANYOUKU), kan, 1, rng)
    opts = kan_mean + extra
    rng.shuffle(opts)
    label = {i: KANA[k] for k, i in enumerate(opts)}
    items = "".join(f'<li><span class="w">{KANYOUKU[i][0]}</span><span class="paren">（　　）</span></li>' for i in kan_mean)
    q.append(section("二", "次の慣用句の意味を後から選び、記号で答えなさい。",
                     f'<ol class="q">{items}</ol>' + choices_block([(label[i], KANYOUKU[i][3]) for i in opts])))
    a.append(section("二", "", '<ol class="q">' + "".join(f"<li><b>{label[i]}</b>（{KANYOUKU[i][3]}）</li>" for i in kan_mean) + "</ol>"))

    # 三 ことわざ：意味を選ぶ
    extra = others(len(KOTOWAZA), kot, 1, rng)
    opts = kot_mean + extra
    rng.shuffle(opts)
    label = {i: KANA[k] for k, i in enumerate(opts)}
    items = "".join(f'<li><span class="w">{KOTOWAZA[i][0]}</span><span class="paren">（　　）</span></li>' for i in kot_mean)
    q.append(section("三", "次のことわざの意味を後から選び、記号で答えなさい。",
                     f'<ol class="q">{items}</ol>' + choices_block([(label[i], KOTOWAZA[i][2]) for i in opts])))
    a.append(section("三", "", '<ol class="q">' + "".join(f"<li><b>{label[i]}</b>（{same(i)}）</li>" for i in kot_mean) + "</ol>"))

    # 四 ことわざ：例文に入るものを選ぶ
    extra = others(len(KOTOWAZA), kot, 2, rng)
    opts = kot_ex + extra
    rng.shuffle(opts)
    label = {i: KANA[k] for k, i in enumerate(opts)}
    items = ""
    for i in kot_ex:
        ex = re.sub(r"\[\[.*?\]\]", "（　　　　　　　）", KOTOWAZA[i][3])
        items += f'<li>{esc(ex)}<span class="paren">（　　）</span></li>'
    q.append(section("四", "次の文の（　　　）に当てはまることわざを後から選び、記号で答えなさい。",
                     f'<ol class="q">{items}</ol>' + choices_block([(label[i], KOTOWAZA[i][0]) for i in opts])))
    a.append(section("四", "", '<ol class="q">' + "".join(f"<li><b>{label[i]}</b>（{same(i)}）</li>" for i in kot_ex) + "</ol>"))

    # 五 反対語：選ぶ
    extra = others(len(HANTAIGO), han, 2, rng)
    opts = han_choice + extra
    rng.shuffle(opts)
    label = {i: KANA[k] for k, i in enumerate(opts)}
    items = "".join(f'<li><span class="w">{HANTAIGO[i][0]}</span> ⇔ <span class="paren">（　　）</span></li>' for i in han_choice)
    q.append(section("五", "次のことばと反対の意味を持つものを後から選び、記号で答えなさい。",
                     f'<ol class="q grid">{items}</ol>' + choices_block([(label[i], HANTAIGO[i][2]) for i in opts])))
    a.append(section("五", "", '<ol class="q">' + "".join(f"<li><b>{label[i]}</b>（{pair(i)}）</li>" for i in han_choice) + "</ol>"))

    # 六 反対語：例文の□に漢字一字
    items, ans = [], []
    for i in han_fill:
        w, _, opp, yomi, _, ex = HANTAIGO[i]
        hint = f'{opp[:-1]}<span class="box"></span><span class="yomi">（{yomi}）</span>'
        body = esc(ex).replace(esc(opp), hint, 1).replace(esc(w), f"<u>{esc(w)}</u>", 1)
        items.append(f"<li>{body}</li>")
        ans.append(f"<li><b>{opp[-1]}</b>（{pair(i)}）</li>")
    q.append(section("六", "次の文の――線のことばの反対語になるように、□に漢字一字を書きなさい。", f'<ol class="q">{"".join(items)}</ol>'))
    a.append(section("六", "", f'<ol class="q">{"".join(ans)}</ol>'))

    total = len(kan) + len(kot) + len(han)
    return q, a, total, (kan, kot, han)


def same(i):
    w, alt = KOTOWAZA[i][0], KOTOWAZA[i][1]
    return f"{w}　※同じ意味：{alt}" if alt else w


def pair(i):
    w, _, opp, _, alt, _ = HANTAIGO[i]
    return f"{w}⇔{opp}" + (f"　※{alt} も" if alt else "")


def section(no, title, body):
    head = f'<h2><span class="no">{no}</span>{esc(title)}</h2>' if title else f'<h2><span class="no">{no}</span></h2>'
    return f'<section>{head}{body}</section>'


CSS = """
@page { size: A4; margin: 14mm 14mm; }
:root { --ink:#222; --line:#999; --accent:#1f5f8b; }
body { font-family: 'IPAGothic', 'Hiragino Sans', 'Yu Gothic', sans-serif; color: var(--ink); background:#fff; font-size: 13pt; line-height: 1.75; margin: 0; }
header { display:flex; flex-wrap:wrap; gap:4px 12px; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid var(--ink); padding-bottom: 4px; margin-bottom: 10px; }
header h1 { font-size: 17pt; margin: 0; }
header .meta { font-size: 11pt; }
header .meta span { display:inline-block; border-bottom:1px solid var(--line); min-width: 9em; margin-left: .6em; }
section { margin: 0 0 10px; break-inside: avoid; }
h2 { font-size: 12.5pt; margin: 8px 0 4px; font-weight: bold; }
h2 .no { display:inline-block; border:1.5px solid var(--ink); padding: 0 6px; margin-right: 8px; }
ol.q { margin: 0; padding-left: 2em; }
ol.q li { margin: 3px 0; }
ol.grid { display:grid; grid-template-columns: 1fr 1fr; column-gap: 2em; }
.w { display:inline-block; min-width: 11em; font-weight: bold; }
ol.grid .w { min-width: 3em; }
.paren { white-space: nowrap; margin-left: .5em; }
.box { display:inline-block; width: 1.6em; height: 1.6em; border: 1.5px solid var(--ink); vertical-align: middle; margin: 0 2px; }
.yomi { font-size: 9.5pt; color: #555; }
ul.choices { list-style:none; border:1px solid var(--line); padding: 6px 12px; margin: 6px 0 0 1.5em; font-size: 11.5pt; }
ul.choices li { margin: 2px 0; }
.answer { break-before: page; }
.answer h1 { color: var(--accent); }
.answer ol.q li { font-size: 11.5pt; margin: 1px 0; }
.answer section { margin-bottom: 4px; }
.score { text-align:right; font-size: 11pt; margin-top: 6px; }
"""


def page(r, q, a, total):
    title = f"慣用句・ことわざ・反対語テスト 第{r + 1}回"
    return f"""<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title><style>{CSS}</style></head><body>
<header><h1>{esc(title)}</h1><div class="meta">名前<span></span>　点数<span style="min-width:4em"></span>／{total}</div></header>
{''.join(q)}
<div class="answer"><header><h1>第{r + 1}回　答え</h1><div class="meta">各1点・{total}点満点</div></header>
{''.join(a)}</div>
</body></html>"""


def main():
    os.makedirs(OUT, exist_ok=True)
    cover = {"慣用句": set(), "ことわざ": set(), "反対語": set()}
    lines = []
    for r in range(ROUNDS):
        q, a, total, (kan, kot, han) = build_round(r)
        with open(os.path.join(OUT, f"test_round{r + 1}.html"), "w") as f:
            f.write(page(r, q, a, total))
        cover["慣用句"] |= set(kan); cover["ことわざ"] |= set(kot); cover["反対語"] |= set(han)
        lines.append(f"| 第{r + 1}回 | {'・'.join(str(i + 1) for i in kan)} | {'・'.join(str(i + 1) for i in kot)} | {'・'.join(str(i + 1) for i in han)} | {total} |")
    assert len(cover["慣用句"]) == len(KANYOUKU)
    assert len(cover["ことわざ"]) == len(KOTOWAZA)
    assert len(cover["反対語"]) == len(HANTAIGO)
    with open(os.path.join(OUT, "coverage.md"), "w") as f:
        f.write("| 回 | 慣用句 | ことわざ | 反対語 | 問題数 |\n|---|---|---|---|---|\n" + "\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
