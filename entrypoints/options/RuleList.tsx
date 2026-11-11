import { useState } from 'react';
import type { KeywordRule } from '../../src/core/index.ts';
import { format } from '../../src/i18n/index.ts';
import type { Messages } from '../../src/i18n/index.ts';
import { RuleForm } from './RuleForm.tsx';
import { kindLabel, matchLabel, wordsLabel } from './labels.ts';

interface Props {
  t: Messages;
  rules: KeywordRule[];
  onChange: (rules: KeywordRule[]) => void;
}

/** `null`: no form open. `'new'`: adding a rule. A string id: editing that rule. */
type Editing = null | 'new' | string;

const newRule = (): KeywordRule => ({
  id: `rule-${crypto.randomUUID()}`,
  kind: 'word',
  pattern: '',
  match: 'whole-word',
  category: '',
  enabled: true,
});

export function RuleList({ t, rules, onChange }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<KeywordRule | null>(null);

  const open = (rule: KeywordRule, mode: Editing) => {
    setDraft(rule);
    setEditing(mode);
  };
  const close = () => {
    setDraft(null);
    setEditing(null);
  };

  const save = (rule: KeywordRule) => {
    onChange(
      editing === 'new' ? [...rules, rule] : rules.map((r) => (r.id === rule.id ? rule : r)),
    );
    close();
  };

  return (
    <section aria-labelledby="rules-heading">
      <div className="section-header">
        <div>
          <h2 id="rules-heading">{t.rulesHeading}</h2>
          <p className="muted">{t.rulesHelp}</p>
        </div>
        <button type="button" onClick={() => open(newRule(), 'new')} disabled={editing !== null}>
          {t.addRule}
        </button>
      </div>

      {editing !== null && draft && (
        <RuleForm
          t={t}
          initial={draft}
          title={editing === 'new' ? t.ruleFormNew : t.ruleFormEdit}
          onSave={save}
          onCancel={close}
        />
      )}

      {rules.length === 0 ? (
        <p className="muted">{t.rulesEmpty}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.columnActive}</th>
                <th scope="col">{t.columnPattern}</th>
                <th scope="col">{t.columnKind}</th>
                <th scope="col">{t.columnMatch}</th>
                <th scope="col">{t.columnWords}</th>
                <th scope="col">{t.columnCategory}</th>
                <th scope="col">
                  <span className="visually-hidden">{t.columnActions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      aria-label={format(t.ruleActiveLabel, { pattern: rule.pattern })}
                      onChange={(e) =>
                        onChange(
                          rules.map((r) =>
                            r.id === rule.id ? { ...r, enabled: e.target.checked } : r,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <code>{rule.pattern}</code>
                  </td>
                  <td>{kindLabel(t, rule.kind)}</td>
                  <td>{rule.kind === 'regex' ? '—' : matchLabel(t, rule.match)}</td>
                  <td>{wordsLabel(t, rule)}</td>
                  <td>{rule.category || '—'}</td>
                  <td className="actions">
                    <button
                      type="button"
                      aria-label={format(t.editRuleLabel, { pattern: rule.pattern })}
                      disabled={editing !== null}
                      onClick={() => open({ ...rule }, rule.id)}
                    >
                      {t.editRule}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      aria-label={format(t.deleteRuleLabel, { pattern: rule.pattern })}
                      disabled={editing !== null}
                      onClick={() => onChange(rules.filter((r) => r.id !== rule.id))}
                    >
                      {t.deleteRule}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
