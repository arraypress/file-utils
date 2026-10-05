import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renameKeepingExtension, getCategoryFromName, inlineType, isPlayableAudio } from '../src/index.js';

describe('renameKeepingExtension', () => {
  const current = 'Midnight Drive - Master.wav';
  const cases = [
    ['a new name', 'Final mix', 'Final mix.wav'],
    ['the extension typed too', 'Final mix.wav', 'Final mix.wav'],
    ['the extension in another case', 'Final mix.WAV', 'Final mix.wav'],
    ['another extension is part of the name', 'evil.exe', 'evil.exe.wav'],
    ['separators become dashes', 'stems/kick\\snare', 'stems-kick-snare.wav'],
    ['whitespace collapses', '  Final \t  mix  ', 'Final mix.wav'],
    ['leading and trailing dots go', '..hidden..', 'hidden.wav'],
    ['a direction override goes', 'invoice‮fdp', 'invoicefdp.wav'],
    ['zero-width characters go', 'Fi​nal', 'Final.wav'],
    ['no letter or digit is refused', '...', ''],
    ['punctuation alone is refused', ' - ', ''],
    ['other scripts count', 'テスト', 'テスト.wav'],
  ];

  for (const [label, typed, expected] of cases) {
    it(label, () => assert.equal(renameKeepingExtension(current, typed), expected));
  }

  it('a name without an extension gets none', () => assert.equal(renameKeepingExtension('README', 'Read me'), 'Read me'));
  it('non-strings are refused', () => assert.equal(renameKeepingExtension('a.wav', ['name']), ''));
  it('fits the limit, extension included', () => {
    const name = renameKeepingExtension('a.wav', 'x'.repeat(300));
    assert.equal(name.length, 255);
    assert.ok(name.endsWith('x.wav'));
  });
  it('counts characters, not code units', () => {
    const name = renameKeepingExtension('a.wav', '𝐀'.repeat(300), 10);
    assert.equal(Array.from(name).length, 10);
  });
  it('a custom limit', () => assert.equal(renameKeepingExtension('a.wav', 'abcdefgh', 7), 'abc.wav'));
});

describe('getCategoryFromName', () => {
  const cases = [
    ['Midnight Drive - Master.wav', 'audio'],
    ['LOOP.MP3', 'audio'],
    ['groove.mid', 'audio'],
    ['Artwork.png', 'image'],
    ['cover.psd', 'image'],
    ['teaser.mov', 'video'],
    ['Stems.zip', 'archive'],
    ['bundle.tgz', 'archive'],
    ['Licence Agreement.pdf', 'document'],
    ['Read Me First.txt', 'document'],
    ['Budget.xlsx', 'document'],
    ['Deck.key', 'document'],
    ['song.wav.zip', 'archive'],
    ['preset.fxp', 'other'],
    ['plugin.php', 'other'],
    ['font.woff2', 'other'],
    ['README', 'other'],
    ['https://example.com/a.png?x=1#y', 'image'],
    ['', 'other'],
  ];

  for (const [name, expected] of cases) {
    it(`${name || '(empty)'} → ${expected}`, () => assert.equal(getCategoryFromName(name), expected));
  }
});

describe('inlineType / isPlayableAudio', () => {
  const cases = [
    ['Midnight Drive.MP3', 'audio/mpeg'],
    ['master.wav', 'audio/wav'],
    ['a.flac', 'audio/flac'],
    ['stem.m4a', 'audio/mp4'],
    ['take.opus', 'audio/ogg'],
    ['cover.jpg', 'image/jpeg'],
    ['clip.mov', 'video/quicktime'],
    ['terms.pdf', 'application/pdf'],
    ['session.aiff', ''],
    ['drawing.svg', ''],
    ['scan.heic', ''],
    ['stems.zip', ''],
    ['mp3', ''],
  ];

  for (const [name, expected] of cases) {
    it(`${name} → ${expected || "''"}`, () => assert.equal(inlineType(name), expected));
  }

  it('audio is playable', () => assert.equal(isPlayableAudio('stem.m4a'), true));
  it('AIFF is not, outside Safari', () => assert.equal(isPlayableAudio('session.aiff'), false));
  it('a picture is not audio', () => assert.equal(isPlayableAudio('cover.png'), false));
});
