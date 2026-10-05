/**
 * @arraypress/file-utils
 *
 * The three things you know about a file before you open it — its size,
 * its name, and its type. Formatting bytes, sanitising filenames for
 * storage and `Content-Disposition`, and classifying MIME types.
 *
 * For what's *inside* a file — EXIF, IPTC, ID3 — see
 * `@arraypress/file-metadata`, which parses the bytes themselves.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module @arraypress/file-utils
 *
 * @example
 * import { formatSize, sanitize, getLabel } from '@arraypress/file-utils';
 *
 * formatSize(file.size);   // '1.5 MB'
 * sanitize(file.name);     // 'my_upload.pdf'
 * getLabel(file.type);     // 'Document'
 */

/* Size — bytes in, human-readable string out. */
export { formatSize } from './size.js';

/* Name — sanitising, extensions, display titles.
 *
 * `extensionFromName` reads the extension off a filename; its counterpart
 * `extensionFromMime` below derives one from a content type. Both were
 * called `getExtension` in the packages this absorbed, which is precisely
 * why they're named for their input now.
 */
export {
	sanitize,
	contentDisposition,
	extensionFromName,
	replaceExtension,
	renameKeepingExtension,
	humanize,
} from './name.js';

/* Type — classification and labelling of MIME strings. */
export {
	isImage,
	isAudio,
	isVideo,
	isDocument,
	isArchive,
	getCategory,
	getCategoryFromName,
	getLabel,
	extensionFromMime,
	inlineType,
	isPlayableAudio,
	isPreviewable,
} from './type.js';
