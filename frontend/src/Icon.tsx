export default function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    patients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2" />
      </>
    ),
    medications: (
      <>
        <path d="m9 15 6-6M5 19a5 5 0 0 1 0-7l7-7a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0Z" />
      </>
    ),
    batches: (
      <>
        <path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 5" />
      </>
    ),
    prescriptions: (
      <>
        <path d="M7 3H5v18h14V3h-2M9 3h6v4H9zM8 12h8m-8 4h5" />
      </>
    ),
    dispensings: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6M3 3v6h6m3-2v6l4 2" />
      </>
    ),
    dispense: (
      <>
        <path d="M12 3v18M3 12h18" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    admin: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    logout: (
      <>
        <path d="M9 4H4v16h5m5-15 7 7-7 7M8 12h13" />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z" />
      </>
    ),
    delete: (
      <>
        <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
      </>
    ),
    users: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    categories: (
      <>
        <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
      </>
    ),
    suppliers: (
      <>
        <path d="M3 6h12v12H3zM15 10h4l3 4v4h-7" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </>
    ),
    doctors: (
      <>
        <path d="M6 3v6a6 6 0 0 0 12 0V3M4 3h4m8 0h4M12 15v2a4 4 0 0 0 8 0v-2" />
        <circle cx="20" cy="12" r="3" />
      </>
    ),
    cross: <path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5V3Z" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || paths.categories}
    </svg>
  );
}
