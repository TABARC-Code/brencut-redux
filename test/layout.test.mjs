import test from 'node:test';
import assert from 'node:assert/strict';
import {planLayout} from '../src/layout.js';
const sheet={w:1200,h:2100},gap=53,edge=35;
const sticker=(name,w,h,rot=0)=>({name,sw:w,sh:h,s:1,rot,x:40,y:40});
function shelf(items){let x=edge,y=edge,rowH=0;for(const k of [...items].sort((a,b)=>b.sh-a.sh)){if(x+k.sw>sheet.w-edge&&x>edge){x=edge;y+=rowH+gap;rowH=0;}if(y+k.sh>sheet.h-edge)return false;x+=k.sw+gap;rowH=Math.max(rowH,k.sh);}return true;}
function safe(items,result){
  assert.equal(result.ok,true,result.reason);
  assert.equal(result.placements.length,items.length);
  for(let i=0;i<result.placements.length;i++){
    const p=result.placements[i],k=p.item,w=p.rot%2?k.sh:k.sw,h=p.rot%2?k.sw:k.sh;
    assert.ok(p.x>=edge && p.y>=edge && p.x+w<=sheet.w-edge+1e-6 && p.y+h<=sheet.h-edge+1e-6);
    for(let j=0;j<i;j++){const q=result.placements[j],t=q.item,qw=q.rot%2?t.sh:t.sw,qh=q.rot%2?t.sw:t.sh;
      assert.ok(p.x>=q.x+qw+gap-1e-6 || q.x>=p.x+w+gap-1e-6 || p.y>=q.y+qh+gap-1e-6 || q.y>=p.y+h+gap-1e-6,`${k.name} overlaps ${t.name}`);
    }
  }
}
test('placement is deterministic and never changes the original artwork',()=>{
  const items=[sticker('A',200,300),sticker('B',300,300),sticker('C',100,600),sticker('D',400,250)];
  const before=structuredClone(items),first=planLayout(items,sheet,{gap,edge});
  safe(items,first);assert.deepEqual(first,planLayout(items,sheet,{gap,edge}));assert.deepEqual(items,before);
});
test('failure leaves all positions and dimensions alone',()=>{
  const items=[sticker('large',1100,2000),sticker('extra',300,300)],before=structuredClone(items);
  assert.equal(planLayout(items,sheet,{gap,edge,rotate:true}).ok,false);assert.deepEqual(items,before);
});
test('rotation is opt-in and does not resize',()=>{
  const items=[sticker('wide',1600,500)];
  assert.equal(planLayout(items,sheet,{gap,edge}).ok,false);
  const result=planLayout(items,sheet,{gap,edge,rotate:true});safe(items,result);assert.equal(result.placements[0].rot,1);
  assert.equal(items[0].rot,0);
});
test('prepared full sheets are not repacked',()=>{
  assert.equal(planLayout([{...sticker('sheet',1200,2100),sheet:true}],sheet,{gap,edge}).ok,false);
});
test('dense fixture fits where the original shelf arrangement failed',()=>{
  const sizes=[[244,320],[214,631],[410,558],[107,598],[264,269],[156,227],[485,399],[188,480],[478,297],[678,587]];
  const items=sizes.map(([w,h],i)=>sticker('dense-'+i,w,h));
  assert.equal(shelf(items),false);safe(items,planLayout(items,sheet,{gap,edge}));
});
test('one hundred small stickers remain bounded and separated',()=>{
  const items=Array.from({length:100},(_,i)=>sticker('small-'+i,60,70));
  safe(items,planLayout(items,sheet,{gap,edge}));
});
