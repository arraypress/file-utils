/**
 * A useful name for a file from the web, from what's known before it's
 * saved (its own name, its address, its type, the page and the link it came
 * from), and the last step every name goes through (the right extension,
 * safe on macOS, Windows and Linux). A name from elsewhere (a person, a
 * model) goes through {@link finishName} too. Pure.
 *
 * @module @arraypress/file-utils/naming/name
 */

import { isReservedName, sanitize } from '../name.js';
import { cleanName, tidySpacing } from './clean.js';
import { fromLabel, fromLinkText, fromPath, fromQuery, fromTitle, namesSite, siteName } from './context.js';
import { extensionFor } from './extension.js';
import { isMeaningless } from './meaning.js';
import { baseName, joinName, splitName } from './split.js';

/** Longest name given, extension included: readable, and well inside what every file system takes. */
export const MAX_NAME_LENGTH = 120;

/** Largest name given, in UTF-8 bytes: Linux and APFS take 255 (120 Chinese or Japanese characters are 360). */
const MAX_NAME_BYTES = 240;

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
 * @property {string} [label] What the page says the file is (an image's alt text, a caption, the heading over an
 *   audio player), used as it is.
 * @property {string} [linkText] The text of the link that started it, when it could be read (“Download the
 *   report (PDF)”: the verb and the note come off).
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
 * reserved names avoided, at most {@link MAX_NAME_LENGTH} characters (and
 * 240 bytes) with the extension kept (@arraypress/file-utils `sanitize`).
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
  return sanitize(name, { maxLength: MAX_NAME_LENGTH, maxBytes: MAX_NAME_BYTES, fallback: joinName('download', extensionFor(ext, mime)) });
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
 * ruleName({ filename: 'a7f3e9c2b1d4.jpg', referrer: 'https://www.acme.com/team', label: 'Ana at the 2026 retreat' },
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
 * name in the address's query (the server's), what the page says the file
 * is, the link's text, the page's title, the address's path (each with the
 * site's name in front).
 *
 * @param {DownloadFacts} facts - What's known.
 * @param {boolean} site - Whether the site's name goes in front.
 * @returns {string | null} The name, without an extension, or null.
 */
function contextName(facts, site) {
  const pageHost = hostOf(facts.referrer) || hostOf(facts.finalUrl) || hostOf(facts.url);
  const fromPage = fromLabel(facts.label) ?? fromLinkText(facts.linkText) ?? fromTitle(facts.pageTitle, pageHost)
    ?? fromPath(facts.finalUrl) ?? fromPath(facts.url);
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
  return site && !namesSite(name, site) ? `${site} ${name}` : name;
}

/** Longest page name {@link pageName} gives by default: room for more after it (a date, a file's own name). */
export const MAX_PAGE_NAME_LENGTH = 80;

/**
 * A name for something made from a whole page (a folder of its files, a
 * screenshot of it): its title without the site's own words, the site's
 * name in front, else the site's name alone (as the title spells it), else its host; what file
 * systems refuse made readable; a long one cut between words.
 *
 * @param {{url: string, title?: string}} page - The page's address and title.
 * @param {{maxLength?: number, fallback?: string}} [options] - The longest name (default
 *   {@link MAX_PAGE_NAME_LENGTH}) and the name when nothing says anything (default 'Page').
 * @returns {string} The name, without an extension.
 * @example
 * pageName({ url: 'https://www.example.com/lakes', title: 'Lake District trips – Example' }); // 'Example Lake District trips'
 * pageName({ url: 'https://github.com/arraypress', title: 'GitHub' });                       // 'GitHub'
 * pageName({ url: 'about:blank', title: '' }, { fallback: 'Screenshot' });                    // 'Screenshot'
 */
export function pageName(page, options = {}) {
  const { maxLength = MAX_PAGE_NAME_LENGTH, fallback = 'Page' } = options;
  const host = hostOf(page.url);
  const site = siteName(host);
  const title = (page.title ?? '').trim();
  // A title that is only the site's name keeps its own spelling (“GitHub”, not “Github”).
  const named = withSite(fromTitle(title, host), host) || (title.toLowerCase() === site.toLowerCase() ? title : site) || title;
  const readable = (named || host.replace(/:\d+$/, '')).replace(/\s*:\s*/g, ' - ').replace(/[/\\]/g, '-');
  // A long name is cut between words, when most of it is left: Chinese and Japanese titles have no spaces to cut at.
  const words = readable.slice(0, maxLength + 1).replace(/\s+\S*$/, '');
  const cut = readable.length <= maxLength || words.length < maxLength / 2 ? readable : words;
  const safe = sanitize(cut.trim(), { fallback, maxLength, maxBytes: MAX_NAME_BYTES, replacement: ' ' }).replace(/\s+/g, ' ').trim() || fallback;
  // Windows keeps “Con”, “Aux” and “Nul” (con.com, aux.io) for devices: no folder can have the name.
  return isReservedName(safe) ? `_${safe}` : safe;
}

/**
 * A namer that numbers a name it has given before (case aside, as macOS and
 * Windows compare them): “View.jpg”, “View 2.jpg”, “View 3.jpg”. For a ZIP's
 * entries, or files saved into one folder, where a second file of the same
 * name would replace the first.
 *
 * @param {Iterable<string>} [taken] - Names already there (a folder's files).
 * @returns {(name: string) => string} Gives each name, numbered when taken.
 * @example
 * const unique = uniqueNames();
 * unique('View.jpg'); // 'View.jpg'
 * unique('view.jpg'); // 'view 2.jpg'
 * uniqueNames(['Lake.png'])('Lake.png'); // 'Lake 2.png'
 */
export function uniqueNames(taken = []) {
  const used = new Set([...taken].map((name) => name.toLowerCase()));
  /** @type {Map<string, number>} The next number to try for a name. */
  const next = new Map();
  return (name) => {
    const { base, ext } = splitName(name);
    let unique = name;
    let number = next.get(name.toLowerCase()) ?? 2;
    for (; used.has(unique.toLowerCase()); number += 1) {
      // Room for the number: a long name is cut to fit it, or the number would be cut off and the loop never end.
      const room = MAX_NAME_LENGTH - (ext ? ext.length + 1 : 0) - String(number).length - 1;
      unique = finishName(`${base.slice(0, room).trim()} ${number}`, ext, undefined);
    }
    next.set(name.toLowerCase(), number);
    used.add(unique.toLowerCase());
    return unique;
  };
}
