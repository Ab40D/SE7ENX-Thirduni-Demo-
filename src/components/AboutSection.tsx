import { useT } from '../hooks/useT';
import { CreatorPhoto } from './CreatorPhoto';
import { CommunityCredit } from './CommunityCredit';

export function AboutSection() {
  const t = useT();

  const future = [
    t('about.future.homes'),
    t('about.future.hotels'),
    t('about.future.offices'),
    t('about.future.industrial'),
    t('about.future.protocols'),
  ];

  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about-inner">
        <div>
          <h2 id="about-title">{t('about.title')}</h2>
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>

          <figure className="creator-profile" data-testid="creator-profile">
            <CreatorPhoto variant="portrait" size={132} className="creator-portrait" />
            <figcaption>
              <strong>{t('creator.name')}</strong>
              <span className="creator-profile-role">{t('creator.role')}</span>
              <p>{t('creator.bio')}</p>
            </figcaption>
          </figure>

          <div className="disclosure">
            <strong>{t('about.disclosure')}</strong>
          </div>
          <CommunityCredit />
        </div>

        <div>
          <h3 className="panel-title">{t('about.future.title')}</h3>
          <ul className="future-list">
            {future.map((item, index) => (
              <li key={item}>
                <span className="num">{String(index + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="disclosure" style={{ marginTop: '24px' }}>
            <span>
              <strong>{t('about.today')}</strong>
            </span>
            <span>{t('about.tomorrow')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
