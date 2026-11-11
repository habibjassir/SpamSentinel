import { useEffect, useState } from 'react';
import { format, messages } from '../../src/i18n/index.ts';
import { loadSettings, saveSettings } from '../../src/storage/index.ts';
import type { Settings } from '../../src/storage/index.ts';
import { DetectorSwitches } from './DetectorSwitches.tsx';
import { LanguageSelect } from './LanguageSelect.tsx';
import { ListEditor } from './ListEditor.tsx';
import { RuleList } from './RuleList.tsx';
import { ScanSettings } from './ScanSettings.tsx';

/**
 * Options page. Every change is saved immediately (autosave); rules have their
 * own "Save rule" button because they must be validated first.
 */
export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (settings) document.documentElement.lang = settings.language;
  }, [settings?.language]);

  if (!settings) return <p className="loading">{messages.en.loading}</p>;

  const t = messages[settings.language];

  const update = (changes: Partial<Settings>) => {
    const next = { ...settings, ...changes };
    setSettings(next);
    saveSettings(next).then(
      () => setSaveError(null),
      (error: unknown) => setSaveError(error instanceof Error ? error.message : String(error)),
    );
  };

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>{t.appTitle}</h1>
          <p className="muted">{t.appSubtitle}</p>
        </div>
        <LanguageSelect
          t={t}
          value={settings.language}
          onChange={(language) => update({ language })}
        />
      </header>

      {saveError && (
        <p role="alert" className="error-banner">
          {format(t.saveFailed, { error: saveError })}
        </p>
      )}

      <DetectorSwitches
        t={t}
        keywordsEnabled={settings.keywordsEnabled}
        campaignsEnabled={settings.campaignsEnabled}
        onChange={update}
      />

      <ScanSettings
        t={t}
        autoScan={settings.autoScan}
        scanDelayMs={settings.scanDelayMs}
        onChange={update}
      />

      <RuleList t={t} rules={settings.rules} onChange={(rules) => update({ rules })} />

      <ListEditor
        heading={t.exemptHeading}
        help={t.exemptHelp}
        placeholder={t.exemptPlaceholder}
        items={settings.exemptPhrases}
        onChange={(exemptPhrases) => update({ exemptPhrases })}
        t={t}
      />

      <ListEditor
        heading={t.allowlistHeading}
        help={t.allowlistHelp}
        placeholder={t.allowlistPlaceholder}
        items={settings.allowlist}
        onChange={(allowlist) => update({ allowlist })}
        t={t}
      />
    </main>
  );
}
