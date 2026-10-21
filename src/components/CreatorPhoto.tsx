import { useState } from 'react';
import { useT } from '../hooks/useT';

const SOURCES = {
  /** Square portrait, used by the creator profile. */
  portrait: { src: '/creator/abdelkhalek-mammeri.jpg', width: 512, height: 512 },
  /** Head crop, used for the small round avatars. */
  avatar: { src: '/creator/abdelkhalek-mammeri-avatar.jpg', width: 256, height: 256 },
} as const;

export type CreatorPhotoVariant = keyof typeof SOURCES;

interface CreatorPhotoProps {
  variant?: CreatorPhotoVariant;
  /** Rendered size in pixels. The file keeps its own aspect ratio. */
  size?: number;
  className?: string;
  loading?: 'eager' | 'lazy';
}

/**
 * The real photograph of the creator.
 *
 * The file is served from `public/creator/` so it works in development and
 * in the production build. If the image cannot be loaded the component
 * falls back to the initials instead of showing a broken image.
 */
export function CreatorPhoto({
  variant = 'avatar',
  size,
  className,
  loading = 'lazy',
}: CreatorPhotoProps) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const source = SOURCES[variant];
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  if (failed) {
    return (
      <span
        className={`creator-photo creator-fallback ${className ?? ''}`}
        style={style}
        aria-hidden="true"
        data-testid="creator-fallback"
      >
        AM
      </span>
    );
  }

  return (
    <img
      className={`creator-photo ${className ?? ''}`}
      src={source.src}
      width={source.width}
      height={source.height}
      style={style}
      alt={t('creator.alt')}
      loading={loading}
      decoding="async"
      data-testid="creator-photo"
      onError={() => setFailed(true)}
    />
  );
}
