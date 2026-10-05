/**
 * @arraypress/file-utils — TypeScript definitions.
 */

export { formatSize } from './size.js';
export type { FormatSizeOptions } from './size.js';

export {
	sanitize,
	contentDisposition,
	extensionFromName,
	replaceExtension,
	renameKeepingExtension,
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
	getCategoryFromName,
	getLabel,
	extensionFromMime,
	inlineType,
	isPlayableAudio,
	isPreviewable,
} from './type.js';
export type { Category } from './type.js';
