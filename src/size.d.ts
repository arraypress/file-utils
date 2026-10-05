export interface FormatSizeOptions {
  /** Decimal places for KB and up. Default: 1. */
  decimals?: number;
  /**
   * Whole units without a decimal when within 0.05 of one, grouped
   * thousands, signed, up to PB — the PHP `SugarCommerce\Format\Bytes::format()`
   * output exactly.
   */
  wholeUnits?: boolean;
  /** 1000-based units (kB). Only with `wholeUnits`. */
  si?: boolean;
}

export function formatSize(bytes: number, options?: number | FormatSizeOptions): string;
