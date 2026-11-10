/**
 * Names found in what's known about a download before it's saved: a file
 * name in its address's query, the text of the link that started it, the
 * title of the page it came from, and the words in its address's path.
 * Each gives a cleaned name, or null when it has nothing better to say.
 * Pure.
 *
 * @module @arraypress/file-utils/naming/context
 */

import { decodeName, tidySpacing } from './clean.js';
import { isMeaningless } from './meaning.js';
import { splitName } from './split.js';

/** Query parameters that carry a file's name. */
const NAME_PARAMS = ['filename', 'file_name', 'fileName', 'file', 'name', 'title', 'fn', 'download', 'attachment'];

/** Path segments that say how a file is served, not what it is. */
const PLUMBING = /^(?:api|v\d+|static|assets?|uploads?|files?|downloads?|dl|get|getfile|view|raw|blob|media|content|attachments?|documents?|docs|export|exports|storage|public|private|cdn|s3|object|objects|item|items|id|redirect|go|out|index|default|wp-content|sites|en|en-us|en-gb|www)$/i;

/** Words that start link text and say nothing about the file: “Download”, “Click here to get”, “Save”. */
const LINK_VERBS = /^(?:(?:click|tap)\s+(?:here\s+)?(?:to\s+)?)?(?:download|get|save|export|view|open|print)(?:\s+(?:the|a|an|your|this|now|here))*\b[\s:–—-]*/i;

/** A link's note about the file itself: “(PDF, 2.4 MB)”, “[DOCX]”, “PDF 312 KB”. */
const FILE_NOTE = /\s*[([]?\s*(?:pdf|docx?|xlsx?|csv|zip|pptx?|txt|png|jpe?g|mp[34])\b[^)\]]*?(?:\d+(?:[.,]\d+)?\s*[kmg]i?b)?\s*[)\]]?\s*$|\s*[([]\s*\d+(?:[.,]\d+)?\s*[kmg]i?b\s*[)\]]\s*$/i;

/** What separates a page's title from its site's name: “Invoice – Acme”, “Acme | Invoice”. */
const TITLE_SEPARATOR = /\s+[|–—·:•»/-]\s+|\s+::\s+/;

/**
 * A site's name as people write it, from its host: the label before the
 * public suffix, capitalised ("billing.acme.co.uk" → "Acme"). Rough: it
 * knows the common two-part suffixes only.
 *
 * @param {string} host - A host name.
 * @returns {string} The name ('' for an address).
 * @example
 * siteName('billing.acme.com');  // 'Acme'
 * siteName('www.bbc.co.uk');     // 'Bbc'
 */
export function siteName(host) {
  const labels = host.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '').split('.').filter(Boolean);
  if (labels.length < 2 || labels.every((label) => /^\d+$/.test(label))) return '';
  const twoPart = /^(?:co|com|org|net|gov|ac|edu)$/.test(labels[labels.length - 2]) && labels.length > 2;
  const label = labels[labels.length - (twoPart ? 3 : 2)];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * A name from text, if it says something: decoded, tidied and not meaningless.
 *
 * @param {string} text - Any text.
 * @returns {string | null} The name, or null.
 */
function meaningful(text) {
  const name = tidySpacing(decodeName(text)).slice(0, 120).trim();
  return name && !isMeaningless(name) ? name : null;
}

/**
 * A name from the text of the link that started the download: its verb
 * (“Download”) and note about the file (“(PDF, 2 MB)”) taken off.
 *
 * @param {string | undefined} text - The link's text (or its label).
 * @returns {string | null} The name, or null.
 * @example
 * fromLinkText('Download the 2025 annual report (PDF, 2.4 MB)'); // '2025 annual report'
 * fromLinkText('Download');                                      // null
 */
export function fromLinkText(text) {
  if (!text) return null;
  const words = text.replace(/\s+/g, ' ').trim().replace(LINK_VERBS, '').replace(FILE_NOTE, '');
  return /^(?:(?:click|tap)\s+)?(?:here|this|link|more|now)$/i.test(words) ? null : meaningful(words);
}

/**
 * A name from the title of the page the download came from, the site's own
 * name taken off it (“Invoice 2026-11 – Acme Billing” on acme.com is
 * “Invoice 2026-11”).
 *
 * @param {string | undefined} title - The page's title.
 * @param {string} host - The page's host, to know the site's name.
 * @returns {string | null} The name, or null.
 * @example
 * fromTitle('Invoice 2026-11 – Acme Billing', 'billing.acme.com'); // 'Invoice 2026-11'
 * fromTitle('Acme', 'acme.com');                                   // null
 */
export function fromTitle(title, host) {
  if (!title) return null;
  const site = siteName(host).toLowerCase();
  const parts = title.split(TITLE_SEPARATOR).map((part) => part.trim()).filter(Boolean);
  const own = parts.filter((part) => !site || !part.toLowerCase().includes(site) || parts.length === 1);
  const kept = own.length ? own : parts;
  // The site's name alone says nothing about the file.
  if (kept.length === 1 && site && kept[0].toLowerCase() === site) return null;
  return meaningful(kept.join(' – '));
}

/**
 * The address, parsed, when it's a web address.
 *
 * @param {string | undefined} url - An address.
 * @returns {URL | null} It, or null.
 */
function webUrl(url) {
  try {
    const parsed = new URL(url ?? '');
    return /^https?:$/.test(parsed.protocol) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A name from a file name a download's address carries in its query
 * (`?filename=Q3%20report.pdf`): the server's own name for it.
 *
 * @param {string | undefined} url - The address.
 * @returns {string | null} The name (without an extension), or null.
 * @example
 * fromQuery('https://x.example/get?filename=Q3%20report.pdf'); // 'Q3 report'
 * fromQuery('https://x.example/get?id=42');                     // null
 */
export function fromQuery(url) {
  const parsed = webUrl(url);
  for (const key of parsed ? NAME_PARAMS : []) {
    const value = parsed?.searchParams.get(key);
    if (value && /\p{L}/u.test(value) && !/^https?:/i.test(value)) {
      const named = meaningful(splitName(value.split(/[/\\]/).pop() ?? '').base);
      if (named) return named;
    }
  }
  return null;
}

/**
 * A name from the last words of a download's address that aren't plumbing
 * (“/billing/invoices/2026-11/download” is “invoices 2026-11”).
 *
 * @param {string | undefined} url - The address.
 * @returns {string | null} The name (without an extension), or null.
 * @example
 * fromPath('https://acme.example/billing/invoices/2026-11/download'); // 'invoices 2026-11'
 * fromPath('https://cdn.example/f/3f2a9c1e7b4d');                       // null
 */
export function fromPath(url) {
  const parsed = webUrl(url);
  if (!parsed) return null;
  const segments = parsed.pathname.split('/').map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }).map((segment) => splitName(segment).base).filter((segment) => segment && !PLUMBING.test(segment));
  // From the end (three segments at most): the last with words, and the one before it when the last is a number or date.
  for (let i = segments.length - 1; i >= Math.max(0, segments.length - 3); i--) {
    const segment = segments[i].replace(/[-_+]+/g, ' ');
    if (!/\p{L}/u.test(segment)) {
      const before = segments[i - 1];
      const words = before && meaningful(before.replace(/[-_+]+/g, ' '));
      if (words) return `${words} ${segments[i]}`;
      continue;
    }
    const words = meaningful(segment);
    if (words) return words;
  }
  return null;
}
