import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyImport } from '../src/import.js';
const sheet = {w:1200,h:2100,rasterW:1216,rasterH:2128,padX:8,padY:14};
test('individual sticker mode never strips printer padding based on dimensions alone',()=>{
  assert.deepEqual(classifyImport('stickers',1216,2128,sheet),{sheet:false,crop:null,landscape:false});
  assert.equal(classifyImport('stickers',1200,2100,sheet).sheet,false);
  assert.equal(classifyImport('stickers',140,140,sheet).sheet,false);
});
test('explicit full sheet crops padded raster only when requested',()=>{
  assert.deepEqual(classifyImport('sheet',1216,2128,sheet),{sheet:true,crop:{x:8,y:14,w:1200,h:2100},landscape:false});
  assert.deepEqual(classifyImport('sheet',1200,2100,sheet),{sheet:true,crop:null,landscape:false});
});
test('landscape full sheet is rotated and invalid sheet ratios are rejected',()=>{
  assert.equal(classifyImport('sheet',2100,1200,sheet).landscape,true);
  assert.throws(()=>classifyImport('sheet',500,500,sheet),/aspect ratio/);
});
test('unknown mode and invalid image sizes are rejected',()=>{
  assert.throws(()=>classifyImport('automatic',1200,2100,sheet),/Unknown import mode/);
  assert.throws(()=>classifyImport('stickers',0,2100,sheet),/Invalid artwork dimensions/);
});
