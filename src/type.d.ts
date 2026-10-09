export type Category = 'image' | 'audio' | 'video' | 'document' | 'archive' | 'other';

/** A category, or `font` or `software` where the category says `other`. */
export type FileKind = Exclude<Category, 'other'> | 'font' | 'software' | 'other';

/** Check if a MIME type is an image. */
export function isImage(mime: string): boolean;

/** Check if a MIME type is audio. */
export function isAudio(mime: string): boolean;

/** Check if a MIME type is video. */
export function isVideo(mime: string): boolean;

/** Check if a MIME type is a document (PDF, Word, Excel, text, etc.). */
export function isDocument(mime: string): boolean;

/** Check if a MIME type is an archive (zip, rar, tar, gzip, 7z, etc.). */
export function isArchive(mime: string): boolean;

/** Get the general category for a MIME type. */
export function getCategory(mime: string): Category;

/** Get a human-readable label for a MIME type. */
export function getLabel(mime: string): string;

/** Get the typical file extension for a MIME type (without dot). */
export function extensionFromMime(mime: string): string;

/** The general category of a file from its name (presentation only). */
export function getCategoryFromName(filename: string): Category;

/** The MIME type every current browser shows or plays a file inline as, by name, or `''`. */
export function inlineType(filename: string): string;

/** Whether every current browser plays a file as audio, by name. */
export function isPlayableAudio(filename: string): boolean;

/** What a file is, by name: its category, or `font` / `software` instead of `other`. */
export function getKindFromName(filename: string): FileKind;

/** A file's kind for people, by name: "WAV audio", "OTF font", "VST3 file", or "File". */
export function getLabelFromName(filename: string): string;

/** The element to preview a file with, by name, or null. */
export function getPreviewKind(filename: string): 'image' | 'audio' | 'video' | null;

/** Check if a MIME type is previewable in a browser. */
export function isPreviewable(mime: string): boolean;
