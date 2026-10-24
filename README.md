# 4年国語 慣用句・ことわざ・反対語テスト

- `data/` … プリントから書き起こした一覧（慣用句2：30、ことわざ2：26、反対語2：26）
- `tests/data.py` … テスト作成用データ
- `tests/build.py` … テストを4回分作る（全82語がどこかの回に必ず1回出る）
- `tests/render.js` … HTML を印刷用 PDF にする
- `tests/out/test_round{1-4}.pdf` … 1〜2ページ目が問題、最後のページが答え
- `tests/out/coverage.md` … どの回にどの番号が出るか

作り直し: `cd tests && python3 build.py && node render.js`
