/**
 * @arraypress/file-utils — filename handling
 *
 * Sanitize filenames for safe storage and Content-Disposition headers.
 * Prevents path traversal, header injection, and filesystem issues.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module
 */

/**
 * Characters that are unsafe in filenames across platforms.
 * Covers Windows reserved chars, path separators, null bytes,
 * and characters that break HTTP headers.
 */
const UNSAFE = /[/\\:*?"<>|\x00-\x1f\x7f]/g;

/**
 * Windows reserved device names (case-insensitive).
 */
const RESERVED = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.|$)/i;

/**
 * Sanitize a filename for safe storage and HTTP headers.
 *
 * Strips path separators, control characters, and platform-unsafe
 * characters. Prevents path traversal (`../`), null byte injection,
 * and Content-Disposition header injection.
 *
 * @param {string} filename - The raw filename to sanitize.
 * @param {Object} [options] - Options.
 * @param {string} [options.fallback='file'] - Fallback name if result is empty.
 * @param {number} [options.maxLength=255] - Max filename length.
 * @param {string} [options.replacement='_'] - Character to replace unsafe chars with.
 * @returns {string} Safe filename.
 *
 * @example
 * sanitize('report.pdf')                    // 'report.pdf'
 * sanitize('../../uploads/report.pdf')      // 'report.pdf'
 * sanitize('my "file".txt')                 // 'my _file_.txt'
 * sanitize('file\x00name.zip')              // 'file_name.zip'
 * sanitize('')                              // 'file'
 * sanitize('CON.txt')                       // '_CON.txt'
 * sanitize('a'.repeat(300) + '.pdf')        // truncated to 255 chars
 */
export function sanitize(filename, options = {}) {
  const { fallback = 'file', maxLength = 255, replacement = '_' } = options;

  if (!filename || typeof filename !== 'string') return fallback;

  let safe = filename
    // Strip path separators and directory components
    .replace(/^.*[/\\]/, '')
    // Replace unsafe characters
    .replace(UNSAFE, replacement)
    // Collapse multiple replacements
    .replace(new RegExp(`\\${replacement}{2,}`, 'g'), replacement)
    // Remove leading/trailing dots and spaces (Windows issues)
    .replace(/^[\s.]+|[\s.]+$/g, '');

  // Block Windows reserved names
  if (RESERVED.test(safe)) {
    safe = replacement + safe;
  }

  // Truncate preserving extension
  if (safe.length > maxLength) {
    const ext = extensionFromName(safe);
    const maxBase = maxLength - (ext ? ext.length + 1 : 0);
    safe = safe.slice(0, maxBase) + (ext ? '.' + ext : '');
  }

  return safe || fallback;
}

/**
 * Build a safe Content-Disposition header value.
 *
 * Sanitizes the filename and returns a properly formatted header
 * with both ASCII `filename` and UTF-8 `filename*` (RFC 5987).
 *
 * @param {string} filename - The raw filename.
 * @param {'attachment'|'inline'} [disposition='attachment'] - Disposition type.
 * @returns {string} Content-Disposition header value.
 *
 * @example
 * contentDisposition('report.pdf')
 * // → 'attachment; filename="report.pdf"'
 *
 * contentDisposition('résumé.pdf')
 * // → 'attachment; filename="resume.pdf"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9.pdf'
 *
 * contentDisposition('photo.jpg', 'inline')
 * // → 'inline; filename="photo.jpg"'
 */
export function contentDisposition(filename, disposition = 'attachment') {
  const safe = sanitize(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, '_');
  let header = `${disposition}; filename="${ascii}"`;

  // Add RFC 5987 filename* if there are non-ASCII chars
  if (ascii !== safe) {
    const encoded = encodeURIComponent(safe).replace(/'/g, '%27');
    header += `; filename*=UTF-8''${encoded}`;
  }

  return header;
}

/**
 * Get the extension from a filename.
 *
 * @param {string} filename
 * @returns {string} Extension without dot, or empty string.
 *
 * @example
 * extensionFromName('report.pdf')     // 'pdf'
 * extensionFromName('archive.tar.gz') // 'gz'
 * extensionFromName('README')         // ''
 * extensionFromName('.gitignore')     // 'gitignore'
 */
export function extensionFromName(filename) {
  if (!filename) return '';
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return '';
  return filename.slice(dot + 1).toLowerCase();
}

/**
 * Replace the extension of a filename.
 *
 * @param {string} filename - Original filename.
 * @param {string} ext - New extension (without dot).
 * @returns {string} Filename with new extension.
 *
 * @example
 * replaceExtension('photo.png', 'webp')  // 'photo.webp'
 * replaceExtension('README', 'md')       // 'README.md'
 */
export function replaceExtension(filename, ext) {
  if (!filename) return ext ? `file.${ext}` : 'file';
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return ext ? `${base}.${ext}` : base;
}

/**
 * Characters that are invisible or change direction: control characters,
 * zero-width spaces and joiners, bidirectional overrides, the byte-order mark.
 * A right-to-left override is how `invoice‮fdp.exe` displays as
 * `invoiceexe.pdf`.
 */
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u001f\u007f​-‏‪-‮⁠-⁤﻿]/g;

/** Any letter or digit, in any script. */
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

/**
 * The name a file ends up with when someone renames it, keeping its
 * extension whatever they typed — or `''` when what they typed will not do.
 *
 * The extension stays because the file was checked, played and opened by it:
 * a rename from `.wav` to `.exe` is a different file as far as an upload
 * inspector, an `<audio>` element and the buyer's computer are concerned.
 * Typing the extension anyway is fine — it is not doubled.
 *
 * Invisible and direction-changing characters go, whitespace collapses, path
 * separators become `-` (a slash is a directory to unzip tools and some save
 * dialogs), and leading/trailing dots and spaces go. A name with no letter
 * or digit left is refused. The same rules as SugarCart's
 * `Uploads::renamed()` / file-inspect `Filename::rename()` in PHP; lengths
 * are counted in code points, as PHP's `mb_*` functions count them.
 *
 * @param {string} current - The file's name now.
 * @param {string} typed - What was typed, with or without the extension.
 * @param {number} [max=255] - Longest name, extension included.
 * @returns {string} The new name, or `''`.
 *
 * @example
 * renameKeepingExtension('Master.wav', 'Final mix')     // 'Final mix.wav'
 * renameKeepingExtension('Master.wav', 'Final mix.WAV') // 'Final mix.wav'
 * renameKeepingExtension('Master.wav', 'evil.exe')      // 'evil.exe.wav'
 * renameKeepingExtension('Master.wav', 'a/b')           // 'a-b.wav'
 * renameKeepingExtension('Master.wav', '...')           // ''
 */
export function renameKeepingExtension(current, typed, max = 255) {
  const name = typeof current === 'string' ? current : '';
  const dot = name.lastIndexOf('.');
  const suffix = dot > 0 ? name.slice(dot) : '';

  let base = (typeof typed === 'string' ? typed : '')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[/\\]/g, '-');

  if (suffix !== '' && base.toLowerCase().endsWith(suffix.toLowerCase())) {
    base = base.slice(0, -suffix.length);
  }

  base = base.replace(/^[ .]+|[ .]+$/g, '');

  if (!LETTER_OR_NUMBER.test(base)) {
    return '';
  }

  const room = Math.max(0, max - Array.from(suffix).length);

  return Array.from(base).slice(0, room).join('').replace(/[ .]+$/, '') + suffix;
}

/**
 * Convert a filename to a human-readable title.
 *
 * Strips the extension, replaces hyphens/underscores/dots with spaces,
 * collapses whitespace, and title-cases each word. Useful for auto-generating
 * alt text, titles, and display names from filenames.
 *
 * @param {string} filename - The filename to humanize.
 * @returns {string} Human-readable title.
 *
 * @example
 * humanize('my-product-banner.jpg')           // 'My Product Banner'
 * humanize('dark_ambient_loop_01.wav')        // 'Dark Ambient Loop 01'
 * humanize('IMG_20240315_142030.png')         // 'IMG 20240315 142030'
 * humanize('résumé-final-v2.pdf')             // 'Résumé Final V2'
 * humanize('')                                // ''
 * humanize(null)                              // ''
 */
export function humanize(filename) {
  if (!filename) return '';
  return filename
    .replace(/\.[^.]+$/, '')           // strip extension
    .replace(/[-_.]+/g, ' ')           // replace separators with spaces
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()); // title case
}
