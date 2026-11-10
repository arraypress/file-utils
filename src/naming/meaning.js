/**
 * Whether a name says what the file is. “download”, “file (3)”,
 * “1699999999123”, “f3a1c9e0-…” and “aGVsbG8gd29ybGQ” say nothing; a
 * camera's “IMG_2384” or a phone's “Screenshot 2026-11-10 at 09.41.12” do
 * (the file's own name, which people search for), and so does any name
 * with a real word in it. Pure.
 *
 * @module @arraypress/file-utils/naming/meaning
 */

/** Words that name no file in particular, as servers and pages use them. */
const GENERIC = [
  'download', 'downloads', 'downloaded', 'file', 'files', 'document', 'doc', 'attachment', 'attach', 'untitled', 'unnamed',
  'noname', 'no name', 'export', 'exported', 'image', 'img', 'picture', 'pic', 'photo', 'video', 'audio', 'media', 'data',
  'output', 'out', 'temp', 'tmp', 'blob', 'content', 'view', 'get', 'getfile', 'get file', 'open', 'index', 'default',
  'file download', 'download file', 'dl', 'fetch', 'stream', 'raw', 'save', 'print', 'generate', 'render', 'report',
  'invoice', 'receipt', 'statement', 'pdf', 'document1', 'new', 'new document', 'response', 'result', 'results', 'item',
];

/** A name made only of a generic word (or two), separators and digits: “download (3)”, “file_12”, “export-2”. */
const GENERIC_NAME = new RegExp(`^(?:${GENERIC.map((word) => word.replace(/ /g, '[\\s_-]*')).join('|')})(?:[\\s_.-]*\\d*)$`, 'i');

/** The generic words alone, for telling a name made of them and ids apart (“photo-1506744038136-46273834b3fb”). */
const GENERIC_WORDS = new Set(GENERIC);

/** What cameras, phones and screen grabbers call their files: names worth keeping as they are. */
const DEVICE_NAME = /^(?:IMG|DSC[NF]?|DCIM|PXL|MVIMG|VID|MOV|GOPR|GH\d|GX\d|DJI|PANO|BURST|SAM|WP|P\d{7}|_DSC|Screenshot|Screen Shot|Screen Recording|Scan|Photo|WhatsApp (?:Image|Video|Audio)|signal|telegram-cloud)[\s_-]?/i;

/**
 * Whether a name is a camera's, phone's or screen grab's own (“IMG_2384”,
 * “PXL_20261110_094112345”, “Screenshot 2026-11-10 at 09.41.12”).
 *
 * @param {string} base - A name without its extension.
 * @returns {boolean} True for a device's name.
 * @example
 * isDeviceName('IMG_2384');                          // true
 * isDeviceName('Invoice');                           // false
 * isDeviceName('photo-1506744038136-46273834b3fb');  // false
 */
export function isDeviceName(base) {
  // A camera counts; an id beside “photo” is a server's (“photo-1506744038136-46273834b3fb”).
  return DEVICE_NAME.test(base) && /\d/.test(base) && !base.split(/[\s_.-]+/).some(isToken);
}

/**
 * Whether a single word is a random token: long, letters mixed with digits
 * or cases, without the vowels words have (ids, hashes, base64).
 *
 * @param {string} word - One word.
 * @returns {boolean} True for a token.
 */
function isToken(word) {
  if (word.length < 10) return false;
  const letters = word.match(/\p{L}/gu) ?? [];
  const vowels = letters.filter((letter) => /[aeiouy]/i.test(letter)).length;
  const caseChanges = (word.match(/[a-z][A-Z]/g) ?? []).length;
  // Letters and digits taking turns ("aGVsbG8gd29y"), not a word with a number ("report2025q3").
  const turns = (word.match(/\p{L}(?=\d)|\d(?=\p{L})/gu) ?? []).length;
  if (/^[0-9a-f]+$/i.test(word) && /\d/.test(word) && /[a-f]/i.test(word)) return true;
  return turns >= 4 || caseChanges >= 3 || (letters.length > 0 && vowels / letters.length < 0.12);
}

/**
 * Whether a name says nothing about its file: empty or nearly; a generic
 * word with a number; only digits, dates and separators; a UUID, hash or
 * random token; generic words with only ids beside them (an image CDN's
 * “photo-1506744038136-46273834b3fb”). A device's own name is never
 * meaningless.
 *
 * @param {string} base - A name without its extension, already cleaned.
 * @returns {boolean} True when a better name is worth finding.
 * @example
 * isMeaningless('download');                             // true
 * isMeaningless('1699999999123');                        // true
 * isMeaningless('3f2a9c1e-7b4d-4e8a-9c2b-1a2b3c4d5e6f'); // true
 * isMeaningless('photo-1506744038136-46273834b3fb');     // true
 * isMeaningless('IMG_2384');                             // false
 * isMeaningless('Acme invoice 2026-11');                 // false
 */
export function isMeaningless(base) {
  const name = base.trim();
  if (isDeviceName(name)) return false;
  if (GENERIC_NAME.test(name)) return true;
  // Only numbers, dates and separators.
  if (!/\p{L}/u.test(name)) return true;
  const words = name.split(/[\s_.-]+/).filter(Boolean);
  const real = words.filter((word) => /\p{L}{2,}/u.test(word) && !isToken(word));
  // Generic words beside nothing but numbers and ids: “photo-1506744038136-46273834b3fb”, “image_8f3a9c2e41”.
  // (A date beside one stays: “Invoice 2026-11” says which.)
  if (words.some(isToken) && words.every((word) => GENERIC_WORDS.has(word.toLowerCase()) || /^\d+$/.test(word) || isToken(word))) return true;
  // One or two letters with numbers ("a1", "v2 3") say nothing.
  return real.length === 0 || (real.join('').replace(/[^\p{L}]/gu, '').length < 3 && words.length <= 2);
}
