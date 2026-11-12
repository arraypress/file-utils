/**
 * @arraypress/file-utils — size formatting
 *
 * Format byte counts as human-readable file sizes.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module
 */

const BINARY = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
const DECIMAL = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

/** Intl's unit for each step, binary or decimal alike (Intl has no kibibyte). */
const INTL_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];

/**
 * Format bytes to a human-readable string.
 *
 * Uses binary units (1 KB = 1024 bytes) which matches how
 * operating systems and file managers display sizes.
 *
 * The second argument is either the number of decimals (the original
 * signature) or an options object:
 *
 * - `decimals` — decimal places for KB and up. Default 1.
 * - `wholeUnits` — print a value within 0.05 of a whole unit without a
 *   decimal (`100 MB`, not `100.0 MB`), group thousands (`1,000.5 KB`),
 *   keep a negative sign, and scale up to PB. This is exactly the output of
 *   the PHP `SugarCommerce\Format\Bytes::format()`, for a page where the
 *   server and the browser both write sizes and must agree.
 * - `si` — decimal units (1 kB = 1000 bytes). Only with `wholeUnits`,
 *   matching `Bytes::format( $bytes, true )`.
 * - `locale` — a BCP 47 language tag (`'de'`, `'pt-BR'`): the number and
 *   unit written by `Intl.NumberFormat` in that language (`1,5 kB`,
 *   `100 Mo`), at the same scale and decimals as without it. An unknown
 *   locale gives the output without it.
 *
 * @param {number} bytes - The byte count to format.
 * @param {number|{decimals?: number, wholeUnits?: boolean, si?: boolean, locale?: string}} [options=1]
 * @returns {string} Formatted string like "4.2 MB", "128 KB", "0 B".
 *
 * @example
 * formatSize(0)              // '0 B'
 * formatSize(512)            // '512 B'
 * formatSize(1024)           // '1.0 KB'
 * formatSize(1536)           // '1.5 KB'
 * formatSize(52428800)       // '50.0 MB'
 * formatSize(1073741824)     // '1.0 GB'
 * formatSize(1099511627776)  // '1.0 TB'
 *
 * formatSize(104857600, { wholeUnits: true })  // '100 MB'
 * formatSize(1536, { wholeUnits: true })       // '1.5 KB'
 *
 * formatSize(1536, { locale: 'de' })                      // '1,5 kB'
 * formatSize(104857600, { wholeUnits: true, locale: 'fr' })  // '100 Mo'
 */
export function formatSize(bytes, options = 1) {
  const opts = typeof options === 'number' ? { decimals: options } : (options ?? {});
  const locale = knownLocale(opts.locale);

  if (opts.wholeUnits) return wholeUnits(bytes, opts.si === true, locale);

  const decimals = opts.decimals ?? 1;

  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes === 0) return (locale && inLocale(0, 0, 0, locale)) || '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  // 1,048,575 bytes round to 1024.0 KB: that is 1.0 MB.
  if (i > 0 && i < units.length - 1 && Number(size.toFixed(decimals)) >= 1024) {
    size /= 1024;
    i++;
  }

  const digits = i === 0 ? 0 : decimals;
  if (locale) {
    const localised = inLocale(size, i, digits, locale);
    if (localised) return localised;
  }

  return `${size.toFixed(digits)} ${units[i]}`;
}

/**
 * The PHP `Bytes::format()` rule, step for step.
 *
 * @param {number}  bytes
 * @param {boolean} si     1000-based units.
 * @param {?string} locale Write the number and unit in this language.
 * @returns {string}
 */
function wholeUnits(bytes, si, locale) {
  if (bytes === null || bytes === undefined || !Number.isFinite(Number(bytes))) return '';

  const n = Math.trunc(Number(bytes));
  const sign = n < 0 ? '-' : '';
  const value = Math.abs(n);
  const step = si ? 1000 : 1024;
  const units = si ? DECIMAL : BINARY;

  if (value < step) {
    return (locale && inLocale(n, 0, 0, locale)) || `${sign}${value} ${units[0]}`;
  }

  const power = Math.min(Math.floor(Math.log(value) / Math.log(step)), units.length - 1);
  const size = value / step ** power;

  if (locale) {
    const whole = Math.abs(size - Math.round(size)) < 0.05;
    const rounded = whole ? Math.round(size) : Math.round(size * 10) / 10;
    const localised = inLocale(n < 0 ? -rounded : rounded, power, whole ? 0 : 1, locale);
    if (localised) return localised;
  }

  const rendered = Math.abs(size - Math.round(size)) < 0.05
    ? String(Math.round(size))
    : group((Math.round(size * 10) / 10).toFixed(1));

  return `${sign}${rendered} ${units[power]}`;
}

/**
 * Thousands separators on a fixed-point string, as PHP's number_format().
 *
 * @param {string} fixed e.g. '1000.5'
 * @returns {string} e.g. '1,000.5'
 */
function group(fixed) {
  const [whole, fraction] = fixed.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : '.' + fraction);
}

/**
 * A locale the runtime knows, or null for none or an unknown one.
 *
 * @param {string} [locale]
 * @returns {?string}
 */
function knownLocale(locale) {
  if (!locale) return null;
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length ? locale : null;
  } catch {
    return null;
  }
}

/**
 * A size and its unit in a language, with exactly `digits` decimals.
 *
 * @param {number} size   e.g. 1.5
 * @param {number} power  0 for bytes, 1 for kilobytes, …
 * @param {number} digits Decimal places.
 * @param {string} locale
 * @returns {?string} e.g. '1,5 kB', or null if Intl refuses the options.
 */
function inLocale(size, power, digits, locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: INTL_UNITS[power],
      unitDisplay: 'short',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(size);
  } catch {
    return null;
  }
}
