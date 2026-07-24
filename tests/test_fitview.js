"use strict";
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log(`  ${c ? "OK" : "NG!!"}: ${n}`); };

// レベル3: フィット+リセンタリング
// 距離dを二分探索し、各dで「全頂点を収める平行移動(su,sv)が存在するか」を判定する
function fitView(corners, fov, aspect, forward, margin = 0.05) {
  const cross = (a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const norm = (v)=>{const l=Math.hypot(...v); return [v[0]/l,v[1]/l,v[2]/l];};
  const dot = (a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  let right = cross(forward, [0,1,0]);
  if (Math.hypot(...right) < 1e-6) right = [1,0,0];
  right = norm(right);
  const camUp = norm(cross(right, forward));

  const tanV = Math.tan((fov*Math.PI/180)/2) * (1 - 2*margin);
  const tanH = tanV_raw(fov)*aspect*(1 - 2*margin);
  function tanV_raw(f){ return Math.tan((f*Math.PI/180)/2); }

  // 各頂点のカメラ基底成分
  const pts = corners.map(p => ({ u: dot(p,right), v: dot(p,camUp), f: dot(p,forward) }));

  // 距離dで実行可能か: |u_i - su| <= (d+f_i)*tanH かつ |v_i - sv| <= (d+f_i)*tanV
  // → su の実行可能区間 [max(u_i - w_i), min(u_i + w_i)] が空でないこと(v同様)
  function feasible(d) {
    let loU=-Infinity, hiU=Infinity, loV=-Infinity, hiV=Infinity;
    for (const p of pts) {
      const z = d + p.f;
      if (z <= 1e-9) return null;           // 頂点がカメラの後ろ
      const wU = z * tanH, wV = z * tanV;
      loU = Math.max(loU, p.u - wU); hiU = Math.min(hiU, p.u + wU);
      loV = Math.max(loV, p.v - wV); hiV = Math.min(hiV, p.v + wV);
    }
    if (loU > hiU || loV > hiV) return null;
    return { su: (loU+hiU)/2, sv: (loV+hiV)/2 };  // 区間の中央=余白が対称になる位置
  }

  // 二分探索(上限は外接球フィット距離で必ず実行可能)
  const rad = Math.max(...pts.map(p => Math.hypot(p.u, p.v, p.f)));
  let lo = 1e-4, hi = rad / Math.sin(Math.atan(Math.min(tanV, tanH))) + rad;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (feasible(mid)) hi = mid; else lo = mid;
  }
  const s = feasible(hi);
  return { d: hi, su: s.su, sv: s.sv, right, camUp };
}

// ==== 検証: 実データ相当の壁(152×9×14m)を斜め視点で ====
const FOV=50, ASPECT=1.5;
const size=[152.18, 8.89, 13.94];
const corners=[];
for (let i=0;i<8;i++) corners.push([
  (i&1? size[0]/2 : -size[0]/2),
  (i&2? size[1]/2 : -size[1]/2),
  (i&4? size[2]/2 : -size[2]/2)]);

function screenStats(r, corners, fov, aspect) {
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const tanVr=Math.tan((fov*Math.PI/180)/2), tanHr=tanVr*aspect;
  let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity, allFront=true;
  for (const p of corners) {
    const u=dot(p,r.right)-r.su, v=dot(p,r.camUp)-r.sv, f=dot(p,r.fwd);
    const z=r.d+f;
    if (z<=0) allFront=false;
    mnX=Math.min(mnX,u/(z*tanHr)); mxX=Math.max(mxX,u/(z*tanHr));
    mnY=Math.min(mnY,v/(z*tanVr)); mxY=Math.max(mxY,v/(z*tanVr));
  }
  return {mnX,mxX,mnY,mxY,allFront};
}

const views = [
  ["正面", [0,0,-1]],
  ["斜め(スクショ相当)", (()=>{const v=[-0.85,-0.25,-0.46];const l=Math.hypot(...v);return v.map(x=>x/l);})()],
  ["浅い斜め", (()=>{const v=[-0.3,-0.2,-0.93];const l=Math.hypot(...v);return v.map(x=>x/l);})()],
];
for (const [name, fwd] of views) {
  const r = fitView(corners, FOV, ASPECT, fwd);
  r.fwd = fwd;
  const s = screenStats(r, corners, FOV, ASPECT);
  const mL=(1+s.mnX)/2, mR=(1-s.mxX)/2, mB=(1+s.mnY)/2, mT=(1-s.mxY)/2;
  const tight = Math.min(mL,mR,mB,mT);
  console.log(`${name}: d=${r.d.toFixed(1)}m シフト=(${r.su.toFixed(1)}, ${r.sv.toFixed(1)})`);
  console.log(`  マージン 左${(mL*100).toFixed(1)}% 右${(mR*100).toFixed(1)}% 下${(mB*100).toFixed(1)}% 上${(mT*100).toFixed(1)}%`);
  ok(s.allFront, `${name}: 全頂点がカメラの前`);
  ok(tight > 0.049, `${name}: どの辺も5%以上の余白`);
  ok(Math.abs(tight - 0.05) < 0.002, `${name}: 制約辺の余白がほぼちょうど5%`);
  // 制約軸で左右(または上下)の余白が対称か
  const symH = Math.abs(mL - mR) < 0.01 || Math.min(mB,mT) < Math.min(mL,mR) + 0.001;
  ok(symH, `${name}: 余白が対称に再配分されている`);
}

console.log(`\n===== ${pass}成功 / ${fail}失敗 =====`);
process.exit(fail ? 1 : 0);
