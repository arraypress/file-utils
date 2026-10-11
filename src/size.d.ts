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
  /**
   * BCP 47 language tag ('de', 'pt-BR'): the number and unit written by
   * `Intl.NumberFormat` in that language ('1,5 kB', '100 Mo'), at the same
   * scale and decimals as without it. An unknown locale gives the output
   * without it.
   */
  locale?: string;
}

export function formatSize(bytes: number, options?: number | FormatSizeOptions): string;
