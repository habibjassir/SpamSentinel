import type { Language, Messages } from '../../src/i18n/index.ts';

interface Props {
  t: Messages;
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelect({ t, value, onChange }: Props) {
  return (
    <label className="language-select">
      {t.languageLabel}
      <select value={value} onChange={(e) => onChange(e.target.value as Language)}>
        <option value="es">{t.languageEs}</option>
        <option value="en">{t.languageEn}</option>
      </select>
    </label>
  );
}
