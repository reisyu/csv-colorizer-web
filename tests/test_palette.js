"use strict";
// 黄金角パレットの検証: 実コードから抽出した関数で色の重複がないことを確認
const { categoryColorByIndex } = require("./extracted.js");

let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log(`  ${c ? "OK" : "NG!!"}: ${n}`); };

// 50色生成して、隣接色・全ペアの最小距離を確認
const colors = [];
for (let i = 0; i < 50; i++) colors.push(categoryColorByIndex(i));
ok(colors.every(c => c.every(x => x >= 0 && x <= 1)), "50色すべて有効なRGB値");

let minDist = Infinity, minPair = null;
for (let i = 0; i < 50; i++) {
  for (let j = i + 1; j < 50; j++) {
    const d = Math.hypot(colors[i][0]-colors[j][0], colors[i][1]-colors[j][1], colors[i][2]-colors[j][2]);
    if (d < minDist) { minDist = d; minPair = [i, j]; }
  }
}
console.log(`  50色の最小色距離: ${minDist.toFixed(4)} (ペア: ${minPair})`);
ok(minDist > 0.03, "50色まで完全な色重複なし");

// 連続する20色(パレット超過直後)が互いに離れているか
let adjMin = Infinity;
for (let i = 20; i < 39; i++) {
  const d = Math.hypot(colors[i][0]-colors[i+1][0], colors[i][1]-colors[i+1][1], colors[i][2]-colors[i+1][2]);
  if (d < adjMin) adjMin = d;
}
console.log(`  黄金角生成の隣接色距離(最小): ${adjMin.toFixed(4)}`);
ok(adjMin > 0.2, "自動生成域でも隣接カテゴリが十分離れた色になる");

console.log(`\n===== ${pass}成功 / ${fail}失敗 =====`);
process.exit(fail ? 1 : 0);
