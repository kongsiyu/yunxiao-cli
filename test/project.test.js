// test/project.test.js
// Story 9.2: project list 输出排版修复
// 测试 visualWidth 和 padEndVisual 工具函数（src/output.js）
// 这两个函数是修复 project list CJK 宽字符对齐问题的核心。

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { visualWidth, padEndVisual } from '../src/output.js';

describe('visualWidth', () => {
  test('empty string returns 0', () => {
    assert.equal(visualWidth(''), 0);
  });

  test('ASCII characters count as 1 each', () => {
    assert.equal(visualWidth('abc'), 3);
    assert.equal(visualWidth('GJBL'), 4);
    assert.equal(visualWidth('Hello World'), 11);
  });

  test('CJK characters count as 2 each', () => {
    assert.equal(visualWidth('云'), 2);
    assert.equal(visualWidth('云效'), 4);
    assert.equal(visualWidth('云效项目'), 8);
  });

  test('mixed ASCII + CJK counts correctly', () => {
    // '项目' = 4 cols, '-dev' = 4 cols → total 8
    assert.equal(visualWidth('项目-dev'), 8);
    // 'My项目' = 2 + 4 = 6
    assert.equal(visualWidth('My项目'), 6);
  });

  test('Hangul characters count as 2', () => {
    // 한 (U+D55C) is in Hangul Syllables block
    assert.equal(visualWidth('한글'), 4);
  });

  test('fullwidth characters count as 2', () => {
    // Ａ (U+FF21) is in Fullwidth Latin block
    assert.equal(visualWidth('Ａ'), 2);
  });
});

describe('padEndVisual', () => {
  test('pads ASCII string to target width', () => {
    const result = padEndVisual('abc', 10);
    assert.equal(result, 'abc       '); // 3 + 7 spaces
    assert.equal(result.length, 10);
  });

  test('pads CJK string so visual width equals target', () => {
    // '云效项目' visual width = 8; target = 30 → 22 spaces appended
    const result = padEndVisual('云效项目', 30);
    const expectedSpaces = 30 - 8; // 22
    assert.equal(result, '云效项目' + ' '.repeat(expectedSpaces));
    // JS .length = 4 chars + 22 spaces = 26 (not 30, because CJK counts 2 visually)
    assert.equal(visualWidth(result), 30);
  });

  test('returns string unchanged when visualWidth >= targetWidth', () => {
    // 'toolong' = 7 chars, target = 5 → no truncation, returned as-is
    assert.equal(padEndVisual('toolong', 5), 'toolong');
    // CJK over-width: '云效项目ABC' = 8+3 = 11 visual, target = 8 → unchanged
    assert.equal(padEndVisual('云效项目ABC', 8), '云效项目ABC');
  });

  test('exact width returns original string (no extra spaces)', () => {
    // 'abc' = 3 visual, target = 3 → unchanged
    assert.equal(padEndVisual('abc', 3), 'abc');
  });

  test('empty string pads to target width', () => {
    const result = padEndVisual('', 5);
    assert.equal(result, '     ');
  });

  test('project list scenario: mixed names align to same visual width', () => {
    const ascii = padEndVisual('MyProject', 30);
    const chinese = padEndVisual('我的项目名称', 30);
    assert.equal(visualWidth(ascii), 30);
    assert.equal(visualWidth(chinese), 30);
  });
});
