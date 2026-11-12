/**
 * The rules that tidy a name without changing what it says: web-address
 * encoding decoded (`%20`, `+`), tracking parameters that leaked into it
 * taken out, the copy marks browsers and file managers add (“(1)”,
 * “ - Copy”, “ copy 2”) dropped, and spacing tidied. Pure.
 *
 * @module @arraypress/file-utils/naming/clean
 */

import { getCategoryFromName } from '../type.js';
import { joinName, splitName } from './split.js';

/**
 * Query parameters that only track, as they turn up inside file names
 * (a `?` that became `_` or stayed). The full rules for links are
 * @arraypress/clean-link's; a name only ever carries these few.
 */
const TRACKING = /(?:^|[?&_#;])(?:utm_[a-z]+|fbclid|gclid|gbraid|wbraid|dclid|msclkid|yclid|mc_cid|mc_eid|_hsenc|_hsmi|hsCtaTracking|igshid|igsh|mkt_tok|oly_enc_id|oly_anon_id|vero_id|ref_src|trk|si)=[^&_#;.]*/gi;

/** Words that make “copy” part of a name, not a mark: “Hard copy”, “Certified copy”, “Master copy”. */
const COPY_OF = 'hard|soft|carbon|master|final|fair|clean|proof|review|advance|file|office|certified|true|signed|customer|client|digital|paper|print|printed|backup|working|draft|rough|spare|second|extra|personal|patient|employee|student|your|my|our|a|the';

/**
 * Copy marks at the end of a name: “ (1)” to “ (99)”, “ - Copy”, “ - Copy
 * (2)”, “ copy”, “ copy 3”. A “copy” that a word before it makes part of
 * the name stays (“Hard copy”, “Certified copy 2”).
 */
const COPY_MARK = new RegExp(`(?:\\s*\\(\\d{1,2}\\)|\\s+-\\s+copy(?:\\s*\\(\\d{1,2}\\))?|(?<!(?:^|[\\s_.-])(?:${COPY_OF}))\\s+copy(?:\\s+\\d{1,2})?)$`, 'i');

/**
 * Decode web-address encoding in a name, once or twice (`%2520` is a space
 * encoded twice). Text that isn't valid encoding is left as it is.
 *
 * @param {string} text - A name, or part of one.
 * @returns {string} It decoded.
 * @example
 * decodeName('Annual%20Report%202025');  // 'Annual Report 2025'
 * decodeName('Annual+Report+2025');      // 'Annual Report 2025'
 * decodeName('C++ Primer');              // 'C++ Primer'
 * decodeName('100%');                    // '100%'
 * decodeName('Q+A');                     // 'Q+A'
 */
export function decodeName(text) {
  let decoded = text;
  for (let pass = 0; pass < 2 && /%[0-9A-Fa-f]{2}/.test(decoded); pass++) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }
  // A + between words is a space from a form or query. One alone between short words is a plus (“Q+A”, “AT+T”,
  // “R+D”), and so is any in a name with spaces (“C++ Primer”, “A + B”).
  const pluses = decoded.match(/(?<=[\p{L}\p{N}])\+(?=[\p{L}\p{N}])/gu)?.length ?? 0;
  const spaced = pluses > 1 || /[\p{L}\p{N}]{3,}\+[\p{L}\p{N}]{3,}/u.test(decoded);
  if (spaced && !/\s/.test(decoded)) decoded = decoded.replace(/(?<=[\p{L}\p{N}])\+(?=[\p{L}\p{N}])/gu, ' ');
  return decoded;
}

/**
 * Take tracking parameters out of a name, and anything a query left after
 * a real extension (“photo.jpg_utm_source=x” is “photo.jpg”).
 *
 * @param {string} name - A file name.
 * @returns {string} It without them.
 * @example
 * stripTracking('Brochure_utm_source=newsletter&utm_medium=email.pdf'); // 'Brochure.pdf'
 * stripTracking('photo.jpg?w=1200&fbclid=abc');                          // 'photo.jpg'
 */
export function stripTracking(name) {
  // A query after an extension: “x.jpg?w=1”, “x.jpg_w=1” (Chrome turns ? into _).
  const query = /^(.+?\.[A-Za-z0-9]{2,5})[?_&][^.]*=[^.]*$/.exec(name);
  const cut = query ? query[1] : name;
  return cut.replace(TRACKING, '').replace(/[?&]+(?=\.[^.]+$)|[?&]+$/, '');
}

/**
 * Drop the copy marks from the end of a base name (any number of them).
 *
 * @param {string} base - A name without its extension.
 * @returns {string} It without them.
 * @example
 * stripCopyMarks('download (3)');        // 'download'
 * stripCopyMarks('Budget - Copy (2)');   // 'Budget'
 * stripCopyMarks('Notes copy 2');        // 'Notes'
 * stripCopyMarks('Room (101)');          // 'Room (101)' (three digits: part of the name)
 */
export function stripCopyMarks(base) {
  let stripped = base;
  for (let next = stripped.replace(COPY_MARK, ''); next !== stripped && /\S/.test(next); next = stripped.replace(COPY_MARK, '')) {
    stripped = next;
  }
  return stripped;
}

/**
 * Size marks image servers add: MediaWiki's “1280px-” in front, WordPress'
 * “-1024x683”, Shopify's “_600x”, X's “_400x400”. A size has a side of
 * three digits or more: “iphone-12x”, “photo-16x9” and “covid-19x19” are names.
 */
const SIZE_MARKS = [/^\d{2,4}px-(?=.*\p{L})/u, /-(?:\d{3,4}x\d{2,4}|\d{2}x\d{3,4})$|_\d{3,4}x(?:\d{2,4})?$/];

/** Image extensions a server leaves inside a name when it sends another format (“photo.jpg.webp”). */
const INNER_IMAGE_EXTENSION = /\.(?:jpe?g|png|gif|webp|avif)$/i;

/**
 * Drop the size marks image servers add to a name (a smaller copy's), when
 * a name with letters is left.
 *
 * @param {string} base - A name without its extension.
 * @returns {string} It without them.
 * @example
 * stripSizeMarks('1280px-Derwent_Water');  // 'Derwent_Water'
 * stripSizeMarks('lake-1024x683');         // 'lake'
 * stripSizeMarks('hero_600x');             // 'hero'
 * stripSizeMarks('1920x1080');             // '1920x1080' (nothing would be left)
 */
export function stripSizeMarks(base) {
  let stripped = base;
  for (const mark of SIZE_MARKS) {
    const next = stripped.replace(mark, '');
    if (/\p{L}/u.test(next)) stripped = next;
  }
  return stripped;
}

/**
 * Tidy spacing: runs of spaces become one, and spaces, dots, dashes and
 * underscores go from the ends.
 *
 * @param {string} text - A base name.
 * @returns {string} It tidied.
 * @example
 * tidySpacing('  Q3   report_ '); // 'Q3 report'
 */
export function tidySpacing(text) {
  return text.replace(/\s+/g, ' ').replace(/^[\s._-]+|[\s._-]+$/g, '');
}

/**
 * Every rule here, in order, on a whole file name: decoded, tracking out,
 * copy marks dropped, an image's size marks and an image extension left
 * inside its name dropped (“photo.jpg.webp”), spacing tidied. The extension
 * is kept as written.
 *
 * @param {string} name - The name Chrome would use.
 * @returns {string} The tidied name (the original, if tidying would leave nothing).
 * @example
 * cleanName('download (3).pdf');                      // 'download.pdf'
 * cleanName('Annual%20Report%202025%20(1).pdf');      // 'Annual Report 2025.pdf'
 * cleanName('IMG_2384.JPG');                          // 'IMG_2384.JPG'
 * cleanName('960px-Mona_Lisa.jpg');                   // 'Mona_Lisa.jpg'
 * cleanName('64547710-dd08.jpg.webp');                // '64547710-dd08.webp'
 */
export function cleanName(name) {
  const { base, ext } = splitName(stripTracking(decodeName(name)));
  const inner = INNER_IMAGE_EXTENSION.test(ext ? `.${ext}` : '') ? base.replace(INNER_IMAGE_EXTENSION, '') : base;
  const unmarked = stripCopyMarks(inner || base);
  // Only an image has a size in its name: “mix_128x.mp3” is a bitrate.
  const isImage = !ext || getCategoryFromName(joinName('x', ext)) === 'image';
  const cleaned = tidySpacing(isImage ? stripSizeMarks(unmarked) : unmarked);
  return cleaned ? joinName(cleaned, ext) : name;
}
