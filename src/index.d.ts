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
	isReservedName,
} from './name.js';
export type { SanitizeOptions } from './name.js';

export {
	splitName,
	joinName,
	baseName,
	decodeName,
	stripTracking,
	stripCopyMarks,
	stripSizeMarks,
	tidySpacing,
	cleanName,
	isDeviceName,
	isMeaningless,
	siteName,
	namesSite,
	fromLabel,
	fromLinkText,
	fromTitle,
	fromQuery,
	fromPath,
	extensionFor,
	MAX_NAME_LENGTH,
	hostOf,
	finishName,
	ruleName,
	withSite,
	pageName,
	MAX_PAGE_NAME_LENGTH,
} from './naming/index.js';
export type { DownloadFacts, NameParts, RuleName, RuleNameOptions } from './naming/index.js';

export {
	isImage,
	isAudio,
	isVideo,
	isDocument,
	isArchive,
	getCategory,
	getCategoryFromName,
	getKindFromName,
	getLabel,
	getLabelFromName,
	getPreviewKind,
	extensionFromMime,
	inlineType,
	isPlayableAudio,
	isPreviewable,
} from './type.js';
export type { Category, FileKind } from './type.js';
