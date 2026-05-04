type AppLogoMarkProps = {
  className?: string;
};

const AppLogoMark = ({ className = "" }: AppLogoMarkProps) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="app-logo-bg"
          x1="10"
          y1="8"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#34D399" />
          <stop offset="0.55" stopColor="#10B981" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient
          id="app-logo-loop"
          x1="18"
          y1="16"
          x2="48"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ECFDF5" />
          <stop offset="1" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>

      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="18"
        fill="url(#app-logo-bg)"
      />
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="18"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.2"
      />

      <circle
        cx="32"
        cy="32"
        r="15.5"
        stroke="url(#app-logo-loop)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="62 16"
      />

      <path
        d="M41.8 18.8c-1.8-1.1-3.9-1.7-6.1-1.7-5.7 0-10.5 4.1-11.5 9.6 2.7-2.4 6.2-3.9 9.9-3.9 3.9 0 7.5 1.7 10.1 4.4-0.3-3-1.6-5.8-3.9-8.4Z"
        fill="#F0FDF4"
      />
      <path
        d="M23.4 44.2c1.8 1.1 3.9 1.7 6.1 1.7 5.7 0 10.5-4.1 11.5-9.6-2.7 2.4-6.2 3.9-9.9 3.9-3.9 0-7.5-1.7-10.1-4.4.3 3 1.6 5.8 3.9 8.4Z"
        fill="#D1FAE5"
      />
      <path d="M46.6 24.5l4.9 1.1-2.4-4.4-2.5 3.3Z" fill="#F0FDF4" />
      <path d="M17.4 39.5l-4.9-1.1 2.4 4.4 2.5-3.3Z" fill="#F0FDF4" />
      <circle cx="32" cy="32" r="5.5" fill="#FFFFFF" fillOpacity="0.96" />
      <path
        d="M31.5 26.7c2.2 0 4 1.8 4 4 0 3.2-2.3 5.8-5.2 5.8-.7 0-1.4-.1-2-.3.4-4.5 1.3-7.8 3.2-9.5Z"
        fill="#059669"
      />
      <path
        d="M33 26.9c-1.4-.1-2.9.3-4.2 1.1-1.2.7-2.1 1.7-2.7 2.9.9-.2 1.8-.4 2.7-.4 1.6 0 3 .3 4.2 1 1.2.6 2.2 1.6 2.8 2.8.4-2.7-.1-5-1.4-7.4-.5-.6-.9-1-1.4-1Z"
        fill="#D1FAE5"
      />
    </svg>
  );
};

export default AppLogoMark;
