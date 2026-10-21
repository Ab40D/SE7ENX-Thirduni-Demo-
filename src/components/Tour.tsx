import { useEffect, useLayoutEffect, useState } from 'react';
import { useT } from '../hooks/useT';

interface TourStep {
  titleKey: 'tour.t1.title' | 'tour.t2.title' | 'tour.t3.title' | 'tour.t4.title' | 'tour.t5.title' | 'tour.t6.title' | 'tour.t7.title';
  bodyKey:
    | 'tour.t1.body'
    | 'tour.t2.body'
    | 'tour.t3.body'
    | 'tour.t4.body'
    | 'tour.t5.body'
    | 'tour.t6.body'
    | 'tour.t7.body';
  hintKey:
    | 'tour.t1.hint'
    | 'tour.t2.hint'
    | 'tour.t3.hint'
    | 'tour.t4.hint'
    | 'tour.t5.hint'
    | 'tour.t6.hint'
    | 'tour.t7.hint';
  selector: string;
}

export const TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.t1.title', bodyKey: 'tour.t1.body', hintKey: 'tour.t1.hint', selector: '[data-tour="guide"]' },
  { titleKey: 'tour.t2.title', bodyKey: 'tour.t2.body', hintKey: 'tour.t2.hint', selector: '[data-tour="stage"]' },
  { titleKey: 'tour.t3.title', bodyKey: 'tour.t3.body', hintKey: 'tour.t3.hint', selector: '[data-tour="light-switch"]' },
  { titleKey: 'tour.t4.title', bodyKey: 'tour.t4.body', hintKey: 'tour.t4.hint', selector: '[data-tour="brightness"]' },
  { titleKey: 'tour.t5.title', bodyKey: 'tour.t5.body', hintKey: 'tour.t5.hint', selector: '[data-tour="mode-voice"]' },
  { titleKey: 'tour.t6.title', bodyKey: 'tour.t6.body', hintKey: 'tour.t6.hint', selector: '[data-tour="mode-gesture"]' },
  { titleKey: 'tour.t7.title', bodyKey: 'tour.t7.body', hintKey: 'tour.t7.hint', selector: '[data-tour="shutter"]' },
];

interface TourProps {
  open: boolean;
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}

export function Tour({ open, step, onStep, onClose }: TourProps) {
  const t = useT();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = TOUR_STEPS[Math.min(step, TOUR_STEPS.length - 1)];

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const update = () => {
      const element = document.querySelector(current.selector);
      if (element) {
        setRect(element.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = window.setInterval(update, 700);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearInterval(interval);
    };
  }, [open, current.selector, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLast = step >= TOUR_STEPS.length - 1;

  return (
    <>
      {rect && (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <div className="tour-card" role="dialog" aria-modal="false" aria-label={t('nav.tour')}>
        <div className="tour-head">
          <span>{t('tour.step', { current: step + 1, total: TOUR_STEPS.length })}</span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('tour.skip')}
          </button>
        </div>
        <h3 className="tour-title">{t(current.titleKey)}</h3>
        <p className="tour-body">{t(current.bodyKey)}</p>
        <p className="tour-hint">{t(current.hintKey)}</p>
        <div className="tour-actions">
          <div className="tour-dots">
            {TOUR_STEPS.map((item, index) => (
              <button
                key={item.titleKey}
                type="button"
                className="tour-dot"
                aria-current={index === step}
                aria-label={t(item.titleKey)}
                onClick={() => onStep(index)}
              />
            ))}
          </div>
          <div className="btn-row" style={{ flex: 'none' }}>
            <button
              type="button"
              className="btn"
              disabled={step === 0}
              onClick={() => onStep(Math.max(0, step - 1))}
            >
              {t('tour.previous')}
            </button>
            {isLast ? (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t('tour.finish')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                data-testid="tour-next"
                onClick={() => onStep(Math.min(TOUR_STEPS.length - 1, step + 1))}
              >
                {t('tour.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
