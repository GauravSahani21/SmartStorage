// Modern vault/shield SVG logo component
export default function VaultLogo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vault-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Shield body */}
      <path
        d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.4C22.9 28.8 28 22.6 28 16V7L16 2z"
        fill="url(#vault-grad)"
        opacity="0.15"
      />
      <path
        d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.4C22.9 28.8 28 22.6 28 16V7L16 2z"
        stroke="url(#vault-grad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lock body */}
      <rect x="11" y="14" width="10" height="8" rx="1.5" fill="url(#vault-grad)" opacity="0.9" />
      {/* Lock shackle */}
      <path
        d="M13 14v-2a3 3 0 016 0v2"
        stroke="url(#vault-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole */}
      <circle cx="16" cy="18" r="1.2" fill="white" opacity="0.9" />
      <rect x="15.3" y="18.8" width="1.4" height="2" rx="0.7" fill="white" opacity="0.9" />
    </svg>
  );
}
