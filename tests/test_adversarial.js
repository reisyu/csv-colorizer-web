"use strict";
const F = require("./extracted.js");
let pass = 0, fail = 0, findings = [];
const ok = (c, n, finding) => {
  c ? pass++ : (fail++, finding && findings.push(finding));
  console.log(`  ${c ? "OK" : "★NG"}: ${n}`);
};

(async () => {
console.log("=== 退化・異常入力 ===");
// 一直線上の輪郭(面積ゼロ)
const line = [[0,0,0],[1,0,0],[2,0,0],[3,0,0]];
let r = null, threw = false;
try { r = F.computeContourAttributes(line); } catch (e) { threw = true; }
ok(!threw, "一直線の輪郭でクラッシュしない", "一直線輪郭で例外");
if (!threw && r) {
  const vals = [r.width, r.height, r.area, r.fillRate, r.tilt, r.rectAngle, r.flatness];
  ok(vals.every(Number.isFinite), `一直線の輪郭で全属性が有限値 (${vals.map(v=>typeof v==='number'?v.toFixed(3):v)})`,
     "一直線輪郭でNaN/Infinity混入");
} else if (!threw) {
  ok(true, "一直線の輪郭はnull(計算不能扱い)");
}

// 同一点の重複だけの輪郭
let r2 = null, threw2 = false;
try { r2 = F.computeContourAttributes([[1,1,1],[1,1,1],[1,1,1]]); } catch (e) { threw2 = true; }
ok(!threw2, "全点同一の輪郭でクラッシュしない", "同一点輪郭で例外");
if (!threw2 && r2 !== null) {
  const vals2 = [r2.width, r2.height, r2.area, r2.fillRate];
  ok(vals2.every(Number.isFinite), "全点同一でも有限値かnull", "同一点でNaN");
}

// 極端に大きい座標(平面直角座標そのまま)
const big = [[-43200,-145680,52],[-43199,-145680,52],[-43199,-145680,53],[-43200,-145680,53]];
const rb = F.computeContourAttributes(big);
ok(rb && Math.abs(rb.area - 1) < 1e-6, `実座標のままでも面積が正確 (${rb ? rb.area : "null"})`, "大座標で精度劣化");

console.log("=== DXFパーサーの頑健性 ===");
// 空文字・EOFのみ
ok((await F.parseDXF("")).length === 0, "空文字列");
ok((await F.parseDXF("  0\nEOF")).length === 0, "EOFのみ");
// SEQENDが無いまま終わるポリライン(切り捨てられたファイル)
const truncated = ["  0","POLYLINE","  8","LayerX"," 70","9",
  "  0","VERTEX","  8","LayerX"," 10","0"," 20","0"," 30","0",
  "  0","VERTEX","  8","LayerX"," 10","1"," 20","0"," 30","0",
  "  0","VERTEX","  8","LayerX"," 10","1"," 20","1"," 30","0"].join("\n");
const tr = await F.parseDXF(truncated);
console.log(`    SEQEND無し: ${tr.length}輪郭 (0=切り捨て / 1=救済)`);
ok(tr.length === 0 || tr.length === 1, "SEQEND無しでもクラッシュしない");

// CRLF改行
const crlf = ["  0","SECTION","  0","POLYLINE","  8","L1"," 70","9",
  "  0","VERTEX"," 10","0"," 20","0"," 30","0",
  "  0","VERTEX"," 10","1"," 20","0"," 30","0",
  "  0","VERTEX"," 10","0"," 20","1"," 30","0",
  "  0","SEQEND","  0","EOF"].join("\r\n");
ok((await F.parseDXF(crlf)).length === 1, "CRLF改行のDXF");

console.log("=== ID正規化の衝突 ===");
ok(F.normalizeId("01") === F.normalizeId("1"), "'01'と'1'は同一視される(仕様: レイヤー名の表記ゆれ吸収)");
ok(F.normalizeId("1e3") === "1000", `'1e3'→'${F.normalizeId("1e3")}'(指数表記も数値化される点は要認識)`);

console.log("=== 色計算の異常系 ===");
const cNaN = F.numericToColor(NaN, 0, 1, "RED_BLUE", null, null, false, null, false);
ok(cNaN.every(Number.isFinite), `NaN入力でも有限のRGB (${cNaN.map(x=>x.toFixed(2))})`, "NaN入力で色が壊れる");
const cRev = F.numericToColor(0.5, 1, 0, "RED_BLUE", null, null, false, null, false); // vmin>vmax
ok(cRev.every(Number.isFinite), "範囲が逆転(vmin>vmax)しても有限のRGB", "逆転範囲で色が壊れる");

console.log(`\n===== ${pass}成功 / ${fail}失敗 =====`);
if (findings.length) console.log("発見事項: " + findings.join(" / "));
process.exit(0);  // 発見が目的なので常に0
})();
