import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCategoryFromName, getKindFromName, getLabelFromName, getPreviewKind } from '../src/index.js';

describe('getKindFromName', () => {
  const cases = [
    ['Loop.WAV', 'audio'],
    ['Artwork.png', 'image'],
    ['Stems.zip', 'archive'],
    ['Manual.pdf', 'document'],
    ['teaser.mov', 'video'],
    ['Grotto Sans.otf', 'font'],
    ['Grotto Sans.woff2', 'font'],
    ['Prism.vst3', 'software'],
    ['Prism-v1.3-Windows.exe', 'software'],
    ['Installer.pkg', 'software'],
    ['Film Look.cube', 'software'],
    ['Lead.fxp', 'software'],
    ['notes', 'other'],
    ['weird.xyz', 'other'],
  ];
  for (const [name, kind] of cases) it(`${name} → ${kind}`, () => assert.equal(getKindFromName(name), kind));

  it('leaves the categories as they were (fonts and software are still "other" there)', () => {
    assert.equal(getCategoryFromName('Grotto Sans.otf'), 'other');
    assert.equal(getCategoryFromName('Prism.vst3'), 'other');
  });
});

describe('getLabelFromName', () => {
  it('names the extension and what it is', () => {
    assert.equal(getLabelFromName('Midnight Drive.wav'), 'WAV audio');
    assert.equal(getLabelFromName('packs/Night Shift.zip'), 'ZIP archive');
    assert.equal(getLabelFromName('Grotto.otf'), 'OTF font');
    assert.equal(getLabelFromName('Prism.vst3'), 'VST3 file');
    assert.equal(getLabelFromName('notes.xyz'), 'XYZ file');
    assert.equal(getLabelFromName('README'), 'File');
    assert.equal(getLabelFromName('https://x.test/a.mp3?sig=1'), 'MP3 audio');
  });
});

describe('getPreviewKind', () => {
  it('says which element previews a file, for what every browser renders', () => {
    assert.equal(getPreviewKind('cover.webp'), 'image');
    assert.equal(getPreviewKind('take.flac'), 'audio');
    assert.equal(getPreviewKind('teaser.mp4'), 'video');
    assert.equal(getPreviewKind('session.aiff'), null);
    assert.equal(getPreviewKind('logo.svg'), null);
    assert.equal(getPreviewKind('Manual.pdf'), null);
    assert.equal(getPreviewKind('Stems.zip'), null);
  });
});
