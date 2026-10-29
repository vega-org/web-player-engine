import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/player/errors.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}});
const {normalizePlaybackError}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('preserves structured and native decoder messages',()=>{
  assert.equal(normalizePlaybackError({message:'Decoder failed'}).category,'DECODER_FAILURE');
  assert.equal(normalizePlaybackError({error:{message:'Video decoder failed'}}).message,'Video decoder failed');
  assert.equal(normalizePlaybackError(new Error('Failed to fetch')).category,'NETWORK_ERROR');
  assert.match(normalizePlaybackError(-2).message,/code: -2/);
  const structured=normalizePlaybackError({error:{message:'decode failed',code:-5},headers:{Cookie:'secret'}});
  assert.match(structured.rawDetails,/decode failed/);
  assert.match(structured.rawDetails,/-5/);
  assert.ok(!structured.rawDetails.includes('secret'));
});

test('URL-only and empty errors produce a visible explanation without source credentials',()=>{
  const error=normalizePlaybackError('https://example.com/video.mkv?signature=secret');
  assert.equal(error.category,'UNKNOWN_ERROR');
  assert.match(error.message,/did not provide an error reason/);
  assert.ok(!error.message.includes('secret'));
  assert.match(normalizePlaybackError({}).message,/Playback failed/);
});
