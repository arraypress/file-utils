/**
 * The right extension for a download's type. A real extension is never
 * changed: the type a site sends is too often a guess (text/plain for
 * “main.c”, “key.pem” and “notebook.ipynb”; application/zip for “deck.key”
 * and “map.kmz”; video/mp4 for “song.m4a”; text/html for “feed.xml”), and
 * the file's own name is what its program opens it by. The type decides
 * only when there is nothing to keep: no extension, or the extension of the
 * server script that sent the file (“download.php” sent as a PDF is
 * “.pdf”). Plain text adds nothing to a name without one (“Makefile”,
 * “LICENSE”), and programs keep theirs: what Chrome checks a program by is
 * never changed or given. Pure; the type tables are @arraypress/file-utils'.
 *
 * @module @arraypress/file-utils/naming/extension
 */

import { extensionFromMime } from '../type.js';

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

/** Extensions of the server scripts and handlers that send files: a page's, not the file's. */
const SERVER_SCRIPTS = new Set([
  'php', 'php3', 'php4', 'php5', 'phtml', 'asp', 'aspx', 'ashx', 'asmx', 'axd', 'jsp', 'jspx', 'jsf', 'do', 'action', 'cgi',
  'fcgi', 'cfm',
]);

/** Types whose usual extension isn't worth adding to a name that has none (“Makefile”, “LICENSE”, “README”). */
const UNNAMED_TYPES = new Set(['text/plain']);

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
 * extensionFor('ipynb', 'text/plain');                // 'ipynb'
 * extensionFor('', 'text/plain');                     // ''
 * extensionFor('exe', 'text/html');                   // 'exe'
 */
export function extensionFor(ext, mime) {
  const type = (mime ?? '').toLowerCase().split(';')[0].trim();
  const lower = ext.toLowerCase();
  if (PROGRAMS.has(lower) || VAGUE_TYPES.has(type)) return ext;
  if (lower ? !SERVER_SCRIPTS.has(lower) : UNNAMED_TYPES.has(type)) return ext;
  const usual = extensionFromMime(type);
  return usual && !PROGRAMS.has(usual) ? usual : ext;
}
