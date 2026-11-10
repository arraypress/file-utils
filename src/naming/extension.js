/**
 * The right extension for a download's type: the one it has when that fits
 * the type the site sent (“.jpeg” for image/jpeg, “.docx” for a Word
 * document), the type's usual one when it's missing or wrong
 * (“download.php” sent as a PDF is “.pdf”), and the one it has whenever the
 * type says nothing (application/octet-stream). Programs keep theirs: what
 * Chrome checks a program by is never changed. Pure; the type tables are
 * @arraypress/file-utils'.
 *
 * @module @arraypress/file-utils/naming/extension
 */

import { extensionFromMime, getCategory, getCategoryFromName } from '../type.js';

/** Types that say nothing about what a file is. */
const VAGUE_TYPES = new Set([
  '', 'application/octet-stream', 'binary/octet-stream', 'application/force-download', 'application/x-download',
  'application/download', 'application/unknown', 'application/binary', 'application/x-msdownload',
]);

/** Extensions of programs and scripts: never changed, never given. */
const PROGRAMS = new Set([
  'exe', 'msi', 'msix', 'appx', 'dmg', 'pkg', 'app', 'apk', 'deb', 'rpm', 'appimage', 'bat', 'cmd', 'com', 'scr', 'ps1',
  'vbs', 'js', 'jse', 'wsf', 'jar', 'sh', 'command', 'py', 'reg', 'lnk', 'crx', 'xpi',
]);

/** Extensions that are the same type as another's usual one. */
const SAME_TYPE = /** @type {Record<string, readonly string[]>} */ ({
  'text/plain': ['txt', 'text', 'log', 'md', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'ini', 'srt', 'vtt'],
  'text/html': ['html', 'htm', 'xhtml'],
  'application/xml': ['xml', 'svg', 'gpx', 'kml', 'rss', 'atom'],
  'text/xml': ['xml', 'svg', 'gpx', 'kml', 'rss'],
  'application/json': ['json', 'geojson', 'map'],
  'application/zip': ['zip', 'docx', 'xlsx', 'pptx', 'epub', 'jar', 'apk', 'ipa', 'sketch', 'odt', 'ods', 'odp', 'cbz', 'whl', 'nupkg'],
  'application/gzip': ['gz', 'tgz', 'tar.gz'],
  'application/x-gzip': ['gz', 'tgz', 'tar.gz'],
  'audio/ogg': ['ogg', 'oga', 'opus'],
  'video/mp4': ['mp4', 'm4v'],
  'audio/mp4': ['m4a', 'm4b', 'mp4', 'aac'],
});

/**
 * Whether an extension fits a type: the type's usual one, one of the same
 * type, or one of the same kind (image, audio, video, document, archive).
 *
 * @param {string} ext - An extension, lowercase.
 * @param {string} mime - A type, lowercase without parameters.
 * @returns {boolean} True when it fits.
 */
function fits(ext, mime) {
  if (extensionFromMime(mime) === ext || SAME_TYPE[mime]?.includes(ext)) return true;
  const kind = getCategory(mime);
  return kind !== 'other' && getCategoryFromName(`x.${ext}`) === kind;
}

/**
 * The extension a download should end with.
 *
 * @param {string} ext - The extension it has (without the dot; '' for none).
 * @param {string | undefined} mime - The type the site sent (`DownloadItem.mime`).
 * @returns {string} The extension to use, as written when it's kept.
 * @example
 * extensionFor('php', 'application/pdf');            // 'pdf'
 * extensionFor('', 'image/png');                      // 'png'
 * extensionFor('JPEG', 'image/jpeg');                 // 'JPEG'
 * extensionFor('bin', 'application/octet-stream');    // 'bin'
 * extensionFor('exe', 'text/html');                   // 'exe'
 */
export function extensionFor(ext, mime) {
  const type = (mime ?? '').toLowerCase().split(';')[0].trim();
  const lower = ext.toLowerCase();
  if (PROGRAMS.has(lower) || VAGUE_TYPES.has(type)) return ext;
  if (lower && fits(lower, type)) return ext;
  const usual = extensionFromMime(type);
  return usual && !PROGRAMS.has(usual) ? usual : ext;
}
