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
 *
 * @param {number} bytes - The byte count to format.
 * @param {number|{decimals?: number, wholeUnits?: boolean, si?: boolean}} [options=1]
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
 */
export function formatSize(bytes, options = 1) {
  const opts = typeof options === 'number' ? { decimals: options } : (options ?? {});

  if (opts.wholeUnits) return wholeUnits(bytes, opts.si === true);

  const decimals = opts.decimals ?? 1;

  if (bytes === null || bytes === undefined || bytes < 0) return '';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/**
 * The PHP `Bytes::format()` rule, step for step.
 *
 * @param {number}  bytes
 * @param {boolean} si    1000-based units.
 * @returns {string}
 */
function wholeUnits(bytes, si) {
  if (bytes === null || bytes === undefined || !Number.isFinite(Number(bytes))) return '';

  const n = Math.trunc(Number(bytes));
  const sign = n < 0 ? '-' : '';
  const value = Math.abs(n);
  const step = si ? 1000 : 1024;
  const units = si ? DECIMAL : BINARY;

  if (value < step) return `${sign}${value} ${units[0]}`;

  const power = Math.min(Math.floor(Math.log(value) / Math.log(step)), units.length - 1);
  const size = value / step ** power;

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
