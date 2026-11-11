import { useId, useState } from 'react';
import { validateRule } from '../../src/core/index.ts';
import type { KeywordRule, MatchMode, RuleError, RuleKind } from '../../src/core/index.ts';
import type { Messages } from '../../src/i18n/index.ts';
import { ruleErrorMessage } from './labels.ts';

interface Props {
  t: Messages;
  title: string;
  initial: KeywordRule;
  onSave: (rule: KeywordRule) => void;
  onCancel: () => void;
}

/** Number inputs are text while editing; empty means "no limit". */
const toLimit = (text: string): number | undefined =>
  text.trim() === '' ? undefined : Number(text);
const fromLimit = (value: number | undefined) => (value === undefined ? '' : String(value));

/** Add/edit form for one rule. Validates with the core before saving. */
export function RuleForm({ t, title, initial, onSave, onCancel }: Props) {
  const [kind, setKind] = useState<RuleKind>(initial.kind);
  const [pattern, setPattern] = useState(initial.pattern);
  const [match, setMatch] = useState<MatchMode>(initial.match);
  const [minWords, setMinWords] = useState(fromLimit(initial.minWords));
  const [maxWords, setMaxWords] = useState(fromLimit(initial.maxWords));
  const [category, setCategory] = useState(initial.category);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [errors, setErrors] = useState<RuleError[]>([]);
  const id = useId();

  const errorFor = (field: RuleError['field']) => errors.find((e) => e.field === field);

  const submit = () => {
    const min = toLimit(minWords);
    const max = toLimit(maxWords);
    const rule: KeywordRule = {
      id: initial.id,
      kind,
      pattern: pattern.trim(),
      match,
      ...(min !== undefined ? { minWords: min } : {}),
      ...(max !== undefined ? { maxWords: max } : {}),
      category: category.trim(),
      enabled,
    };
    const found = validateRule(rule);
    setErrors(found);
    if (found.length === 0) onSave(rule);
  };

  const fieldError = (field: RuleError['field']) => {
    const error = errorFor(field);
    return error ? (
      <p role="alert" className="field-error" id={`${id}-${field}-error`}>
        {ruleErrorMessage(t, error.code)}
      </p>
    ) : null;
  };

  return (
    <form
      className="rule-form"
      aria-label={title}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h3>{title}</h3>

      <div className="grid">
        <label>
          {t.fieldKind}
          <select value={kind} onChange={(e) => setKind(e.target.value as RuleKind)}>
            <option value="word">{t.kindWord}</option>
            <option value="phrase">{t.kindPhrase}</option>
            <option value="regex">{t.kindRegex}</option>
          </select>
        </label>

        <label className="wide">
          {t.fieldPattern}
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            aria-invalid={errorFor('pattern') ? true : undefined}
            aria-describedby={errorFor('pattern') ? `${id}-pattern-error` : undefined}
            autoFocus
          />
        </label>

        {kind === 'regex' ? (
          <p className="muted wide">{t.regexNote}</p>
        ) : (
          <label>
            {t.fieldMatch}
            <select value={match} onChange={(e) => setMatch(e.target.value as MatchMode)}>
              <option value="whole-word">{t.matchWholeWord}</option>
              <option value="substring">{t.matchSubstring}</option>
            </select>
          </label>
        )}

        <label>
          {t.fieldMinWords}
          <input
            type="number"
            min={0}
            step={1}
            value={minWords}
            onChange={(e) => setMinWords(e.target.value)}
          />
        </label>

        <label>
          {t.fieldMaxWords}
          <input
            type="number"
            min={0}
            step={1}
            value={maxWords}
            onChange={(e) => setMaxWords(e.target.value)}
          />
        </label>

        <label>
          {t.fieldCategory}
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>

        <label className="inline">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          {t.fieldEnabled}
        </label>
      </div>

      <p className="muted small">{t.fieldWordsHelp}</p>
      {fieldError('pattern')}
      {fieldError('minWords')}
      {fieldError('maxWords')}
      {fieldError('id')}

      <div className="form-actions">
        <button type="submit" className="primary">
          {t.saveRule}
        </button>
        <button type="button" onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
