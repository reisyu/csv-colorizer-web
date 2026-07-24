#!/usr/bin/env node
/*
 * すべてのテストをまとめて実行する。
 *
 * 使い方:  node tests/run_all.js
 *
 * 注意: index.html の計算ロジックを変更した場合は、先に
 *   node extract_for_tests.js
 * を実行して extracted.js を更新すること。
 */
"use strict";
const { execFileSync } = require("child_process");
const path = require("path");

const TESTS = [
  ["test_suite.js", "幾何計算・色計算"],
  ["test_rectline.js", "傾きライン"],
  ["test_palette.js", "カテゴリ色パレット"],
  ["test_fitview.js", "全体表示のフィット"],
  ["test_winding.js", "GLB法線の巻き順"],
  ["test_adversarial.js", "異常入力への耐性"],
  ["test_rhino_dxf.js", "Rhino形式DXF"],
  ["integration_test.js", "実データ統合"],
];

let failed = 0;
for (const [file, label] of TESTS) {
  process.stdout.write(`${label.padEnd(20, "　")} `);
  try {
    const out = execFileSync("node", [path.join(__dirname, file)], { encoding: "utf8" });
    const summary = out.trim().split("\n").filter((l) => l.includes("=====")).pop() || "完了";
    console.log(summary.replace(/=/g, "").trim());
  } catch (e) {
    failed++;
    console.log("失敗");
    // 失敗の詳細を表示する
    const out = (e.stdout || "") + (e.stderr || "");
    out.trim().split("\n").filter((l) => l.includes("NG") || l.includes("Error")).forEach((l) => {
      console.log(`    ${l.trim()}`);
    });
  }
}

console.log();
if (failed === 0) {
  console.log("すべてのテストが成功しました。");
} else {
  console.log(`${failed} 個のテストファイルが失敗しました。`);
  process.exit(1);
}
