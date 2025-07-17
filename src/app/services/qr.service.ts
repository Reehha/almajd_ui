import { Injectable } from '@angular/core';
import { toDataURL, QRCodeToDataURLOptions } from 'qrcode';

/**
 * Thin wrapper around the `qrcode` package.
 *
 * * returns a **Promise** instead of using a callback
 * * memo‑ises results per employee (skip re‑render until you ask for `refresh`)
 * * exposes a small options bag if you need to tweak the look later
 */
@Injectable({ providedIn: 'root' })
export class QrService {

  /** in‑memory cache → employeeId → data‑URL */
  private readonly cache = new Map<string, string>();

  /**
   * Generate (or return cached) QR code for the given employee.
   * @param employeeId numeric or 0‑padded string (kept as‑is in payload)
   * @param refresh    force regeneration & cache update
   * @param opts       pass‑through options for the `qrcode` lib
   */
  async generateQRCode(
    employeeId: string,
    refresh = false,
    opts: QRCodeToDataURLOptions = { errorCorrectionLevel: 'M', margin: 1, width: 256 }
  ): Promise<string> {

    if (!refresh && this.cache.has(employeeId)) {
      return this.cache.get(employeeId)!;
    }

    const payload = JSON.stringify({ employeeId, ts: Date.now() });

    try {
      const dataUrl = await toDataURL(payload, opts);
      this.cache.set(employeeId, dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('[QrService] generation failed', err);
      throw err;
    }
  }
}
