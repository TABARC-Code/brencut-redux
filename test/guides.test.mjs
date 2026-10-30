import test from 'node:test';
import assert from 'node:assert/strict';
import {findGuides} from '../src/guides.js';
const sheet={w:1200,h:2100};
const item=(x,y,sw=200,sh=200,rot=0)=>({x,y,sw,sh,s:1,rot});
test('sheet centre appears when artwork centre is close',()=>{
 const k=item(504,950); const before={...k};
 assert.deepEqual(findGuides(k,[],sheet,12),{x:600,y:1050});
 assert.deepEqual(k,before);
});
test('guides align to another sticker edge or centre',()=>{
 const other=item(100,100,200,300);
 const current=item(298,200,100,100);
 assert.deepEqual(findGuides(current,[other],sheet,12),{x:300,y:250});
});
test('rotated bounds are respected',()=>{
 const k=item(450,950,100,300,1);
 assert.equal(findGuides(k,[],sheet,12).x,600);
});
test('distant artwork has no guides and invalid tolerance is ignored',()=>{
 assert.deepEqual(findGuides(item(10,10),[],sheet,12),{x:null,y:null});
 assert.deepEqual(findGuides(item(10,10),[],sheet,-1),{x:null,y:null});
});
