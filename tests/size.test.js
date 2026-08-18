import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSize } from '../src/index.js';

describe('formatSize', () => {
  it('0 bytes', () => assert.equal(formatSize(0), '0 B'));
  it('1 byte', () => assert.equal(formatSize(1), '1 B'));
  it('512 bytes', () => assert.equal(formatSize(512), '512 B'));
  it('1023 bytes', () => assert.equal(formatSize(1023), '1023 B'));
  it('1 KB', () => assert.equal(formatSize(1024), '1.0 KB'));
  it('1.5 KB', () => assert.equal(formatSize(1536), '1.5 KB'));
  it('100 KB', () => assert.equal(formatSize(102400), '100.0 KB'));
  it('1 MB', () => assert.equal(formatSize(1048576), '1.0 MB'));
  it('50 MB', () => assert.equal(formatSize(52428800), '50.0 MB'));
  it('1 GB', () => assert.equal(formatSize(1073741824), '1.0 GB'));
  it('1 TB', () => assert.equal(formatSize(1099511627776), '1.0 TB'));
  it('custom decimals', () => assert.equal(formatSize(1536, 2), '1.50 KB'));
  it('zero decimals', () => assert.equal(formatSize(1536, 0), '2 KB'));
  it('null → empty', () => assert.equal(formatSize(null), ''));
  it('undefined → empty', () => assert.equal(formatSize(undefined), ''));
  it('negative → empty', () => assert.equal(formatSize(-1), ''));
  it('large file', () => assert.equal(formatSize(5368709120), '5.0 GB'));
  it('bytes have no decimals', () => assert.equal(formatSize(42), '42 B'));
});
