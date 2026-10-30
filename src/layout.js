// Plan a complete sheet before moving anything. Half an arrangement is no arrangement.
const EPS = 1e-7;
const box = k => { const w = k.sw * k.s, h = k.sh * k.s; return k.rot % 2 ? { w: h, h: w } : { w, h }; };
const overlaps = (a,b) => a.x < b.x+b.w-EPS && a.x+a.w > b.x+EPS && a.y < b.y+b.h-EPS && a.y+a.h > b.y+EPS;
const contains = (a,b) => b.x >= a.x-EPS && b.y >= a.y-EPS && b.x+b.w <= a.x+a.w+EPS && b.y+b.h <= a.y+a.h+EPS;
function split(free, used) {
  const next = [];
  for (const f of free) {
    if (!overlaps(f,used)) { next.push(f); continue; }
    if (used.x > f.x+EPS) next.push({x:f.x,y:f.y,w:used.x-f.x,h:f.h});
    if (used.x+used.w < f.x+f.w-EPS) next.push({x:used.x+used.w,y:f.y,w:f.x+f.w-used.x-used.w,h:f.h});
    if (used.y > f.y+EPS) next.push({x:f.x,y:f.y,w:f.w,h:used.y-f.y});
    if (used.y+used.h < f.y+f.h-EPS) next.push({x:f.x,y:used.y+used.h,w:f.w,h:f.y+f.h-used.y-used.h});
  }
  return next.filter((f,i) => f.w>EPS && f.h>EPS && !next.some((other,j) => i!==j &&
    contains(other,f) && (!contains(f,other) || j<i)));
}
function pack(items,order,sheet,edge,gap,rotate) {
  let free=[{x:edge,y:edge,w:sheet.w-2*edge+gap,h:sheet.h-2*edge+gap}];
  const placed=new Map();
  for(const k of order) {
    const b=box(k); let best=null;
    for(const f of free) for(const turn of rotate && Math.abs(b.w-b.h)>EPS ? [0,1] : [0]) {
      const w=(turn?b.h:b.w)+gap, h=(turn?b.w:b.h)+gap;
      if(w>f.w+EPS || h>f.h+EPS) continue;
      const score=[Math.min(f.w-w,f.h-h),Math.max(f.w-w,f.h-h),f.y,f.x,turn];
      if(!best || score.some((v,i)=>v<best.score[i] && score.slice(0,i).every((q,j)=>q===best.score[j])))
        best={x:f.x,y:f.y,w,h,turn,score};
    }
    if(!best) return {ok:false,unplaced:order.filter(k=>!placed.has(k)).map(k=>k.name)};
    placed.set(k,{x:best.x,y:best.y,rot:(k.rot+best.turn)%4});
    free=split(free,best);
  }
  const usedHeight=Math.max(0,...items.map(k=>{const p=placed.get(k),b=box({...k,rot:p.rot});return p.y+b.h;}));
  return {ok:true,placed,usedHeight,rotated:items.filter(k=>placed.get(k).rot!==k.rot).length};
}
export function planLayout(items,sheet,{edge=35,gap=53,rotate=false}={}) {
  if(!Array.isArray(items) || !sheet || !Number.isFinite(sheet.w) || !Number.isFinite(sheet.h) ||
     !Number.isFinite(edge) || edge<0 || !Number.isFinite(gap) || gap<0 ||
     sheet.w<=2*edge || sheet.h<=2*edge || items.length>100 ||
     items.some(k=>!k || !Number.isInteger(k.sw) || !Number.isInteger(k.sh) || k.sw<=0 || k.sh<=0 ||
       !Number.isFinite(k.s) || k.s<=0 || !Number.isInteger(k.rot) || k.rot<0 || k.rot>3))
    return {ok:false,reason:'Invalid artwork or sheet dimensions',unplaced:[]};
  if(items.some(k=>k.sheet)) return {ok:false,reason:'Full-sheet artwork cannot be rearranged',unplaced:items.map(k=>k.name)};
  if(!items.length) return {ok:true,placements:[],usedHeight:0,rotated:0};
  const area=k=>{const b=box(k);return b.w*b.h;};
  const orders=[
    (a,b)=>area(b)-area(a),
    (a,b)=>Math.max(...Object.values(box(b)))-Math.max(...Object.values(box(a))),
    (a,b)=>box(b).h-box(a).h,
    (a,b)=>box(b).w-box(a).w
  ];
  let best=null,failed=null;
  for(const compare of orders) {
    const order=items.map((k,i)=>({k,i})).sort((a,b)=>compare(a.k,b.k)||a.i-b.i).map(o=>o.k);
    const result=pack(items,order,sheet,edge,gap,rotate);
    if(result.ok && (!best || result.usedHeight<best.usedHeight-EPS ||
      (Math.abs(result.usedHeight-best.usedHeight)<=EPS && result.rotated<best.rotated))) best=result;
    else if(!result.ok && (!failed || result.unplaced.length<failed.unplaced.length)) failed=result;
  }
  if(!best) return {ok:false,reason:`${failed?.unplaced.length??items.length} sticker(s) do not fit`,unplaced:failed?.unplaced??[]};
  return {ok:true,placements:items.map(item=>({item,...best.placed.get(item)})),usedHeight:best.usedHeight,rotated:best.rotated};
}
