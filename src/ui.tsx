import type { ReactNode } from 'react';
import { useI18n } from './i18n';

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="segmented lang-switch" role="radiogroup" aria-label={t.language}>
      {(['en', 'es'] as const).map((l) => (
        <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-title">
        <h1>{title}</h1>
        {children}
      </div>
      <LangSwitch />
    </header>
  );
}
