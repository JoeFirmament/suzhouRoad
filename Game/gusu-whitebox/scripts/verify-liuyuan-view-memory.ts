import { strict as assert } from 'node:assert';
import { chapterSceneHref, courtReturnUrl, lvyinBankLine, lvyinSceneUrl } from '../src/core/liuyuan-view-memory.js';

assert.equal(lvyinSceneUrl(false), 'liuyuan-lvyin.html?chapter=1');
assert.equal(lvyinSceneUrl(true), 'liuyuan-lvyin.html?chapter=1&courtWindow=1');
assert.equal(courtReturnUrl(true), 'liuyuan-court.html?chapter=1&courtWindow=1');
assert.equal(chapterSceneHref('liuyuan-court.html', true), 'liuyuan-court.html?chapter=1&draft=1');
assert.equal(chapterSceneHref('liuyuan-flower.html', true), 'liuyuan-flower.html?chapter=1&draft=1');
assert.equal(lvyinSceneUrl(true, true), 'liuyuan-lvyin.html?chapter=1&courtWindow=1&draft=1');
assert.equal(courtReturnUrl(true, true), 'liuyuan-court.html?chapter=1&courtWindow=1&draft=1');
assert.match(lvyinBankLine(true), /窗里/);
assert.doesNotMatch(lvyinBankLine(false), /窗里|方才/);
console.log('Liuyuan court-window memory: OK');
