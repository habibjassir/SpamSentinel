import type { Messages } from '../../src/i18n/index.ts';

interface Props {
  t: Messages;
  keywordsEnabled: boolean;
  campaignsEnabled: boolean;
  impersonationEnabled: boolean;
  onChange: (changes: {
    keywordsEnabled?: boolean;
    campaignsEnabled?: boolean;
    impersonationEnabled?: boolean;
  }) => void;
}

export function DetectorSwitches({
  t,
  keywordsEnabled,
  campaignsEnabled,
  impersonationEnabled,
  onChange,
}: Props) {
  return (
    <section aria-labelledby="detectors-heading">
      <h2 id="detectors-heading">{t.detectorsHeading}</h2>

      <label className="switch">
        <input
          type="checkbox"
          checked={keywordsEnabled}
          onChange={(e) => onChange({ keywordsEnabled: e.target.checked })}
        />
        <span>
          <strong>{t.keywordsToggle}</strong>
          <span className="muted">{t.keywordsToggleHelp}</span>
        </span>
      </label>

      <label className="switch">
        <input
          type="checkbox"
          checked={campaignsEnabled}
          onChange={(e) => onChange({ campaignsEnabled: e.target.checked })}
        />
        <span>
          <strong>{t.campaignsToggle}</strong>
          <span className="muted">{t.campaignsToggleHelp}</span>
        </span>
      </label>

      <label className="switch">
        <input
          type="checkbox"
          checked={impersonationEnabled}
          onChange={(e) => onChange({ impersonationEnabled: e.target.checked })}
        />
        <span>
          <strong>{t.impersonationToggle}</strong>
          <span className="muted">{t.impersonationToggleHelp}</span>
        </span>
      </label>

      {!keywordsEnabled && campaignsEnabled && <p className="note">{t.campaignNeedsKeywords}</p>}
    </section>
  );
}
