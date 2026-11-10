/**
 * A useful name for a file from the web, from what's known before it's
 * saved (its own name, its address, its type, the page and the link it came
 * from), and the last step every name goes through (the right extension,
 * safe on macOS, Windows and Linux). A name from elsewhere (a person, a
 * model) goes through {@link finishName} too. Pure.
 *
 * @module @arraypress/file-utils/naming/name
 */

import { sanitize } from '../name.js';
import { cleanName, tidySpacing } from './clean.js';
import { fromLinkText, fromPath, fromQuery, fromTitle, siteName } from './context.js';
import { extensionFor } from './extension.js';
import { isMeaningless } from './meaning.js';
import { baseName, joinName, splitName } from './split.js';

/** Longest name given, extension included: well inside every file system's 255 bytes, and readable. */
export const MAX_NAME_LENGTH = 120;

/**
 * What's known about a download when it's named (Chrome's `DownloadItem`,
 * or a file a page links to).
 *
 * @typedef {object} DownloadFacts
 * @property {string} filename The name (or path) the browser would use.
 * @property {string} [url] Where the download started.
 * @property {string} [finalUrl] Where it came from, after redirects.
 * @property {string} [mime] The type the site sent.
 * @property {string} [referrer] The page it came from.
 * @property {string} [pageTitle] That page's title, when it could be read.
 * @property {string} [linkText] The text of the link that started it, or what the page says about the file (an image's alt text, a caption), when it could be read.
 */

/**
 * How {@link ruleName} names a file.
 *
 * @typedef {object} RuleNameOptions
 * @property {boolean} [site] Put the site's name in front of a name from the page or the address
 *   (“Acme Invoice 2026-11”). Default true; false when the files go in a folder named after the site.
 */

/**
 * The rules' verdict on a download's name.
 *
 * @typedef {object} RuleName
 * @property {string} name The name to use, finished.
 * @property {boolean} meaningless Whether the file's own name said nothing (so something else may try).
 * @property {string} ext The extension the name ends with.
 */

/**
 * The host of an address, or '' when it has none.
 *
 * @param {string | undefined} url - An address.
 * @returns {string} Its host.
 */
export function hostOf(url) {
  try {
    const parsed = new URL(url ?? '');
    // blob:https://site/… belongs to the site inside it.
    return parsed.protocol === 'blob:' ? new URL(parsed.pathname).host : parsed.host;
  } catch {
    return '';
  }
}

/**
 * Make a base name and extension into a finished file name: the extension
 * right for the type, characters no file system takes replaced, Windows'
 * reserved names avoided, at most {@link MAX_NAME_LENGTH} characters with
 * the extension kept (@arraypress/file-utils `sanitize`).
 *
 * @param {string} base - The name, without an extension.
 * @param {string} ext - The extension it had ('' for none).
 * @param {string | undefined} mime - The type the site sent.
 * @returns {string} The file name.
 * @example
 * finishName('Q3: “final” report?', 'php', 'application/pdf'); // 'Q3 - “final” report.pdf'
 * finishName('a/b', '', 'text/plain');                        // 'a-b.txt'
 * finishName('CON', 'txt', 'text/plain');                      // '_CON.txt'
 */
export function finishName(base, ext, mime) {
  // Readable stand-ins for what file systems refuse, before `sanitize` makes certain of the rest.
  // eslint-disable-next-line no-control-regex -- control characters are what's being replaced
  const readable = base.replace(/\s*:\s+/g, ' - ').replace(/[/\\]/g, '-').replace(/[?*"<>|\x00-\x1f\x7f]/g, ' ');
  const name = joinName(tidySpacing(readable) || 'download', extensionFor(ext, mime));
  return sanitize(name, { maxLength: MAX_NAME_LENGTH, fallback: joinName('download', extensionFor(ext, mime)) });
}

/**
 * The rules' name for a download. A name that says something is only
 * tidied (`cleanName`) and given the right extension. A meaningless one
 * (“download (3).pdf”) is named from what else is known
 * ({@link contextName}); if nothing says anything, the tidied name stays.
 *
 * @param {DownloadFacts} facts - What's known.
 * @param {RuleNameOptions} [options] - How to name it.
 * @returns {RuleName} The name, and whether the original said nothing.
 * @example
 * ruleName({ filename: 'download (3).pdf', mime: 'application/pdf', referrer: 'https://billing.acme.com/invoices',
 *   pageTitle: 'Invoice 2026-11 – Acme Billing' }).name; // 'Acme Invoice 2026-11.pdf'
 * ruleName({ filename: 'IMG_2384.jpg', mime: 'image/jpeg' }).name; // 'IMG_2384.jpg'
 * ruleName({ filename: 'a7f3e9c2b1d4.jpg', referrer: 'https://www.acme.com/team', linkText: 'Ana at the 2026 retreat' },
 *   { site: false }).name; // 'Ana at the 2026 retreat.jpg'
 */
export function ruleName(facts, options = {}) {
  const { base, ext } = splitName(cleanName(baseName(facts.filename)));
  const meaningless = isMeaningless(base);
  const better = meaningless ? contextName(facts, options.site ?? true) : null;
  return { name: finishName(better ?? base, ext, facts.mime), meaningless, ext: extensionFor(ext, facts.mime) };
}

/**
 * A name from what's known besides the file's own name, in order: a file
 * name in the address's query (the server's), the link's text or the
 * page's title, the address's path (each with the site's name in front).
 *
 * @param {DownloadFacts} facts - What's known.
 * @param {boolean} site - Whether the site's name goes in front.
 * @returns {string | null} The name, without an extension, or null.
 */
function contextName(facts, site) {
  const pageHost = hostOf(facts.referrer) || hostOf(facts.finalUrl) || hostOf(facts.url);
  const fromPage = fromLinkText(facts.linkText) ?? fromTitle(facts.pageTitle, pageHost) ?? fromPath(facts.finalUrl) ?? fromPath(facts.url);
  return fromQuery(facts.finalUrl) ?? fromQuery(facts.url) ?? (site ? withSite(fromPage, pageHost) : fromPage);
}

/**
 * A name with the site's name in front, unless it already says it.
 *
 * @param {string | null} name - A name from the page.
 * @param {string} host - The page's host.
 * @returns {string | null} The name with its site, or null.
 * @example
 * withSite('Invoice 2026-11', 'billing.acme.com'); // 'Acme Invoice 2026-11'
 * withSite('Acme invoice', 'acme.com');            // 'Acme invoice'
 */
export function withSite(name, host) {
  if (!name) return null;
  const site = siteName(host);
  return site && !name.toLowerCase().includes(site.toLowerCase()) ? `${site} ${name}` : name;
}
