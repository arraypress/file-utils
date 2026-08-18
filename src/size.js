/**
 * @arraypress/file-utils — size formatting
 *
 * Format byte counts as human-readable file sizes.
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module
 */

/**
 * Format bytes to a human-readable string.
 *
 * Uses binary units (1 KB = 1024 bytes) which matches how
 * operating systems and file managers display sizes.
 *
 * @param {number} bytes - The byte count to format.
 * @param {number} [decimals=1] - Decimal places (0 for bytes, default 1 for KB+).
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
 */
export function formatSize(bytes, decimals = 1) {
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
