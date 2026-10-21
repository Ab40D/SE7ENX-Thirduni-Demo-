import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutSection } from './components/AboutSection';
import { AssistantPanel } from './components/AssistantPanel';
import { DevicePanel } from './components/DevicePanel';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { Guide } from './components/Guide';
import { CreatorPhoto } from './components/CreatorPhoto';
import { GuideAudioBar } from './components/GuideAudioBar';
import { HistoryPanel } from './components/HistoryPanel';
import { InspectorPanel } from './components/InspectorPanel';
import { IntroOverlay } from './components/IntroOverlay';
import { ModeSelector } from './components/ModeSelector';
import { SimulationClock } from './components/SimulationClock';
import { Stage } from './components/Stage';
import { TopBar } from './components/TopBar';
import { Tour, TOUR_STEPS } from './components/Tour';
import { isRtl } from './core/i18n';
import { useAppStore } from './store/app';
import { useT } from './hooks/useT';

const INTRO_DURATION = 7200;

export default function App() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const phase = useAppStore((s) => s.phase);
  const setPhase = useAppStore((s) => s.setPhase);
  const announcement = useAppStore((s) => s.announcement);
  const guideExpression = useAppStore((s) => s.guideExpression);
  const selectedDevice = useAppStore((s) => s.selectedDevice);

  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const experienceRef = useRef<HTMLDivElement>(null);

  /* Intro timeline ------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'intro') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setProgress(1);
      setIntroDone(true);
      return;
    }
    const started = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const value = Math.min(1, (now - started) / INTRO_DURATION);
      setProgress(value);
      if (value >= 1) {
        setIntroDone(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* Keyboard: Escape skips the intro ------------------------------- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phase === 'intro') {
        setPhase('app');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, setPhase]);

  const explore = useCallback(() => {
    setPhase('app');
    window.setTimeout(() => {
      experienceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [setPhase]);

  const skip = useCallback(() => {
    setProgress(1);
    setIntroDone(true);
    setPhase('app');
  }, [setPhase]);

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const assemble = phase === 'intro' ? Math.min(1, Math.max(0, (progress - 0.12) / 0.78)) : 1;

  const guideMessage = (() => {
    if (!selectedDevice) return t('panel.devices');
    switch (selectedDevice) {
      case 'light':
        return t('light.brightness');
      case 'shutter':
        return t('shutter.semantics');
      case 'plug':
        return t('plug.hint');
      case 'ambient':
        return t('ambient.hint');
      case 'climate':
        return t('climate.hint');
      case 'occupancy':
        return t('occupancy.hint');
      default:
        return t('panel.inspector');
    }
  })();

  return (
    <div className={`app-shell ${phase === 'intro' ? 'is-intro' : ''}`} dir={isRtl(lang) ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#experience">
        {t('nav.experience')}
      </a>

      <TopBar onStartTour={() => setTourOpen(true)} onScrollTo={scrollTo} />

      <SimulationClock />

      <div className="layout" id="experience">
        <div className="stage-column">
          <Stage assemble={assemble} introActive={phase === 'intro'} />

          <div className="panel">
            <div className="panel-body" style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <div data-tour="guide">
                <Guide expression={guideExpression} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="guide-name">{t('guide.intro')}</span>
                <p style={{ fontSize: 13.5, color: 'var(--gray)' }}>{guideMessage}</p>
                <p className="creator-chip">
                  <CreatorPhoto variant="avatar" size={26} />
                  <span>{t('creator.name')}</span>
                  <span className="creator-chip-role">{t('creator.role')}</span>
                </p>
                <div style={{ marginTop: 10 }}>
                  <GuideAudioBar text={guideMessage} />
                </div>
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn" onClick={() => setTourOpen(true)}>
                    {t('footer.startTour')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      useAppStore.getState().dispatch({ kind: 'reset' }, 'system');
                    }}
                  >
                    {t('app.reset')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AssistantPanel />
        </div>

        <aside className="sidebar" aria-label={t('panel.devices')}>
          <ModeSelector />
          <DevicePanel />
          <InspectorPanel />
          <HistoryPanel />
          <EnvironmentPanel />
        </aside>
      </div>

      <AboutSection />

      <footer className="app-footer">
        <span>{t('about.credit')}</span>
        <span>{t('footer.privacy')}</span>
      </footer>

      {phase === 'intro' && (
        <IntroOverlay
          progress={progress}
          done={introDone}
          onExplore={explore}
          onSkip={skip}
        />
      )}

      <Tour
        open={tourOpen}
        step={tourStep}
        onStep={setTourStep}
        onClose={() => setTourOpen(false)}
      />

      <div className="sr-only" role="status" aria-live="polite" data-testid="live-region">
        {announcement}
      </div>
    </div>
  );
}

export { TOUR_STEPS };
