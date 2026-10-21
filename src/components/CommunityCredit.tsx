import { useEffect, useState } from 'react';
import { useT } from '../hooks/useT';

/**
 * Community credit block.
 *
 * The Thirduni mark is optional: it is only rendered when a mark file has
 * been placed in `public/brand/`. It is always shown next to the plain
 * wording so the image can never be read as an endorsement.
 */
const COMMUNITY_MARK = '/brand/thirduni.png';

export function CommunityCredit() {
  const t = useT();
  const [markAvailable, setMarkAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Probe instead of rendering a broken image: a missing mark file must
    // not produce a console error on every page load. The content type is
    // checked as well, because a dev server answers unknown paths with the
    // single-page app (text/html) instead of a 404.
    fetch(COMMUNITY_MARK)
      .then((response) => {
        const type = response.headers.get('content-type') ?? '';
        if (!cancelled) setMarkAvailable(response.ok && type.startsWith('image/'));
      })
      .catch(() => {
        if (!cancelled) setMarkAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="community-credit" data-testid="community-credit">
      {markAvailable && (
        <img
          className="community-mark"
          src={COMMUNITY_MARK}
          alt={t('credit.mark.alt')}
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          data-testid="community-mark"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      <div className="community-credit-text">
        <strong>{t('about.credit')}</strong>
        <span>{t('credit.disclaimer')}</span>
        <span>{t('about.noLogo')}</span>
      </div>
    </div>
  );
}
