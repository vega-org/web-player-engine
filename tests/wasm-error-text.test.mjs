import test from 'node:test';
import assert from 'node:assert/strict';
import {readWasmErrorText} from '../scripts/wasm-error-text.mjs';

test('WASM exception text is read from its start, not after its terminator',()=>{
  const memory=new Uint8Array(100);
  memory.set(new TextEncoder().encode('Unsupported bitstream profile'),8);
  assert.equal(readWasmErrorText(8,address=>memory[address]),'Unsupported bitstream profile');
  assert.equal(readWasmErrorText(0,address=>memory[address]),'WASM operation failed');
});

test('WASM exception strings decode UTF-8 and cap unterminated messages',()=>{
  const memory=new TextEncoder().encode('décode\0');
  assert.equal(readWasmErrorText(0,address=>memory[address]),'décode');
  let reads=0;
  assert.equal(readWasmErrorText(0,()=>{reads++;return 65;}).length,4096);
  assert.equal(reads,4096);
});
