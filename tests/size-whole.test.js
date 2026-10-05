import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSize } from '../src/index.js';

describe('formatSize — options object', () => {
  it('decimals', () => assert.equal(formatSize(1536, { decimals: 2 }), '1.50 KB'));
  it('empty options behave as the default', () => assert.equal(formatSize(1536, {}), '1.5 KB'));
});

// Every expected value below is what the PHP SugarCommerce\Format\Bytes::format()
// printed for the same input, so the two cannot drift apart unnoticed.
describe('formatSize — wholeUnits (the PHP Bytes::format rule)', () => {
  const binary = [
    [0, '0 B'], [1, '1 B'], [1023, '1023 B'], [1024, '1 KB'], [1536, '1.5 KB'], [1075, '1 KB'],
    [104857600, '100 MB'], [104333312, '99.5 MB'], [1047552, '1023 KB'], [1048063, '1,023.5 KB'],
    [1024512, '1,000.5 KB'], [52428800, '50 MB'], [1073741824, '1 GB'], [5368709120, '5 GB'],
    [1125899906842624, '1 PB'], [-1536, '-1.5 KB'], [999, '999 B'], [1000, '1000 B'], [1500, '1.5 KB'],
  ];
  const si = [
    [1023, '1 kB'], [1075, '1.1 kB'], [104857600, '104.9 MB'], [104333312, '104.3 MB'],
    [1048063, '1 MB'], [52428800, '52.4 MB'], [1073741824, '1.1 GB'], [-1536, '-1.5 kB'], [999, '999 B'],
  ];

  for (const [bytes, expected] of binary) {
    it(`${bytes} → ${expected}`, () => assert.equal(formatSize(bytes, { wholeUnits: true }), expected));
  }

  for (const [bytes, expected] of si) {
    it(`${bytes} (si) → ${expected}`, () => assert.equal(formatSize(bytes, { wholeUnits: true, si: true }), expected));
  }

  it('nullish → empty', () => assert.equal(formatSize(null, { wholeUnits: true }), ''));
});
