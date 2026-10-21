import { LANGUAGES, type LanguageCode } from '../core/types';
import { useAppStore } from '../store/app';
import { useT } from '../hooks/useT';

interface TopBarProps {
  onStartTour: () => void;
  onScrollTo: (id: string) => void;
}

export function TopBar({ onStartTour, onScrollTo }: TopBarProps) {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  return (
    <header className="topbar">
      <a className="brand" href="#experience">
        <span className="brand-mark" aria-hidden="true">
          S7
        </span>
        <span className="brand-text">
          <span className="brand-name">SE7ENX</span>
          <span className="brand-sub">{t('app.tagline')}</span>
        </span>
      </a>

      <span className="badge">
        <span className="dot" aria-hidden="true" />
        {t('app.badge.simulation')}
      </span>

      <span className="topbar-spacer" />

      <nav className="topbar-nav" aria-label={t('nav.experience')}>
        <button type="button" className="nav-link" onClick={() => onScrollTo('experience')}>
          {t('nav.experience')}
        </button>
        <button type="button" className="nav-link" onClick={onStartTour}>
          {t('nav.tour')}
        </button>
        <button type="button" className="nav-link" onClick={() => onScrollTo('about')}>
          {t('nav.about')}
        </button>
      </nav>

      <label className="sr-only" htmlFor="language-select">
        {t('nav.language')}
      </label>
      <select
        id="language-select"
        className="lang-select"
        value={lang}
        onChange={(event) => setLang(event.target.value as LanguageCode)}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.native}
          </option>
        ))}
      </select>
    </header>
  );
}
