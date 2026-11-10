/**
 * A file name's two halves: what it's called and what kind of file it is.
 * `tar.gz`-style double extensions stay together, and only something that
 * looks like an extension (1–10 letters or digits after the last dot) is
 * one, so "Version 2.0 final" has none. Pure.
 *
 * @module @arraypress/file-utils/naming/split
 */

/** Extensions that go with a `.tar` before them. */
const TAR_PARTS = new Set(['gz', 'bz2', 'xz', 'zst', 'lz', 'z']);

/**
 * A name's base and extension.
 *
 * @typedef {object} NameParts
 * @property {string} base Everything before the extension.
 * @property {string} ext The extension without its dot, as written ('' for none).
 */

/**
 * The last part of a path, whichever way its slashes lean.
 *
 * @param {string} path - A file name or path ("/Users/me/Downloads/a.pdf", "C:\\x\\a.pdf").
 * @returns {string} The file name ("a.pdf").
 * @example
 * baseName('/Users/me/Downloads/Report.pdf'); // 'Report.pdf'
 */
export function baseName(path) {
  return path.split(/[/\\]/).pop() ?? '';
}

/**
 * Split a file name into base and extension.
 *
 * @param {string} name - A file name, not a path.
 * @returns {NameParts} Its parts.
 * @example
 * splitName('Report.PDF');          // { base: 'Report', ext: 'PDF' }
 * splitName('backup.tar.gz');       // { base: 'backup', ext: 'tar.gz' }
 * splitName('Version 2.0 final');   // { base: 'Version 2.0 final', ext: '' }
 * splitName('.bashrc');             // { base: '.bashrc', ext: '' }
 */
export function splitName(name) {
  const match = /^(.+?)\.([A-Za-z0-9]{1,10})$/.exec(name);
  if (!match || /\s/.test(match[2]) || !/[A-Za-z]/.test(match[2]) && match[2].length > 4) return { base: name, ext: '' };
  const [, base, ext] = match;
  const tar = /^(.+)\.(tar)$/i.exec(base);
  if (tar && TAR_PARTS.has(ext.toLowerCase())) return { base: tar[1], ext: `${tar[2]}.${ext}` };
  // "Version 2.0": a number after a number is a version, not an extension.
  if (/^\d+$/.test(ext) && /\d$/.test(base)) return { base: name, ext: '' };
  return { base, ext };
}

/**
 * Put a base and an extension back together.
 *
 * @param {string} base - The name.
 * @param {string} ext - The extension without its dot ('' for none).
 * @returns {string} The file name.
 * @example
 * joinName('Report', 'pdf'); // 'Report.pdf'
 * joinName('README', '');    // 'README'
 */
export function joinName(base, ext) {
  return ext ? `${base}.${ext}` : base;
}
