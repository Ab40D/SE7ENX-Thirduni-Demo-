import { useId } from 'react';
import type { GuideExpression } from '../store/app';

interface GuideProps {
  expression?: GuideExpression;
  speaking?: boolean;
  className?: string;
}

const BROW: Record<GuideExpression, { left: number; right: number }> = {
  idle: { left: -4, right: 4 },
  speaking: { left: -4, right: 4 },
  explaining: { left: -7, right: 7 },
  pointing: { left: -6, right: 6 },
  thinking: { left: -10, right: 2 },
  concerned: { left: 8, right: -8 },
  success: { left: -8, right: 8 },
};

const MOUTH: Record<GuideExpression, string> = {
  idle: 'M52 78 Q60 82 68 78',
  speaking: 'M52 76 Q60 84 68 76',
  explaining: 'M51 77 Q60 84 69 77',
  pointing: 'M52 77 Q60 82 68 77',
  thinking: 'M53 79 Q60 80 67 79',
  concerned: 'M52 81 Q60 76 68 81',
  success: 'M50 75 Q60 86 70 75',
};

/**
 * SE7ENX — the cartoon presenter.
 * Black-and-white vector illustration: round glasses, short beard, young
 * engineering personality. Drawn from scratch, inspired by the creator's
 * appearance (no photorealistic likeness is implied).
 */
export function Guide({ expression = 'idle', speaking = false, className }: GuideProps) {
  const clipId = useId();
  const brow = BROW[expression];
  const mouth = MOUTH[expression];

  return (
    <svg
      className={`guide-figure ${className ?? ''}`}
      viewBox="0 0 120 150"
      role="img"
      aria-label="SE7ENX cartoon guide"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="120" height="150" />
        </clipPath>
        <linearGradient id={`${clipId}-shirt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2F2F2" />
          <stop offset="100%" stopColor="#D8D8D8" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* arm (drawn behind the torso) */}
        {expression === 'pointing' ? (
          <path
            d="M88 124 C106 122 120 114 128 105"
            fill="none"
            stroke="#E4E4E4"
            strokeWidth="9"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M90 126 C99 134 98 145 94 150"
            fill="none"
            stroke="#DCDCDC"
            strokeWidth="9"
            strokeLinecap="round"
          />
        )}

        {/* shoulders / t-shirt */}
        <path
          d="M22 150 C22 127 37 113 60 113 C83 113 98 127 98 150 Z"
          fill={`url(#${clipId}-shirt)`}
          stroke="#111111"
          strokeWidth="1.7"
        />
        {/* collar */}
        <path
          d="M49 114 C53 123 67 123 71 114"
          fill="none"
          stroke="#111111"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* engineer badge */}
        <rect x="73" y="128" width="11" height="8" rx="1.5" fill="#111111" opacity="0.85" />
        <rect x="75" y="130" width="7" height="1.4" rx="0.7" fill="#FFFFFF" opacity="0.8" />

        {/* neck */}
        <path d="M51 90 h18 v24 c-5 5-13 5-18 0 Z" fill="#E4E4E4" stroke="#111111" strokeWidth="1.5" />

        {/* ears */}
        <ellipse cx="29" cy="56" rx="5" ry="8" fill="#EDEDED" stroke="#111111" strokeWidth="1.4" />
        <ellipse cx="91" cy="56" rx="5" ry="8" fill="#EDEDED" stroke="#111111" strokeWidth="1.4" />

        {/* head */}
        <ellipse cx="60" cy="54" rx="31" ry="34" fill="#F4F4F4" stroke="#111111" strokeWidth="1.7" />

        {/* hair */}
        <path
          d="M29 47 C29 23 44 15 60 15 C77 15 92 24 91 48 C89 40 85 32 76 29 C70 35 58 38 48 35 C41 37 33 42 29 47 Z"
          fill="#1A1A1A"
        />
        <path
          d="M29 48 C31 36 38 28 46 26"
          fill="none"
          stroke="#333333"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* brows */}
        <g stroke="#111111" strokeWidth="2.4" strokeLinecap="round">
          <line x1="40" y1={37 - brow.left * 0.4} x2="51" y2={34.5 + brow.left * 0.4} />
          <line x1="69" y1={34.5 + brow.right * 0.4} x2="80" y2={37 - brow.right * 0.4} />
        </g>

        {/* glasses */}
        <g>
          <circle cx="46" cy="53" r="11" fill="#FFFFFF" fillOpacity="0.65" stroke="#111111" strokeWidth="2" />
          <circle cx="74" cy="53" r="11" fill="#FFFFFF" fillOpacity="0.65" stroke="#111111" strokeWidth="2" />
          <path d="M57 52 h6" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 51 L29 49" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
          <path d="M85 51 L91 49" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* eyes */}
        <g className="guide-eyes">
          <circle cx="46" cy="54" r="2.6" fill="#111111" />
          <circle cx="74" cy="54" r="2.6" fill="#111111" />
        </g>

        {/* nose */}
        <path d="M60 58 v7 c0 2-2 3-4 3" fill="none" stroke="#BBBBBB" strokeWidth="1.4" strokeLinecap="round" />

        {/* beard */}
        <path
          d="M37 66 C40 86 50 94 60 94 C70 94 80 86 83 66 C80 78 72 84 60 84 C48 84 40 78 37 66 Z"
          fill="#2B2B2B"
        />
        <path
          d="M46 69 q14 9 28 0 q-3 13-14 14 q-11-1-14-14 Z"
          fill="#F4F4F4"
        />
        <path d="M47 78 q13 5 26 0 q-2 9-13 10 q-11-1-13-10 Z" fill="#EDEDED" opacity="0.9" />

        {/* mouth */}
        <path
          d={mouth}
          fill={expression === 'speaking' ? '#111111' : 'none'}
          stroke="#111111"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* subtle smile line when speaking */}
        {speaking && (
          <circle cx="60" cy="86" r="1.5" fill="#111111">
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </svg>
  );
}
