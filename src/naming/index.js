/**
 * @arraypress/file-utils — naming
 *
 * A useful name for a file from the web. Its own name is tidied
 * (`cleanName`: decoded, tracking and copy marks out, spacing); a name that
 * says nothing (`isMeaningless`: “download (3)”, a hash, an image CDN's
 * “photo-1506744038136-46273834b3fb”) is named from the address's query,
 * the link's text or what the page says about the file, the page's title or
 * the address's path; and every name ends with `finishName`: the right
 * extension for its type, safe on macOS, Windows and Linux. Pure.
 *
 * @module @arraypress/file-utils/naming
 */

export { baseName, joinName, splitName } from './split.js';
export { cleanName, decodeName, stripCopyMarks, stripSizeMarks, stripTracking, tidySpacing } from './clean.js';
export { isDeviceName, isMeaningless } from './meaning.js';
export { fromLabel, fromLinkText, fromPath, fromQuery, fromTitle, siteName } from './context.js';
export { extensionFor } from './extension.js';
export { MAX_NAME_LENGTH, finishName, hostOf, ruleName, withSite } from './name.js';
