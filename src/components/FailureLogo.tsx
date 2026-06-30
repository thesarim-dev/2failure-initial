interface FailureLogoProps {
  size?: number;
  className?: string;
  title?: string;
  decorative?: boolean;
}

/** U + up-arrow mark (red left leg, green right leg with arrowhead). */
export function FailureLogo({
  size = 72,
  className = '',
  title = '2failure',
  decorative = false
}: FailureLogoProps) {
  const height = size * (96 / 88);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 88 96"
      className={`failure-logo ${className}`.trim()}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}>
      {/* Red left leg */}
      <path
        d="M 22 17 L 22 74 Q 22 91 44 91"
        fill="none"
        stroke="#ff4466"
        strokeWidth="7.5"
        strokeLinecap="round"
      />

      {/* Green U curve + stem (stops at arrow base) */}
      <path
        d="M 44 91 Q 66 91 66 74 L 66 47"
        fill="none"
        stroke="#22c55e"
        strokeWidth="7.5"
        strokeLinecap="round"
      />

      {/* Green up arrowhead */}
      <path
        d="M 66 9 L 48 47 L 84 47 Z"
        fill="#22c55e"
        stroke="none"
      />
    </svg>
  );
}
