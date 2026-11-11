/** A file name's two halves. */
export interface NameParts {
  /** Everything before the extension. */
  base: string;
  /** The extension without its dot, as written ('' for none). */
  ext: string;
}

/** What's known about a download when it's named. */
export interface DownloadFacts {
  /** The name (or path) the browser would use. */
  filename: string;
  /** Where the download started. */
  url?: string;
  /** Where it came from, after redirects. */
  finalUrl?: string;
  /** The type the site sent. */
  mime?: string;
  /** The page it came from. */
  referrer?: string;
  /** That page's title. */
  pageTitle?: string;
  /** What the page says the file is (alt text, a caption, a heading), used as it is. */
  label?: string;
  /** The link's text (its verb and note about the file come off). */
  linkText?: string;
}

/** How `ruleName` names a file. */
export interface RuleNameOptions {
  /** Put the site's name in front of a name from the page or the address. Default true. */
  site?: boolean;
}

/** The rules' verdict on a name. */
export interface RuleName {
  /** The name to use, finished. */
  name: string;
  /** Whether the file's own name said nothing. */
  meaningless: boolean;
  /** The extension the name ends with. */
  ext: string;
}

/** Longest name given, extension included. */
export const MAX_NAME_LENGTH: 120;

/** A name's base and extension (`tar.gz` kept together; "Version 2.0" has none). */
export function splitName(name: string): NameParts;
/** A base and an extension put back together. */
export function joinName(base: string, ext: string): string;
/** The last part of a path, whichever way its slashes lean. */
export function baseName(path: string): string;

/** Web-address encoding decoded, once or twice; a `+` between words is a space. */
export function decodeName(text: string): string;
/** Tracking parameters, and a query after a real extension, taken out of a name. */
export function stripTracking(name: string): string;
/** Copy marks (“ (1)”, “ - Copy”, “ copy 2”) dropped from the end of a base name. */
export function stripCopyMarks(base: string): string;
/** Size marks image servers add (“1280px-”, “-1024x683”, “_600x”) dropped, when letters are left. */
export function stripSizeMarks(base: string): string;
/** Runs of spaces made one; spaces, dots, dashes and underscores off the ends. */
export function tidySpacing(text: string): string;
/** Every tidying rule on a whole file name; the extension kept as written. */
export function cleanName(name: string): string;

/** Whether a name is a camera's, phone's or screen grab's own (“IMG_2384”). */
export function isDeviceName(base: string): boolean;
/** Whether a name says nothing about its file (generic words, numbers, hashes, tokens). */
export function isMeaningless(base: string): boolean;

/** A site's name as people write it, from its host ("billing.acme.co.uk" → "Acme"). */
export function siteName(host: string): string;
/** A name from what a page says a file is (alt text, a caption), as it is, or null. */
export function fromLabel(text: string | undefined): string | null;
/** A name from a link's text, its verb and note about the file taken off, or null. */
export function fromLinkText(text: string | undefined): string | null;
/** A name from a page's title, the site's own name taken off, or null. */
export function fromTitle(title: string | undefined, host: string): string | null;
/** A file name the address carries in its query (`?filename=`), without an extension, or null. */
export function fromQuery(url: string | undefined): string | null;
/** The last words of an address's path that aren't plumbing, or null. */
export function fromPath(url: string | undefined): string | null;

/** The extension a file should end with, for the type the site sent. */
export function extensionFor(ext: string, mime: string | undefined): string;

/** The host of an address ('' for none; a blob address's site). */
export function hostOf(url: string | undefined): string;
/** A base name and extension made into a finished file name, safe on every file system. */
export function finishName(base: string, ext: string, mime: string | undefined): string;
/** The rules' name for a file. */
export function ruleName(facts: DownloadFacts, options?: RuleNameOptions): RuleName;
/** A name with the site's name in front, unless it already says it. */
export function withSite(name: string | null, host: string): string | null;
/** Longest page name `pageName` gives by default. */
export const MAX_PAGE_NAME_LENGTH: number;
/** A name for something made from a whole page (a folder of its files, a screenshot of it): its title with the site's name, cut between words. */
export function pageName(page: { url: string; title?: string }, options?: { maxLength?: number; fallback?: string }): string;
