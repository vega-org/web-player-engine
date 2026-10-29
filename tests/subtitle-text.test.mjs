import test from 'node:test';
import assert from 'node:assert/strict';
import {subtitleTextToAss} from '../scripts/subtitle-text.mjs';

test('SRT formatting becomes ASS styles instead of literal tags', () => {
  assert.equal(subtitleTextToAss('<i>I was born of conflict...</i>'), '{\\i1}I was born of conflict...{\\i0}');
  assert.equal(subtitleTextToAss('<B>bold <i>italic</i></B>'), '{\\b1}bold {\\i1}italic{\\i0}{\\b0}');
  assert.equal(subtitleTextToAss('<i>outer <i>inner</i> outer</i>'), '{\\i1}outer {\\i1}inner{\\i1} outer{\\i0}');
});

test('keeps ASS overrides and handles line breaks and subtitle entities safely', () => {
  assert.equal(subtitleTextToAss('{\\an8}<u>Hello</u>\r\nworld<br/>next'), '{\\an8}{\\u1}Hello{\\u0}\\Nworld\\Nnext');
  assert.equal(subtitleTextToAss('&lt;i&gt;literal&lt;/i&gt; &amp;'), '<i>literal</i> &');
  assert.equal(subtitleTextToAss('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
});
