import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistory} from '../src/history.js';
const k=(id,x=0)=>({id,name:'sticker',x,y:0,s:1,rot:0,bmp:{id}});
const state=(...items)=>({items,selectedId:items.at(-1)?.id??null});
test('undo and redo restore movement, rotation, removal and order',()=>{
 const h=createHistory(); const a=k(1),b=k(2);
 h.record(state(a,b));h.record(state({...a,x:80,rot:1},b));h.record(state(b));
 assert.deepEqual(h.undo().items.map(i=>[i.id,i.x,i.rot]),[[1,80,1],[2,0,0]]);
 assert.deepEqual(h.undo().items.map(i=>i.id),[1,2]);
 assert.equal(h.canUndo,false);
 assert.equal(h.redo().items[0].x,80);
 assert.deepEqual(h.redo().items.map(i=>i.id),[2]);
 assert.equal(h.canRedo,false);
});
test('new edits discard redo, repeated states are ignored',()=>{
 const h=createHistory(), bmp={id:1};h.record(state({...k(1),bmp}));h.record(state({...k(1,40),bmp}));
 h.undo();assert.equal(h.canRedo,true);
 h.record(state({...k(1,25),bmp}));assert.equal(h.canRedo,false);
 assert.equal(h.record(state({...k(1,25),bmp})),false);
});
test('snapshots do not share mutable geometry and keep bitmap references',()=>{
 const bmp={id:'image'};const original={...k(1),bmp};const h=createHistory();
 h.record(state(original));original.x=400;
 assert.equal(h.undo(),null);
 h.record(state(original));const prev=h.undo();assert.equal(prev.items[0].x,0);
 assert.equal(prev.items[0].bmp,bmp);
 prev.items[0].x=999;assert.equal(h.redo().items[0].x,400);
 assert.equal(h.undo().items[0].x,0);
});
test('bounded history drops old states and reset clears old artwork',()=>{
 const h=createHistory(3);for(let i=0;i<5;i++)h.record(state(k(1,i)));
 assert.equal(h.undo().items[0].x,3);
 assert.equal(h.undo().items[0].x,2);
 assert.equal(h.undo(),null);
 h.reset(state(k(9)));assert.equal(h.canUndo,false);assert.equal(h.canRedo,false);
 assert.equal(h.record(state(k(9,1))),true);
});
