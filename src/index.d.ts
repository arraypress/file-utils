/**
 * @arraypress/file-utils — TypeScript definitions.
 */

export { formatSize } from './size.js';

export {
	sanitize,
	contentDisposition,
	extensionFromName,
	replaceExtension,
	humanize,
} from './name.js';
export type { SanitizeOptions } from './name.js';

export {
	isImage,
	isAudio,
	isVideo,
	isDocument,
	isArchive,
	getCategory,
	getLabel,
	extensionFromMime,
	isPreviewable,
} from './type.js';
export type { Category } from './type.js';
