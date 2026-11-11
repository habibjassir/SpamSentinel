import { useEffect, useId, useState } from 'react';
import { format } from '../../src/i18n/index.ts';
import type { Messages } from '../../src/i18n/index.ts';
import { SCAN_DELAY_MAX_MS, SCAN_DELAY_MIN_MS } from '../../src/storage/index.ts';

interface Props {
  t: Messages;
  autoScan: boolean;
  scanDelayMs: number;
  onChange: (changes: { autoScan?: boolean; scanDelayMs?: number }) => void;
}

const limits = { min: SCAN_DELAY_MIN_MS, max: SCAN_DELAY_MAX_MS };

/** Automatic scan switch and the debounce delay. The delay is saved only when valid. */
export function ScanSettings({ t, autoScan, scanDelayMs, onChange }: Props) {
  const [draft, setDraft] = useState(String(scanDelayMs));
  const [invalid, setInvalid] = useState(false);
  const delayId = useId();

  useEffect(() => setDraft(String(scanDelayMs)), [scanDelayMs]);

  const commit = () => {
    const value = Number(draft);
    const ok =
      draft.trim() !== '' && Number.isInteger(value) && value >= limits.min && value <= limits.max;
    setInvalid(!ok);
    if (ok && value !== scanDelayMs) onChange({ scanDelayMs: value });
  };

  return (
    <section aria-labelledby="scan-heading">
      <h2 id="scan-heading">{t.scanHeading}</h2>

      <label className="switch">
        <input
          type="checkbox"
          checked={autoScan}
          onChange={(e) => onChange({ autoScan: e.target.checked })}
        />
        <span>
          <strong>{t.autoScanToggle}</strong>
          <span className="muted">{t.autoScanHelp}</span>
        </span>
      </label>

      <label htmlFor={delayId}>{t.scanDelayLabel}</label>
      <input
        id={delayId}
        type="number"
        min={limits.min}
        max={limits.max}
        step={50}
        value={draft}
        disabled={!autoScan}
        aria-invalid={invalid || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
      />
      <p className="muted small">{format(t.scanDelayHelp, limits)}</p>
      {invalid && (
        <p role="alert" className="field-error">
          {format(t.scanDelayInvalid, limits)}
        </p>
      )}
    </section>
  );
}
