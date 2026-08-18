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
