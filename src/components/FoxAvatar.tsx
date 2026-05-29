type Props = {
  size?: number;
  className?: string;
};

export function FoxAvatar({ size = 40, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="32" cy="34" r="22" fill="#E07A3A" />
      <path d="M14 18 L22 30 L18 12 Z" fill="#E07A3A" />
      <path d="M50 18 L42 30 L46 12 Z" fill="#E07A3A" />
      <path d="M14 18 L18 12 L22 22 Z" fill="#F4A261" />
      <path d="M50 18 L46 12 L42 22 Z" fill="#F4A261" />
      <ellipse cx="32" cy="38" rx="13" ry="11" fill="#FFF5EB" />
      <circle cx="24" cy="32" r="3.2" fill="#2D2A26" />
      <circle cx="40" cy="32" r="3.2" fill="#2D2A26" />
      <circle cx="25" cy="31" r="1" fill="#fff" opacity="0.85" />
      <circle cx="41" cy="31" r="1" fill="#fff" opacity="0.85" />
      <ellipse cx="32" cy="37" rx="2.2" ry="1.6" fill="#C96A2E" />
      <path d="M32 39 C30 42 28 43 26 42" stroke="#C96A2E" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M32 39 C34 42 36 43 38 42" stroke="#C96A2E" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
