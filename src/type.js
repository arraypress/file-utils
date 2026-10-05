/**
 * @arraypress/file-utils — MIME type classification
 *
 * Classify and label MIME types. Detect images, audio, video,
 * documents, and archives from content-type strings.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module
 */

// ── Known types ────────────────────────────────

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'text/plain',
  'text/csv',
  'text/html',
  'text/markdown',
  'application/rtf',
];

const DOCUMENT_PATTERNS = [
  'openxmlformats',     // .docx, .xlsx, .pptx
  'vnd.ms-',            // .doc, .xls, .ppt
  'vnd.oasis',          // .odt, .ods, .odp
];

const ARCHIVE_TYPES = [
  'application/zip',
  'application/x-zip',
  'application/x-zip-compressed',
  'application/x-rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
  'application/x-bzip2',
];

// ── Type detection ─────────────────────────────

/**
 * Check if a MIME type is an image.
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 *
 * @example
 * isImage('image/png')     // true
 * isImage('image/svg+xml') // true
 * isImage('text/plain')    // false
 */
export function isImage(mime) {
  return !!mime && mime.startsWith('image/');
}

/**
 * Check if a MIME type is audio.
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 */
export function isAudio(mime) {
  return !!mime && mime.startsWith('audio/');
}

/**
 * Check if a MIME type is video.
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 */
export function isVideo(mime) {
  return !!mime && mime.startsWith('video/');
}

/**
 * Check if a MIME type is a document (PDF, Word, Excel, text, etc.).
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 *
 * @example
 * isDocument('application/pdf')   // true
 * isDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document') // true
 * isDocument('image/png')         // false
 */
export function isDocument(mime) {
  if (!mime) return false;
  if (DOCUMENT_TYPES.some(t => mime.startsWith(t))) return true;
  return DOCUMENT_PATTERNS.some(p => mime.includes(p));
}

/**
 * Check if a MIME type is an archive (zip, rar, tar, gzip, 7z, etc.).
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 *
 * @example
 * isArchive('application/zip')   // true
 * isArchive('application/x-7z-compressed') // true
 * isArchive('image/png')         // false
 */
export function isArchive(mime) {
  if (!mime) return false;
  return ARCHIVE_TYPES.some(t => mime.startsWith(t));
}

// ── Classification ─────────────────────────────

/**
 * Get the general category for a MIME type.
 *
 * @param {string} mime - MIME type string.
 * @returns {'image'|'audio'|'video'|'document'|'archive'|'other'}
 *
 * @example
 * getCategory('image/png')       // 'image'
 * getCategory('application/pdf') // 'document'
 * getCategory('application/zip') // 'archive'
 * getCategory('application/json') // 'other'
 */
export function getCategory(mime) {
  if (isImage(mime)) return 'image';
  if (isAudio(mime)) return 'audio';
  if (isVideo(mime)) return 'video';
  if (isDocument(mime)) return 'document';
  if (isArchive(mime)) return 'archive';
  return 'other';
}

/**
 * Get a human-readable label for a MIME type.
 *
 * @param {string} mime - MIME type string.
 * @returns {string} Label like "Image", "Audio", "Document", etc.
 *
 * @example
 * getLabel('image/png')        // 'Image'
 * getLabel('audio/mpeg')       // 'Audio'
 * getLabel('application/pdf')  // 'Document'
 * getLabel('application/zip')  // 'Archive'
 * getLabel('application/json') // 'JSON'
 * getLabel(null)               // 'Unknown'
 */
export function getLabel(mime) {
  if (!mime) return 'Unknown';
  const cat = getCategory(mime);
  if (cat !== 'other') return cat.charAt(0).toUpperCase() + cat.slice(1);
  // For unknown types, try to make a readable label from the subtype
  const subtype = mime.split('/').pop();
  if (!subtype) return 'File';
  return subtype.toUpperCase();
}

/**
 * Get the file extension typically associated with a MIME type.
 *
 * Returns the most common extension (without dot) or an empty string
 * for unknown types. Not exhaustive — covers common web/media types.
 *
 * @param {string} mime - MIME type string.
 * @returns {string} Extension like "png", "pdf", "mp3", or "".
 *
 * @example
 * extensionFromMime('image/png')        // 'png'
 * extensionFromMime('application/pdf')  // 'pdf'
 * extensionFromMime('audio/mpeg')       // 'mp3'
 * extensionFromMime('text/plain')       // 'txt'
 */
export function extensionFromMime(mime) {
  if (!mime) return '';
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
    'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif',
    'image/tiff': 'tiff', 'image/bmp': 'bmp', 'image/x-icon': 'ico',
    'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
    'audio/webm': 'webm', 'audio/flac': 'flac', 'audio/aac': 'aac',
    'audio/mp4': 'm4a',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv',
    'video/quicktime': 'mov', 'video/x-msvideo': 'avi',
    'application/pdf': 'pdf', 'application/zip': 'zip',
    'application/gzip': 'gz', 'application/x-tar': 'tar',
    'application/x-7z-compressed': '7z', 'application/x-rar-compressed': 'rar',
    'application/json': 'json', 'application/xml': 'xml',
    'application/javascript': 'js',
    'text/plain': 'txt', 'text/html': 'html', 'text/css': 'css',
    'text/csv': 'csv', 'text/markdown': 'md',
    'application/msword': 'doc', 'application/rtf': 'rtf',
  };
  return map[mime] || '';
}

// ── By name ────────────────────────────────────

/**
 * Extensions per category, for when there is a name and no MIME type — a
 * file list, an upload queue. Kept in step with the PHP
 * `SugarCommerce\Format\FileType` kinds, with spreadsheets and slides folded
 * into documents and code and fonts into other, so the same file gets the
 * same icon in the browser and on the server.
 */
const CATEGORY_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'heic', 'tiff', 'tif', 'psd', 'ai', 'eps'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'oga', 'm4a', 'aiff', 'aif', 'wma', 'opus', 'alac', 'mid', 'midi'],
  video: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv'],
  document: [
    'pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'pages', 'epub',
    'xls', 'xlsx', 'ods', 'csv', 'tsv', 'numbers',
    'ppt', 'pptx', 'odp', 'key',
  ],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'dmg', 'iso'],
};

/**
 * What a browser shows or plays inline, in every current browser, by
 * extension. Not SVG (a document that can carry script), TIFF, HEIC or PSD
 * (most browsers draw nothing), and not AIFF (Safari only). Matches the PHP
 * `SugarCommerce\Format\FileType::inline()`.
 */
const INLINE_TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac',
  ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac',
  pdf: 'application/pdf',
};

/**
 * The extension of a name for classifying it: lowercased, without query
 * string or fragment, and only when it looks like one (1–10 letters or
 * digits). The same rule as the PHP `FileType::extension()`.
 *
 * @param {string} filename
 * @returns {string}
 */
function extensionForType(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const base = filename.trim().replace(/[?#].*$/, '').replace(/\\/g, '/').split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  const ext = base.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

/**
 * The general category of a file, from its name.
 *
 * Presentation only — an icon, a filter. Never decide whether a file is
 * safe from its extension: whoever named it chose it.
 *
 * @param {string} filename - File name, path or URL.
 * @returns {'image'|'audio'|'video'|'document'|'archive'|'other'}
 *
 * @example
 * getCategoryFromName('Midnight Drive - Master.WAV')  // 'audio'
 * getCategoryFromName('Budget.xlsx')                  // 'document'
 * getCategoryFromName('song.wav.zip')                 // 'archive'
 * getCategoryFromName('preset.fxp')                   // 'other'
 */
export function getCategoryFromName(filename) {
  const ext = extensionForType(filename);
  if (!ext) return 'other';
  for (const [category, extensions] of Object.entries(CATEGORY_EXTENSIONS)) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
}

/**
 * The content type to show or play a file inline as, going by its name, or
 * `''` when browsers do not all render it.
 *
 * By name rather than sniffing, because the question is what an `<img>`,
 * `<audio>` or `<video>` element will accept, and every browser decides that
 * from the type it is told.
 *
 * @param {string} filename
 * @returns {string} MIME type, or `''`.
 *
 * @example
 * inlineType('take.flac')    // 'audio/flac'
 * inlineType('cover.png')    // 'image/png'
 * inlineType('session.aiff') // ''
 */
export function inlineType(filename) {
  return INLINE_TYPES[extensionForType(filename)] ?? '';
}

/**
 * Whether every current browser plays a file as audio, going by its name.
 *
 * @param {string} filename
 * @returns {boolean}
 *
 * @example
 * isPlayableAudio('loop.m4a')     // true
 * isPlayableAudio('session.aiff') // false
 */
export function isPlayableAudio(filename) {
  return inlineType(filename).startsWith('audio/');
}

/**
 * Check if a MIME type is previewable in a browser.
 *
 * Returns true for images, audio, video, PDFs, and text types
 * that browsers can render natively.
 *
 * @param {string} mime - MIME type string.
 * @returns {boolean}
 *
 * @example
 * isPreviewable('image/png')       // true
 * isPreviewable('application/pdf') // true
 * isPreviewable('application/zip') // false
 */
export function isPreviewable(mime) {
  if (!mime) return false;
  if (isImage(mime) || isAudio(mime) || isVideo(mime)) return true;
  if (mime === 'application/pdf') return true;
  if (mime.startsWith('text/')) return true;
  return false;
}
