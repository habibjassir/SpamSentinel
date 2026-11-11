import { useId, useState } from 'react';
import { format } from '../../src/i18n/index.ts';
import type { Messages } from '../../src/i18n/index.ts';

interface Props {
  heading: string;
  help: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  t: Messages;
}

/** Editable list of short texts (exempt phrases, allowlist). Blank and duplicate entries are ignored. */
export function ListEditor({ heading, help, placeholder, items, onChange, t }: Props) {
  const [draft, setDraft] = useState('');
  const headingId = useId();
  const inputId = useId();

  const add = () => {
    const value = draft.trim();
    if (value === '') return;
    const exists = items.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...items, value]);
    setDraft('');
  };

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>
      <p className="muted">{help}</p>

      <form
        className="list-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          {heading}
        </label>
        <input
          id={inputId}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">{t.listAdd}</button>
      </form>

      {items.length === 0 ? (
        <p className="muted">{t.listEmpty}</p>
      ) : (
        <ul className="chips">
          {items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <button
                type="button"
                className="icon-button"
                aria-label={format(t.listRemoveLabel, { item })}
                onClick={() => onChange(items.filter((i) => i !== item))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
