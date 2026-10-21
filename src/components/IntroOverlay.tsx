import { useEffect, useState } from 'react';
import { Guide } from './Guide';
import { CreatorPhoto } from './CreatorPhoto';
import { GuideAudioBar } from './GuideAudioBar';
import { useT } from '../hooks/useT';
import { useAppStore } from '../store/app';

const LINES = [
  'guide.line1',
  'guide.line2',
  'guide.line3',
  'guide.line4',
  'guide.line5',
  'guide.line6',
  'guide.line7',
] as const;

interface IntroOverlayProps {
  /** 0 → 1 cinematic progress */
  progress: number;
  /** true when the cinematic build is finished */
  done: boolean;
  onExplore: () => void;
  onSkip: () => void;
}

/** Architectural floor plan drawn with animated strokes. */
function FloorPlan({ draw }: { draw: number }) {
  const paths = [
    { d: 'M120 90 H1080 V610 H120 Z', delay: 0 },
    { d: 'M520 90 V330', delay: 1 },
    { d: 'M520 400 V610', delay: 2 },
    { d: 'M120 390 H520', delay: 3 },
    { d: 'M640 90 H880', delay: 4 },
    { d: 'M520 330 A70 70 0 0 1 450 400', delay: 5 },
    { d: 'M300 470 H440 V570 H300 Z', delay: 6 },
    { d: 'M620 180 H860 V300 H620 Z', delay: 7 },
    { d: 'M180 150 H380 M180 150 V260 H300', delay: 8 },
    { d: 'M960 150 H1020 V610', delay: 9 },
    { d: 'M120 660 H1080', delay: 10 },
    { d: 'M120 640 V680 M1080 640 V680', delay: 11 },
  ];

  const progressFor = (delay: number) => {
    const span = 1 / 1.35;
    const start = (delay / paths.length) * (1 - span);
    return Math.min(1, Math.max(0, (draw - start) / span));
  };

  return (
    <svg className="plan-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {paths.map((path, index) => (
        <path
          key={path.d}
          className={`plan-line ${index >= paths.length - 2 ? 'dim' : ''}`}
          d={path.d}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progressFor(path.delay)}
          style={{ transition: 'stroke-dashoffset 120ms linear' }}
        />
      ))}
    </svg>
  );
}

export function IntroOverlay({ progress, done, onExplore, onSkip }: IntroOverlayProps) {
  const t = useT();
  const setGuideExpression = useAppStore((s) => s.setGuideExpression);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!done) return;
    setLine(0);
    const timer = window.setInterval(() => {
      setLine((current) => {
        if (current >= LINES.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, [done]);

  useEffect(() => {
    setGuideExpression(done ? 'speaking' : 'idle');
  }, [done, setGuideExpression]);

  const draw = Math.min(1, progress / 0.3);
  const stageLabel = progress < 0.3 ? t('intro.planLabel') : progress < 0.92 ? t('intro.assembleLabel') : t('intro.liveLabel');

  return (
    <>
      {progress < 0.75 && <FloorPlan draw={draw} />}

      <div className="intro-overlay">
        <div className="intro-top">
          <div className="brand intro-brand">
            <span className="brand-mark" aria-hidden="true">
              S7
            </span>
            <span className="brand-text">
              <span className="brand-name">SE7ENX</span>
              <span className="brand-sub">{t('app.tagline')}</span>
            </span>
          </div>
          <button type="button" className="intro-btn ghost" onClick={onSkip} data-testid="intro-skip">
            {t('intro.skip')}
          </button>
        </div>

        <div className="intro-bottom">
          <div className="intro-copy">
            <span className="intro-kicker">{t('intro.kicker')}</span>
            <h1>{t('intro.headline')}</h1>
            <p>{t('intro.description')}</p>

            {done && (
              <div className="guide" data-tour="guide" style={{ marginTop: 24 }}>
                <Guide expression="speaking" speaking />
                <div className="guide-bubble">
                  <span className="guide-name">{t('guide.intro')}</span>
                  {t(LINES[line])}
                  <div style={{ marginTop: 10 }}>
                    <GuideAudioBar text={t(LINES[line])} />
                  </div>
                </div>
              </div>
            )}

            <div className="intro-meta">
              <CreatorPhoto variant="avatar" size={40} loading="eager" className="intro-avatar" />
              <span>{t('app.creator')}</span>
              <span>·</span>
              <span>{t('app.community')}</span>
            </div>
          </div>

          <div className="intro-actions">
            <div className="intro-progress">
              <span>{stageLabel}</span>
              <span className="intro-progress-track" aria-hidden="true">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </span>
            </div>
            <button
              type="button"
              className="intro-btn"
              onClick={onExplore}
              disabled={!done}
              data-testid="intro-explore"
            >
              {t('intro.explore')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
