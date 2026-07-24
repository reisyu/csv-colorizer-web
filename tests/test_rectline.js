"use strict";
const F = require("./extracted.js");
let pass=0, fail=0;
const ok=(c,n)=>{ c?pass++:fail++; console.log(`  ${c?"OK":"NG!!"}: ${n}`); };
const approx=(a,b,e=1e-6)=>Math.abs(a-b)<e;

// 垂直壁(XZ面)上、面内20度回転した 4x0.5 の矩形
const c20=Math.cos(20*Math.PI/180), s20=Math.sin(20*Math.PI/180);
const verts=[];
for (const [u,v] of [[-2,-0.25],[2,-0.25],[2,0.25],[-2,0.25]]) {
  verts.push([u*c20 - v*s20 + 10, 0, u*s20 + v*c20 + 5]);  // 中心(10,0,5)にオフセット
}
const a = F.computeContourAttributes(verts);
ok(a !== null, "計算成功");
ok(approx(a.rectAngle, 20, 0.01), `RectAngle=20 (${a.rectAngle.toFixed(3)})`);

// 中心線の検証
const A=a.rectLine.a, B=a.rectLine.b;
const mid=[(A[0]+B[0])/2,(A[1]+B[1])/2,(A[2]+B[2])/2];
ok(approx(mid[0],10,1e-6)&&approx(mid[2],5,1e-6), `中心線の中点=矩形中心 (${mid.map(x=>x.toFixed(4))})`);
const len=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]);
ok(approx(len, a.width, 1e-6), `中心線の長さ=Width (${len.toFixed(4)} vs ${a.width.toFixed(4)})`);
// 線の傾き = RectAngle と一致するか(XZ面内、水平基準に対する角度)
const dir=[(B[0]-A[0])/len, (B[1]-A[1])/len, (B[2]-A[2])/len];
let lineAngle = Math.atan2(dir[2], dir[0]) * 180/Math.PI;
// 線分は方向を持たないので、傾きを[-90, 90]に正規化して比較する
lineAngle = ((lineAngle + 90) % 180 + 180) % 180 - 90;
ok(approx(Math.abs(lineAngle), 20, 0.01), `線分としての傾き=±20° (${lineAngle.toFixed(3)})`);

// symmetricAngleColor(対称グラデーション)の検証
const BLUE = [0.14, 0.34, 0.90], RED = [0.90, 0.13, 0.13];
const cm45 = F.symmetricAngleColor(-45, BLUE, RED);
const c0 = F.symmetricAngleColor(0, BLUE, RED);
const cp45 = F.symmetricAngleColor(45, BLUE, RED);
ok(cm45[0] > 0.85, `-45°=赤 (${cm45.map(x=>x.toFixed(2))})`);
ok(c0[2] > 0.85 && c0[0] < 0.3, `0°=青 (${c0.map(x=>x.toFixed(2))})`);
ok(cp45[0] > 0.85, `+45°=赤 (${cp45.map(x=>x.toFixed(2))})`);
ok(approx(cm45[0], cp45[0]) && approx(cm45[2], cp45[2]), "±45°が対称(同色)");
ok(F.symmetricAngleColor(99, BLUE, RED)[0] > 0.85, "範囲外はクランプ");
// 中間: ±22.5°は中央と端の中間色
const midCol = F.symmetricAngleColor(22.5, BLUE, RED);
ok(approx(midCol[0], (BLUE[0]+RED[0])/2, 1e-9), "±22.5°=中間色");

console.log(`\n===== ${pass}成功 / ${fail}失敗 =====`);
process.exit(fail?1:0);
